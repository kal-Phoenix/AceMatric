import { Router } from 'express';
import crypto from 'crypto';
import { supabase, formatSupabaseError } from '../db';
import { requireAuth, contactLimiter } from '../middleware';
import { validateBody, contactSchema } from '../validation';

const router = Router();

// ── POST /api/contact ────────────────────────────────────────────────────────

router.post('/', requireAuth, contactLimiter, validateBody(contactSchema), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const { error } = await supabase
      .from('contact_messages')
      .insert([{ id: crypto.randomUUID(), name, email, subject: subject || '', message, created_at: new Date().toISOString() }]);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
