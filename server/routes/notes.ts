import { Router } from 'express';
import { supabase, formatSupabaseError } from '../db';
import { requireAuth } from '../middleware';
import { validateBody, toggleChapterSchema } from '../validation';

const router = Router();

// ── Saved Chapters (offline bookmarking) ─────────────────────────────────────

/** GET /api/notes/saved-chapters */
router.get('/saved-chapters', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('student_saved_chapters')
      .select('chapter_key')
      .eq('user_email', req.user!.email);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json((data || []).map(r => r.chapter_key));
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

/** POST /api/notes/saved-chapters — Toggle a saved chapter */
router.post('/saved-chapters', requireAuth, validateBody(toggleChapterSchema), async (req, res) => {
  try {
    const { chapterKey } = req.body;

    const email = req.user!.email;

    const { data: existing } = await supabase
      .from('student_saved_chapters')
      .select('chapter_key')
      .eq('user_email', email)
      .eq('chapter_key', chapterKey)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('student_saved_chapters')
        .delete()
        .eq('user_email', email)
        .eq('chapter_key', chapterKey);
    } else {
      await supabase
        .from('student_saved_chapters')
        .upsert([{ user_email: email, chapter_key: chapterKey }], { onConflict: 'user_email,chapter_key' });
    }

    const { data: all } = await supabase
      .from('student_saved_chapters')
      .select('chapter_key')
      .eq('user_email', email);

    res.json((all || []).map(r => r.chapter_key));
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// ── Studied Chapters ─────────────────────────────────────────────────────────

/** GET /api/notes/studied-chapters */
router.get('/studied-chapters', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('student_studied_chapters')
      .select('chapter_key')
      .eq('user_email', req.user!.email);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json((data || []).map(r => r.chapter_key));
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

/** POST /api/notes/studied-chapters — Toggle a studied chapter */
router.post('/studied-chapters', requireAuth, validateBody(toggleChapterSchema), async (req, res) => {
  try {
    const { chapterKey } = req.body;

    const email = req.user!.email;

    const { data: existing } = await supabase
      .from('student_studied_chapters')
      .select('chapter_key')
      .eq('user_email', email)
      .eq('chapter_key', chapterKey)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('student_studied_chapters')
        .delete()
        .eq('user_email', email)
        .eq('chapter_key', chapterKey);
    } else {
      await supabase
        .from('student_studied_chapters')
        .upsert([{ user_email: email, chapter_key: chapterKey }], { onConflict: 'user_email,chapter_key' });
    }

    const { data: all } = await supabase
      .from('student_studied_chapters')
      .select('chapter_key')
      .eq('user_email', email);

    res.json((all || []).map(r => r.chapter_key));
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
