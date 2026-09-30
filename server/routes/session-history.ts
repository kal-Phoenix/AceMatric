import { Router } from 'express';
import crypto from 'crypto';
import { supabaseAdmin as supabase, formatSupabaseError, snakeToCamel } from '../db';
import { requireAuth } from '../middleware';
import { redis } from '../redis';

const router = Router();

const VALID_TYPES = new Set(['quiz', 'practice', 'simulation', 'study', 'mock_exam', 'exam']);
const VALID_SUBJECTS = new Set([
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT',
  'History', 'Geography', 'Economics', 'IT', 'English Literature', 'Amharic',
]);

function normalizeType(type: string): string | null {
  const t = String(type || '').trim().toLowerCase().replace(/\s+/g, '_');
  return VALID_TYPES.has(t) ? t : null;
}

function normalizeSubject(subject: string): string | null {
  const s = String(subject || '').trim();
  return VALID_SUBJECTS.has(s) ? s : null;
}

function stripHtml(text: string): string {
  return String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// In-memory rate limit store: email -> timestamps of POST requests.
// Used as the fallback when Redis is not configured (single-instance only).
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [email, timestamps] of rateLimitStore.entries()) {
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      rateLimitStore.delete(email);
    } else {
      rateLimitStore.set(email, recent);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

async function isRateLimited(email: string): Promise<boolean> {
  // Shared counter across instances — matches every other limiter in the app
  if (redis) {
    try {
      const key = `rl:session-history:${email}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.pexpire(key, RATE_LIMIT_WINDOW_MS);
      return count > RATE_LIMIT_MAX;
    } catch (err: any) {
      console.debug('[session-history] Redis rate limit unavailable, using memory:', err?.message);
    }
  }

  const now = Date.now();
  const timestamps = rateLimitStore.get(email) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(email, recent);
    return true;
  }
  recent.push(now);
  rateLimitStore.set(email, recent);
  return false;
}

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
    if (await isRateLimited(req.user!.email)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Max 10 sessions per hour.' });
    }

    const { type, subject, chapter, score, total, durationMinutes } = req.body;

    const normalizedType = normalizeType(type);
    const normalizedSubject = normalizeSubject(subject);
    if (!normalizedType) {
      return res.status(400).json({ error: 'Invalid session type. Must be one of quiz, practice, simulation, study, mock_exam.' });
    }
    if (!normalizedSubject) {
      return res.status(400).json({ error: 'Invalid subject.' });
    }
    if (typeof durationMinutes !== 'number' || !Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 480) {
      return res.status(400).json({ error: 'durationMinutes must be between 1 and 480' });
    }

    if (total !== undefined && total !== null) {
      if (typeof total !== 'number' || !Number.isFinite(total) || total < 1 || total > 500) {
        return res.status(400).json({ error: 'total must be between 1 and 500' });
      }
    }

    if (score !== undefined && score !== null) {
      if (typeof score !== 'number' || !Number.isFinite(score) || score < 0) {
        return res.status(400).json({ error: 'score must be a non-negative number' });
      }
      if (total !== undefined && total !== null && score > total) {
        return res.status(400).json({ error: 'score cannot exceed total' });
      }
    }

    const id = `hist-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('student_session_history')
      .insert([{
        id,
        user_email: req.user!.email,
        type: normalizedType,
        subject: normalizedSubject,
        chapter: chapter ? stripHtml(String(chapter)).slice(0, 150) : null,
        score: score ?? null,
        total: total ?? null,
        duration_minutes: durationMinutes,
        created_at: now,
      }]);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });

    const entry = {
      id,
      type: normalizedType,
      subject: normalizedSubject,
      chapter: chapter ? stripHtml(String(chapter)).slice(0, 150) : null,
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
