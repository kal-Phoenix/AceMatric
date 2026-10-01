import { Router } from 'express';
import { supabaseAdmin as supabase, formatSupabaseError, snakeToCamel, camelToSnake } from '../db';
import { requireAuth } from '../middleware';

const router = Router();

// Milestones are client-toggled progress markers with no server-side proof of
// completion, so this endpoint must be strongly bounded: only well-formed,
// de-duplicated milestone ids are accepted and the total XP it can ever award
// is capped. XP that feeds leaderboards should come from verified activity.
const MILESTONE_ID_REGEX = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_MILESTONE_XP = 2000;
const XP_PER_MILESTONE = 50;
const MAX_MILESTONES = Math.floor(MAX_MILESTONE_XP / XP_PER_MILESTONE); // 40

// Fields the client is allowed to write via POST /api/profile.
// Server-managed fields are excluded — use dedicated endpoints instead:
// - isPremium / premiumExpiresAt: payments routes
// - xp / completedMilestones: /api/profile/gamification
// - dailyQuestionsUsed / dailyProgressDate: /api/usage/questions (server-verified,
//   must not be client-resettable or the daily cap is bypassable)
const ALLOWED_PROFILE_FIELDS = new Set([
  'email', 'name', 'stream', 'language', 'isDarkMode', 'isOfflineMode',
  'savedQuestionIds', 'completedMockIds', 'telegramConnected', 'studyStyle',
  'dailyHours', 'avatar', 'bio', 'school', 'region', 'customRoadmap',
  'weakSubjects', 'targetScore', 'videoWatchHistory',
  'dailyGoalHours', 'notifications', 'activeGrade', 'proStudyAudit', 'studiedChapters',
  // Gamification stats the client maintains; bounded below to reject garbage.
  'streakDays', 'examReadinessScore', 'subjectsPerformance',
]);

function boundedInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const n = Math.floor(value);
  return n >= min && n <= max ? n : null;
}

// Keep only well-formed numeric subject scores: { subject: 0..100 }
function boundedSubjectPerformance(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out: Record<string, number> = {};
  let count = 0;
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (++count > 100 || key.length > 64) return null;
    const score = boundedInt(raw, 0, 100);
    if (score === null) continue;
    out[key] = score;
  }
  return out;
}

// Validate the bounded fields added to the allowlist; drop invalid values
// instead of failing the whole save (never break the profile flow).
function sanitizeProfileFields(profile: Record<string, any>): void {
  const streak = boundedInt(profile.streakDays, 0, 36500);
  if (streak === null) delete profile.streakDays;
  else profile.streakDays = streak;

  const readiness = boundedInt(profile.examReadinessScore, 0, 100);
  if (readiness === null) delete profile.examReadinessScore;
  else profile.examReadinessScore = readiness;

  if ('subjectsPerformance' in profile) {
    const perf = boundedSubjectPerformance(profile.subjectsPerformance);
    if (perf === null) delete profile.subjectsPerformance;
    else profile.subjectsPerformance = perf;
  }
}

// If a column referenced by an older/newer client build is missing in the
// database (migration not yet applied), PostgREST fails the whole upsert.
// Strip the offending field and retry so a single stale column can never
// block profile saves.
const MISSING_COLUMN_REGEX = /Could not find the '([a-z0-9_]+)' column/i;
const MAX_COLUMN_RETRIES = 5;

