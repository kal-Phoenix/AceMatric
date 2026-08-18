import { Router } from 'express';
import crypto from 'crypto';
import { supabase, formatSupabaseError } from '../db';
import { requireAuth, requireAdmin } from '../middleware';
import { validateBody, createNotificationSchema } from '../validation';

const router = Router();

export interface ServerNotification {
  id: string;
  title: string;
  message: string;
  type: 'challenge' | 'mock' | 'achievement' | 'study_group' | 'info';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  userEmail: string;
}

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const email = req.user!.email;

    const { data: allNotifs, error: allError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', 'all')
      .order('created_at', { ascending: false });

    const { data: userNotifs, error: userError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    const error = allError || userError;
    if (error) return res.status(500).json({ error: formatSupabaseError(error) });

    const combined = [...(allNotifs || []), ...(userNotifs || [])];
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const notifs = combined.map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read,
      createdAt: n.created_at,
      actionUrl: n.action_url,
      userEmail: n.user_email,
    }));

    res.json(notifs);
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// POST /api/notifications/read
router.post('/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { data: notif, error: fetchError } = await supabase
      .from('notifications')
      .select('user_email')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) return res.status(500).json({ error: 'Failed to update notification' });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    const email = notif.user_email;
    if (email !== 'all' && email !== req.user!.email) {
      return res.status(403).json({ error: 'Not your notification' });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    const normalizedEmail = req.user!.email;

    // Only mark the user's personal notifications as read
    // Do NOT mark global 'all' notifications as read (that would affect every user)
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_email', normalizedEmail);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// POST /api/notifications/create
router.post('/create', requireAdmin, validateBody(createNotificationSchema), async (req, res) => {
  try {
    const { title, message, type, actionUrl, userEmail } = req.body;

    const newNotif = {
      id: crypto.randomUUID(),
      title,
      message,
      type: type || 'info',
      is_read: false,
      created_at: new Date().toISOString(),
      action_url: actionUrl || null,
      user_email: (userEmail || 'all').trim().toLowerCase(),
    };

    const { error } = await supabase
      .from('notifications')
      .insert([newNotif]);

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });

    const response: ServerNotification = {
      id: newNotif.id,
      title: newNotif.title,
      message: newNotif.message,
      type: newNotif.type as ServerNotification['type'],
      isRead: false,
      createdAt: newNotif.created_at,
      actionUrl: actionUrl,
      userEmail: newNotif.user_email,
    };

    res.json({ success: true, notification: response });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
