import { Router } from 'express';
import { supabase, formatSupabaseError } from '../db';
import { requireAdmin } from '../middleware';
import { logAudit } from '../audit';

const router = Router();

// GET /api/admin/stats — dashboard overview
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const [usersResult, pendingResult, approvedResult, rejectedResult, premiumResult] = await Promise.all([
      supabase.from('student_profiles').select('email'),
      supabase.from('payment_requests').select('id').eq('status', 'pending'),
      supabase.from('payment_requests').select('id').eq('status', 'approved'),
      supabase.from('payment_requests').select('id').eq('status', 'rejected'),
      supabase.from('student_profiles').select('email').eq('is_premium', true),
    ]);

    if (usersResult.error) return res.status(500).json({ error: formatSupabaseError(usersResult.error) });

    const totalUsers = usersResult.data?.length || 0;
    const premiumUsers = premiumResult.data?.length || 0;
    const pending = pendingResult.data?.length || 0;
    const approved = approvedResult.data?.length || 0;
    const rejected = rejectedResult.data?.length || 0;

    res.json({
      totalUsers,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
      totalPayments: pending + approved + rejected,
      pendingPayments: pending,
      approvedPayments: approved,
      rejectedPayments: rejected,
    });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// GET /api/admin/analytics — platform-wide analytics with optional date-range
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { from, to, days = '7' } = req.query;
    const now = Date.now();
    const dayMs = 86400000;
    const rangeDays = Number(days) || 7;
    const rangeMs = rangeDays * dayMs;
    const weekMs = 7 * dayMs;

    // Build query with optional date range
    let query = supabase
      .from('user_analytics')
      .select('user_email, event_type, subject, score, duration_seconds, created_at');

    if (from && typeof from === 'string') query = query.gte('created_at', from);
    if (to && typeof to === 'string') query = query.lte('created_at', to);
    if (!from && !to) {
      const startDate = new Date(now - rangeMs).toISOString();
      query = query.gte('created_at', startDate);
    }

    const { data: events, error: eventsError } = await query
      .order('created_at', { ascending: false })
      .limit(2000);

    if (eventsError) return res.status(500).json({ error: formatSupabaseError(eventsError) });

    const allEvents = events || [];

    // Active users (had at least one event in last 7 days)
    const activeEmails = new Set(
      allEvents
        .filter(e => now - new Date(e.created_at).getTime() < weekMs)
        .map(e => e.user_email)
    );

    // Today's active users
    const todayActiveEmails = new Set(
      allEvents
        .filter(e => now - new Date(e.created_at).getTime() < dayMs)
        .map(e => e.user_email)
    );

    // Subject performance across all users
    const subjectMap: Record<string, { count: number; totalScore: number }> = {};
    for (const e of allEvents) {
      const subj = e.subject || 'General';
      if (!subjectMap[subj]) subjectMap[subj] = { count: 0, totalScore: 0 };
      subjectMap[subj].count++;
      subjectMap[subj].totalScore += e.score || 0;
    }

    const subjectPerformance = Object.entries(subjectMap)
      .map(([name, data]) => ({
        name,
        sessions: data.count,
        avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);

    // Daily active users for last 7 days
    const dailyActiveUsers = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * dayMs);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayUsers = new Set(
        allEvents
          .filter(e => {
            const d = new Date(e.created_at);
            return d >= dayStart && d <= dayEnd;
          })
          .map(e => e.user_email)
      );
      dailyActiveUsers.push({
        date: dayStart.toISOString().split('T')[0],
        activeUsers: dayUsers.size,
        totalSessions: allEvents.filter(e => {
          const d = new Date(e.created_at);
          return d >= dayStart && d <= dayEnd;
        }).length,
      });
    }

    // Top users by session count
    const userSessions: Record<string, number> = {};
    for (const e of allEvents) {
      userSessions[e.user_email] = (userSessions[e.user_email] || 0) + 1;
    }
    const topUsers = Object.entries(userSessions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([email, sessions]) => ({ email, sessions }));

    res.json({
      totalEvents: allEvents.length,
      activeUsersWeekly: activeEmails.size,
      activeUsersToday: todayActiveEmails.size,
      subjectPerformance,
      dailyActiveUsers,
      topUsers,
    });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// GET /api/admin/users — list users with search and pagination
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { search, stream, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, Number(page));
    const pageSize = Math.min(Math.max(1, Number(limit)), 100);
    const from = (pageNum - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('student_profiles')
      .select('email, name, stream, school, region, is_premium, xp, streak_days, exam_readiness_score, role', { count: 'exact' });

    if (search && typeof search === 'string') {
      const term = `%${search.replace(/[%_]/g, m => '\\' + m)}%`;
      query = query.or(`name.ilike.${term},email.ilike.${term},school.ilike.${term}`);
    }
    if (stream && typeof stream === 'string' && stream !== 'All') {
      query = query.eq('stream', stream);
    }

    query = query.order('xp', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: formatSupabaseError(error) });

    res.json({
      users: (data || []).map((u: any) => ({
        email: u.email,
        name: u.name,
        stream: u.stream,
        school: u.school,
        region: u.region,
        isPremium: u.is_premium,
        xp: u.xp,
        streakDays: u.streak_days,
        examReadinessScore: u.exam_readiness_score,
        role: u.role,
      })),
      total: count || 0,
      page: pageNum,
      pageSize,
    });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// PUT /api/admin/users/:email/role — update user role
router.put('/users/:email/role', requireAdmin, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    const { error } = await supabase
      .from('student_profiles')
      .update({ role })
      .eq('email', email);
    if (error) return res.status(500).json({ error: formatSupabaseError(error) });

    await logAudit({ adminEmail: req.user!.email, action: 'role_change', targetEmail: email, details: { newRole: role } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// PUT /api/admin/users/:email/premium — toggle premium status
router.put('/users/:email/premium', requireAdmin, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const { isPremium } = req.body;
    if (typeof isPremium !== 'boolean') {
      return res.status(400).json({ error: 'isPremium must be boolean.' });
    }
    const { error } = await supabase
      .from('student_profiles')
      .update({ is_premium: isPremium })
      .eq('email', email);
    if (error) return res.status(500).json({ error: formatSupabaseError(error) });

    await logAudit({ adminEmail: req.user!.email, action: isPremium ? 'grant_premium' : 'revoke_premium', targetEmail: email });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// DELETE /api/admin/users/:email — delete a user
router.delete('/users/:email', requireAdmin, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);

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

    await logAudit({ adminEmail: req.user!.email, action: 'delete_user', targetEmail: email });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// GET /api/admin/audit — view audit log
router.get('/audit', requireAdmin, async (req, res) => {
  try {
    const { action, admin: adminFilter, from, to, page = '1', limit = '50' } = req.query;
    const { getAuditLog } = await import('../audit');
    const result = await getAuditLog({
      action: action as string,
      adminEmail: adminFilter as string,
      from: from as string,
      to: to as string,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
