import { Router } from 'express';
import crypto from 'crypto';
import { supabaseAdmin as supabase, formatSupabaseError } from '../db';
import { requireAuth, contactLimiter } from '../middleware';
import { validateBody, contactSchema } from '../validation';

const router = Router();

function stripHtml(text: string): string {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

router.post('/', requireAuth, contactLimiter, validateBody(contactSchema), async (req, res) => {
  try {
    const { name, subject, message } = req.body;

    // Use the authenticated user's email — never a client-supplied address
    const email = req.user!.email;

    const { error } = await supabase
      .from('contact_messages')
      .insert([{
        id: crypto.randomUUID(),
        name: stripHtml(name).slice(0, 100),
        email,
        subject: stripHtml(subject || '').slice(0, 200),
        message: stripHtml(message).slice(0, 2000),
        created_at: new Date().toISOString(),
      }]);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
