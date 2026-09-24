import { Router } from 'express';
import { supabaseAdmin as supabase, formatSupabaseError } from '../db';
import { requireAuth } from '../middleware';

const router = Router();

interface LeaderboardEntry {
  rank: number;
  name: string;
  school: string;
  region: string;
  stream: string;
  xp: number;
  streak: number;
  examReadinessScore: number;
  email: string;
}

function calculateLeaderScore(entry: any): number {
  const xp = entry.xp || 0;
  const streak = entry.streak_days || 0;
  const readiness = entry.exam_readiness_score || 0;
  return Math.round(xp + (streak * 50) + (readiness * 2));
}

// GET /api/leaderboard — public leaderboard
router.get('/', requireAuth, async (req, res) => {
  try {
    const { stream, limit } = req.query;
    const maxLimit = Math.min(Number(limit) || 50, 100);

    // Order by the dominant score component (xp) so the in-memory computed-score
    // ranking is computed from the true top candidates, not an arbitrary slice.
    let query = supabase
      .from('student_profiles')
      .select('email, name, school, region, stream, xp, streak_days, exam_readiness_score', { count: 'exact' })
      .order('xp', { ascending: false })
      .limit(500);

    if (stream && typeof stream === 'string' && stream !== 'All') {
      query = query.eq('stream', stream);
    }

    const { data, error, count } = await query;

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });

    const entries: LeaderboardEntry[] = (data || [])
      .map((entry: any) => ({
        rank: 0,
        name: entry.name || 'Student',
        school: entry.school || 'Unknown School',
        region: entry.region || 'Unknown',
        stream: entry.stream || 'Natural Science',
        xp: entry.xp || 0,
        streak: entry.streak_days || 0,
        examReadinessScore: entry.exam_readiness_score || 0,
        email: entry.email,
      }))
      .sort((a, b) => {
        const scoreA = calculateLeaderScore(a);
        const scoreB = calculateLeaderScore(b);
        return scoreB - scoreA;
      })
      .slice(0, maxLimit)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    const currentUserEmail = req.user!.email;
    const currentUserEntry = entries.find(e => e.email === currentUserEmail);

    res.json({
      leaderboard: entries.map(({ email, ...rest }) => rest),
      currentUserRank: currentUserEntry ? currentUserEntry.rank : null,
      totalStudents: count || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
