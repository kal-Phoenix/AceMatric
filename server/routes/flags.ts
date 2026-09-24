import { Router } from 'express';
import crypto from 'crypto';
import { supabaseAdmin as supabase, formatSupabaseError } from '../db';
import { requireAuth, requireAdmin } from '../middleware';
import { validateBody, createFlagSchema, updateFlagSchema } from '../validation';

const router = Router();

// Strip HTML so user-submitted details can never execute in the admin console
function stripHtml(text: string): string {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Flag a question (report incorrect, inappropriate, etc.)
router.post('/', requireAuth, validateBody(createFlagSchema), async (req, res) => {
  try {
    const { questionId, reason, details } = req.body;

    // Check for duplicate flag from same user on same question
    const { data: existingFlag } = await supabase
      .from('question_flags')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_email', req.user!.email)
      .maybeSingle();

    if (existingFlag) {
      return res.status(409).json({ error: 'You have already flagged this question' });
    }

    const { error } = await supabase
      .from('question_flags')
      .insert([{
        id: crypto.randomUUID(),
        question_id: questionId,
        user_email: req.user!.email,
        reason,
        details: stripHtml(details || '').slice(0, 500),
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// Check if current user has flagged a question
router.get('/check/:questionId', requireAuth, async (req, res) => {
  try {
    const { questionId } = req.params;

    const { data, error } = await supabase
      .from('question_flags')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_email', req.user!.email)
      .maybeSingle();

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ flagged: !!data });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// Admin-only: list all flagged questions
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('question_flags')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// Admin-only: update flag status (resolve/dismiss)
router.put('/:id', requireAdmin, validateBody(updateFlagSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { error } = await supabase
      .from('question_flags')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;