import { Router } from 'express';
import crypto from 'crypto';
import { supabase, formatSupabaseError, snakeToCamel } from '../db';
import { requireAuth } from '../middleware';

const router = Router();

// GET /api/session-history
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('student_session_history')
      .select('*')
      .eq('user_email', req.user!.email)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });

    const entries = (data || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      subject: row.subject,
      chapter: row.chapter,
      score: row.score,
      total: row.total,
      durationMinutes: row.duration_minutes,
      date: new Date(row.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));

    res.json(entries);
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// POST /api/session-history
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, subject, chapter, score, total, durationMinutes } = req.body;
    if (!type || !subject || !durationMinutes) {
      return res.status(400).json({ error: 'type, subject, and durationMinutes are required' });
    }

    const id = `hist-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('student_session_history')
      .insert([{
        id,
        user_email: req.user!.email,
        type,
        subject,
        chapter: chapter || null,
        score: score ?? null,
        total: total ?? null,
        duration_minutes: durationMinutes,
        created_at: now,
      }]);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });

    const entry = {
      id,
      type,
      subject,
      chapter,
      score,
      total,
      durationMinutes,
      date: new Date(now).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    res.json(entry);
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// DELETE /api/session-history — clear all history for the logged-in user
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('student_session_history')
      .delete()
      .eq('user_email', req.user!.email);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