async function upsertWithColumnFallback(payload: Record<string, any>) {
  let current = payload;
  for (let attempt = 0; attempt <= MAX_COLUMN_RETRIES; attempt++) {
    const { error } = await supabase.from('student_profiles').upsert([camelToSnake(current)]);
    if (!error) return { error: null };

    const missing = error.code === 'PGRST204' ? error.message.match(MISSING_COLUMN_REGEX) : null;
    if (!missing) return { error };

    // snakeToCamel operates on objects, so convert the column name directly.
    const camelKey = missing[1].replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    if (!(camelKey in current)) return { error };
    console.warn(`[profile] Dropping '${camelKey}' — column missing in database. Run migration 020.`);
    const { [camelKey]: _removed, ...rest } = current;
    current = rest;
    if (Object.keys(current).length === 0) return { error };
  }
  return { error: { message: 'Profile contains only unknown columns' } };
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const email = req.body.email;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (req.user!.email !== email.toLowerCase()) {
      return res.status(403).json({ error: 'You can only update your own profile.' });
    }

    const filteredProfile: Record<string, any> = {};
    for (const key of Object.keys(req.body)) {
      if (ALLOWED_PROFILE_FIELDS.has(key)) {
        filteredProfile[key] = req.body[key];
      }
    }
    filteredProfile.email = email.toLowerCase();
    sanitizeProfileFields(filteredProfile);

    const { error } = await upsertWithColumnFallback(filteredProfile);

    if (error) {
      console.error('[profile] Upsert error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[profile] Error updating profile:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

router.get('/:email', requireAuth, async (req, res) => {
  try {
    const emailKey = req.params.email?.trim().toLowerCase();
    if (!emailKey) return res.status(400).json({ error: 'Email is required' });
    if (req.user!.email !== emailKey) {
      return res.status(403).json({ error: 'You can only view your own profile.' });
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('email', emailKey)
      .maybeSingle();

    if (error) {
      console.error('[profile] Fetch error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    if (!data) return res.status(404).json({ error: 'Profile not found' });

    // Check subscription expiry and auto-downgrade
    if (data.is_premium && data.premium_expires_at) {
      const expiresAt = new Date(data.premium_expires_at);
      if (expiresAt < new Date()) {
        // Subscription expired — auto-downgrade
        await supabase
          .from('student_profiles')
          .update({ is_premium: false })
          .eq('email', emailKey);
        data.is_premium = false;
      }
    }

    res.json(snakeToCamel(data));
  } catch (err: any) {
    console.error('[profile] Error fetching profile:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

router.post('/gamification', requireAuth, async (req, res) => {
  try {
    const { completedMilestones } = req.body;

    if (completedMilestones === undefined) {
      return res.status(400).json({ error: 'completedMilestones is required' });
    }

    if (!Array.isArray(completedMilestones)) {
      return res.status(400).json({ error: 'completedMilestones must be an array' });
    }

    if (completedMilestones.length > MAX_MILESTONES) {
      return res.status(400).json({ error: `completedMilestones cannot exceed ${MAX_MILESTONES} items` });
    }

    const cleanedMilestones = [...new Set(
      completedMilestones
        .filter((m: any) => typeof m === 'string' && MILESTONE_ID_REGEX.test(m.trim()))
        .map((m: string) => m.trim())
    )].slice(0, MAX_MILESTONES);

    // XP is computed server-side: 50 XP per milestone completed, bounded by a hard cap
    const milestoneXp = cleanedMilestones.length * XP_PER_MILESTONE;
    const boundedMilestoneXp = Math.min(milestoneXp, MAX_MILESTONE_XP);

    // Fetch current XP to preserve XP from other sources (daily challenges, etc.)
    const { data: currentProfile } = await supabase
      .from('student_profiles')
      .select('xp')
      .eq('email', req.user!.email)
      .maybeSingle();

    const currentXp = (currentProfile as any)?.xp || 0;
    // Use max of milestone-based XP and current XP to prevent regression
    const computedXp = Math.max(boundedMilestoneXp, currentXp);

    const updates: Record<string, any> = {
      completed_milestones: cleanedMilestones,
      xp: computedXp,
    };

    const { error } = await supabase
      .from('student_profiles')
      .update(updates)
      .eq('email', req.user!.email);

    if (error) {
      console.error('[profile] Gamification error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    res.json({ success: true, xp: computedXp });
  } catch (err: any) {
    console.error('[profile] Error updating gamification:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    const email = req.user!.email;

    // Clean up all related data in parallel
    await Promise.allSettled([
      supabase.from('student_profiles').delete().eq('email', email),
      supabase.from('users_auth').delete().eq('email', email),
      supabase.from('student_session_history').delete().eq('user_email', email),
      supabase.from('student_daily_progress').delete().eq('user_email', email),
      supabase.from('push_subscriptions').delete().eq('user_email', email),
      supabase.from('user_analytics').delete().eq('user_email', email),
      supabase.from('notifications').delete().eq('user_email', email),
      supabase.from('refresh_tokens').delete().eq('user_email', email),
      supabase.from('payment_requests').delete().eq('user_email', email),
      supabase.from('student_saved_chapters').delete().eq('user_email', email),
      supabase.from('student_studied_chapters').delete().eq('user_email', email),
      supabase.from('question_flags').delete().eq('user_email', email),
      supabase.from('contact_messages').delete().eq('email', email),
    ]);

    res.json({ success: true, message: 'Account and all associated data have been permanently deleted.' });
  } catch (err: any) {
    console.error('[profile] Error deleting account:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

export default router;
