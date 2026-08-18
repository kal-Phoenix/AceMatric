import { Router } from 'express';
import { supabase, formatSupabaseError, snakeToCamel, camelToSnake } from '../db';
import { requireAuth } from '../middleware';

const router = Router();

// Fields the client is allowed to write via POST /api/profile.
// Server-managed fields (xp, streakDays, examReadinessScore, subjectsPerformance,
// completedMilestones) are excluded — use dedicated endpoints instead.
// NOTE: dailyProgressDate, studiedChapters, proStudyAudit, activeGrade require
// migration 012 to be run in Supabase SQL Editor first.
const ALLOWED_PROFILE_FIELDS = new Set([
  'email', 'name', 'stream', 'language', 'isDarkMode', 'isOfflineMode',
  'savedQuestionIds', 'completedMockIds', 'telegramConnected', 'studyStyle',
  'dailyHours', 'avatar', 'bio', 'school', 'region', 'customRoadmap',
  'weakSubjects', 'targetScore',
]);

// ── POST /api/profile ────────────────────────────────────────────────────────

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

    const { error } = await supabase
      .from('student_profiles')
      .upsert([camelToSnake(filteredProfile)]);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// ── GET /api/profile/:email ──────────────────────────────────────────────────

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

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    if (!data) return res.status(404).json({ error: 'Profile not found' });
    res.json(snakeToCamel(data));
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// ── POST /api/profile/gamification ───────────────────────────────────────────

router.post('/gamification', requireAuth, async (req, res) => {
  try {
    const { xp, completedMilestones } = req.body;

    const updates: Record<string, any> = {};
    if (xp !== undefined) {
      if (typeof xp !== 'number' || xp < 0 || xp > 1000000 || !Number.isFinite(xp)) {
        return res.status(400).json({ error: 'Invalid xp value' });
      }
      updates.xp = Math.floor(xp);
    }
    if (completedMilestones !== undefined) {
      if (!Array.isArray(completedMilestones) || completedMilestones.length > 100) {
        return res.status(400).json({ error: 'Invalid completedMilestones' });
      }
      updates.completed_milestones = completedMilestones.map(String).slice(0, 100);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No gamification fields to update' });
    }

    const { error } = await supabase
      .from('student_profiles')
      .update(updates)
      .eq('email', req.user!.email);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// ── DELETE /api/profile ─────────────────────────────────────────────────────

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
    ]);

    res.json({ success: true, message: 'Account and all associated data have been permanently deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
