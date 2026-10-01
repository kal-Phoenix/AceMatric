import { Router } from 'express';
import { supabaseAdmin as supabase } from '../db';
import { requireAuth } from '../middleware';
import { isPremiumRow, intFromEnv, todayKey, DAILY_QUESTION_CAP_FALLBACK } from '../entitlements';

const router = Router();

// Never let a single call burn more than this, regardless of client input.
const MAX_CONSUME_PER_CALL = 25;

const PROFILE_COLUMNS = 'is_premium, premium_expires_at, daily_questions_used, daily_progress_date';

// POST /api/usage/questions — server-authoritative daily question cap.
// The client used to write dailyQuestionsUsed through the profile endpoint,
// which meant a page reload (or a hand-crafted profile POST) reset the cap.
// This endpoint only ever *increments* the counter for the authenticated user,
// so the free-tier limit cannot be reset from the client.
router.post('/questions', requireAuth, async (req, res) => {
  try {
    const email = req.user!.email;
    const countRaw = Number(req.body?.count);
    const count = Number.isFinite(countRaw)
      ? Math.min(Math.max(Math.floor(countRaw), 1), MAX_CONSUME_PER_CALL)
      : 1;

    const { data: profile, error } = await supabase
      .from('student_profiles')
      .select(PROFILE_COLUMNS)
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('[usage] Profile fetch error:', error);
      return res.status(500).json({ error: 'Could not verify question usage. Please try again.' });
    }

    const premium = isPremiumRow(profile as any);
    const cap = intFromEnv('DAILY_QUESTION_CAP', DAILY_QUESTION_CAP_FALLBACK);
    const today = todayKey();
    const used = profile?.daily_progress_date === today ? (profile?.daily_questions_used || 0) : 0;

    if (!premium && used + count > cap) {
      return res.json({ allowed: false, used, cap, isPremium: false });
    }

    const nextUsed = used + count;

    if (profile) {
      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({ daily_questions_used: nextUsed, daily_progress_date: today })
        .eq('email', email);
      if (updateError) {
        console.error('[usage] Usage update error:', updateError);
        return res.status(500).json({ error: 'Could not record question usage. Please try again.' });
      }
    } else {
      // User has no profile row yet (fresh sign-up, still in onboarding).
      const { error: insertError } = await supabase
        .from('student_profiles')
        .insert([{
          email,
          daily_questions_used: nextUsed,
          daily_progress_date: today,
        }]);
      if (insertError) {
        console.error('[usage] Usage insert error:', insertError);
        return res.status(500).json({ error: 'Could not record question usage. Please try again.' });
      }
    }

    res.json({ allowed: true, used: nextUsed, cap, isPremium: premium });
  } catch (err: any) {
    console.error('[usage] Error recording question usage:', err);
    res.status(500).json({ error: 'Could not record question usage. Please try again.' });
  }
});

export default router;
