import { Router } from 'express';
import { supabaseAdmin as supabase, formatSupabaseError } from '../db';
import { requireAuth, rateLimitOpts } from '../middleware';
import { validateBody, trackEventSchema } from '../validation';
import rateLimit from 'express-rate-limit';

const router = Router();

const analyticsLimiter = rateLimit(rateLimitOpts({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many analytics requests.' },
}));

// POST /api/analytics/track — record a user event
router.post('/track', requireAuth, analyticsLimiter, validateBody(trackEventSchema), async (req, res) => {
  try {
    const { eventType, subject, score, durationSeconds, metadata } = req.body;

    const { error } = await supabase
      .from('user_analytics')
      .insert([{
        user_email: req.user!.email,
        event_type: eventType,
        subject: subject || null,
        score: score || null,
        duration_seconds: durationSeconds || null,
        metadata: metadata || {},
      }]);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// GET /api/analytics/summary — get user's own analytics
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const email = req.user!.email;

    const { data: events, error } = await supabase
      .from('user_analytics')
      .select('event_type, subject, score, duration_seconds, created_at')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });

    const now = Date.now();
    const dayMs = 86400000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    const todayEvents = (events || []).filter(e => now - new Date(e.created_at).getTime() < dayMs);
    const weekEvents = (events || []).filter(e => now - new Date(e.created_at).getTime() < weekMs);
    const monthEvents = (events || []).filter(e => now - new Date(e.created_at).getTime() < monthMs);

    const totalStudyMinutes = Math.round((events || []).reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / 60);
    const todayMinutes = Math.round(todayEvents.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / 60);
    const weekMinutes = Math.round(weekEvents.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / 60);

    // Subject breakdown
    const subjectMap: Record<string, { count: number; totalScore: number; totalDuration: number }> = {};
    for (const e of (events || [])) {
      const subj = e.subject || 'General';
      if (!subjectMap[subj]) subjectMap[subj] = { count: 0, totalScore: 0, totalDuration: 0 };
      subjectMap[subj].count++;
      subjectMap[subj].totalScore += e.score || 0;
      subjectMap[subj].totalDuration += e.duration_seconds || 0;
    }

    const subjects = Object.entries(subjectMap).map(([name, data]) => ({
      name,
      sessions: data.count,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
      totalMinutes: Math.round(data.totalDuration / 60),
    })).sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Event type breakdown
    const eventTypes: Record<string, number> = {};
    for (const e of (events || [])) {
      eventTypes[e.event_type] = (eventTypes[e.event_type] || 0) + 1;
    }

    // Daily activity for last 7 days
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * dayMs);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayEvents = (events || []).filter(e => {
        const d = new Date(e.created_at);
        return d >= dayStart && d <= dayEnd;
      });
      dailyActivity.push({
        date: dayStart.toISOString().split('T')[0],
        sessions: dayEvents.length,
        minutes: Math.round(dayEvents.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / 60),
      });
    }

    res.json({
      totalStudyMinutes,
      todayMinutes,
      weekMinutes,
      totalSessions: (events || []).length,
      todaySessions: todayEvents.length,
      weekSessions: weekEvents.length,
      subjects,
      eventTypes,
      dailyActivity,
    });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
