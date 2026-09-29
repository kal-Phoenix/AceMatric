import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth, collaborationLimiter } from '../middleware';
import { validateBody, createRoomSchema, approveRejectSchema } from '../validation';
import { supabaseAdmin as supabase, formatSupabaseError, camelToSnake, snakeToCamel } from '../db';
import { redis, redisAvailable, KEYS } from '../redis';

const router = Router();

export interface RoomMember {
  email: string;
  name: string;
  avatar: string;
  stream: string;
  ws: any;
  x?: number;
  y?: number;
  activeChannel?: string;
  voiceChannel?: string | null;
  isMuted?: boolean;
  isDeafened?: boolean;
  videoEnabled?: boolean;
}

export interface ChatMessage {
  id: string;
  name: string;
  email: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface RoomState {
  name: string;
  members: Record<string, RoomMember>;
  messages: ChatMessage[];
  canvasState: any[];
  activeQuiz: any | null;
  creatorEmail: string;
  subject: string;
  description: string;
  createdAt: string;
  goals: GoalItem[];
  sharedNotes: string;
  timerState: TimerState;
  allowedEmails?: string[];
  joinRequests?: any[];
}

export interface GoalItem {
  id: string;
  text: string;
  completed: boolean;
  setter: string;
}

export interface TimerState {
  isPlaying: boolean;
  timeLeft: number;
  duration: number;
  lastUpdated: number;
}

// Active member tracking is now backed by Redis (see server/redis.ts)

const MAX_JOIN_REQUESTS = 200;

// Strip HTML from user-supplied text so room metadata and chat can never
// execute markup in other students' clients.
function stripHtml(text: string): string {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const DEFAULT_TIMER: TimerState = { isPlaying: false, timeLeft: 1500, duration: 1500, lastUpdated: Date.now() };

// GET /api/collaboration/rooms
router.get('/rooms', requireAuth, async (req, res) => {
  try {
    const userEmail = req.user!.email;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: rooms, error, count } = await supabase
      .from('study_rooms')
      .select('id, name, creator_email, subject, description, created_at, goals, messages, allowed_emails, join_requests', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[collaboration] Fetch rooms error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }

    const roomsList = await Promise.all((rooms || []).map(async (room: any) => {
      const r = snakeToCamel(room) as any;
      const allowedEmails: string[] = r.allowedEmails || [];
      const isMember = allowedEmails.includes(userEmail) || r.creatorEmail === userEmail;
      const activeCount = redisAvailable && redis ? await redis.hlen(KEYS.roomMembers(r.id)) : 0;

      const messages: ChatMessage[] = r.messages || [];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1].text : 'No activity yet';

      return {
        id: r.id,
        name: r.name,
        activeCount,
        lastMessage,
        creatorEmail: r.creatorEmail || 'system',
        subject: r.subject,
        description: r.description,
        createdAt: r.createdAt,
        goalsCount: (r.goals || []).length,
        completedGoalsCount: (r.goals || []).filter((g: any) => g.completed).length,
        allowedEmails: isMember ? allowedEmails : [],
        joinRequests: isMember ? (r.joinRequests || []) : [],
      };
    }));

    res.json({ rooms: roomsList, total: count || 0, page, limit });
  } catch (err: any) {
    console.error('[collaboration] List rooms error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// POST /api/collaboration/rooms/create
router.post('/rooms/create', requireAuth, collaborationLimiter, validateBody(createRoomSchema), async (req, res) => {
  try {
    const { name, subject, description } = req.body;
    const creatorEmail = req.user!.email;

    const safeName = stripHtml(name).slice(0, 100);
    const safeDescription = stripHtml(description || `Cooperative study area for ${subject}.`).slice(0, 500);
    const safeSubject = stripHtml(subject || 'General').slice(0, 60);
    const creatorName = stripHtml(req.user!.name || creatorEmail.split('@')[0]).slice(0, 100);

    // Check room limit
    const { count, error: countError } = await supabase
      .from('study_rooms')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('[collaboration] Room count error:', countError);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    if ((count || 0) >= 50) {
      return res.status(429).json({ error: 'Maximum room limit reached. Please try again later.' });
    }

    const id = `custom-${crypto.randomUUID()}`;
    const systemMessage: ChatMessage = {
      id: `msg-system-${crypto.randomUUID()}`,
      name: 'System',
      email: 'system',
      avatar: '🤖',
      text: `Welcome to ${safeName}! Created by ${creatorName}. Feel free to write notes, set goals, draw on whiteboard or trigger quiz challenges!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const initialGoal: GoalItem = {
      id: `goal-init-${crypto.randomUUID()}`,
      text: `Review first exam question for ${safeSubject}`,
      completed: false,
      setter: creatorName,
    };

    const roomData = {
      id,
      name: safeName,
      creator_email: creatorEmail,
      subject: safeSubject,
      description: safeDescription,
      messages: [systemMessage],
      canvas_state: [],
      active_quiz: null,
      goals: [initialGoal],
      shared_notes: `--- Notes for ${subject} ---\n\nWrite formulas and study items here!`,
      timer_state: DEFAULT_TIMER,
      allowed_emails: [creatorEmail],
      join_requests: [],
    };

    const { error: insertError } = await supabase
      .from('study_rooms')
      .insert([roomData]);

    if (insertError) {
      console.error('[collaboration] Room create error:', insertError);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }

    res.json({ success: true, id, name, room: { ...roomData, id } });
  } catch (err: any) {
    console.error('[collaboration] Create room error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// POST /api/collaboration/rooms/:id/request-join
router.post('/rooms/:id/request-join', requireAuth, collaborationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user!.email;

    const { data: room, error: fetchError } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !room) return res.status(404).json({ error: 'Study group not found.' });

    const allowedEmails: string[] = room.allowed_emails || [];
    const joinRequests: any[] = room.join_requests || [];

    if (allowedEmails.includes(userEmail)) {
      return res.json({ success: true, message: 'You are already approved.' });
    }

    if (joinRequests.length >= MAX_JOIN_REQUESTS) {
      return res.status(429).json({ error: 'This study group has too many pending requests. Please try again later.' });
    }

    const alreadyRequested = joinRequests.some((r: any) => r.email === userEmail);
    if (!alreadyRequested) {
      joinRequests.push({
        email: userEmail,
        name: stripHtml(req.user!.name || userEmail.split('@')[0]).slice(0, 100),
        avatar: '🎓',
        stream: 'Natural Science',
        requestedAt: new Date().toISOString(),
      });

      const { error: updateError } = await supabase
        .from('study_rooms')
        .update({ join_requests: joinRequests })
        .eq('id', id);

      if (updateError) {
        console.error('[collaboration] Join request update error:', updateError);
        return res.status(500).json({ error: 'An error occurred. Please try again.' });
      }
    }

    res.json({ success: true, message: 'Join request sent.' });
  } catch (err: any) {
    console.error('[collaboration] Request join error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// POST /api/collaboration/rooms/:id/approve-request
router.post('/rooms/:id/approve-request', requireAuth, validateBody(approveRejectSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const { data: room, error: fetchError } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !room) return res.status(404).json({ error: 'Study group not found.' });
    if (room.creator_email !== req.user!.email) {
      return res.status(403).json({ error: 'Only the group creator can approve requests.' });
    }

    const allowedEmails: string[] = room.allowed_emails || [];
    const joinRequests: any[] = room.join_requests || [];

    if (!allowedEmails.includes(normalizedEmail)) {
      allowedEmails.push(normalizedEmail);
    }
    const updatedRequests = joinRequests.filter((r: any) => r.email !== normalizedEmail);

    const { error: updateError } = await supabase
      .from('study_rooms')
      .update({ allowed_emails: allowedEmails, join_requests: updatedRequests })
      .eq('id', id);

    if (updateError) {
      console.error('[collaboration] Approve request error:', updateError);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }

    res.json({ success: true, message: 'Request approved.' });
  } catch (err: any) {
    console.error('[collaboration] Approve request error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// POST /api/collaboration/rooms/:id/reject-request
router.post('/rooms/:id/reject-request', requireAuth, validateBody(approveRejectSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const { data: room, error: fetchError } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !room) return res.status(404).json({ error: 'Study group not found.' });
    if (room.creator_email !== req.user!.email) {
      return res.status(403).json({ error: 'Only the group creator can reject requests.' });
    }

    const joinRequests: any[] = room.join_requests || [];
    const updatedRequests = joinRequests.filter((r: any) => r.email !== normalizedEmail);

    const { error: updateError } = await supabase
      .from('study_rooms')
      .update({ join_requests: updatedRequests })
      .eq('id', id);

    if (updateError) {
      console.error('[collaboration] Reject request error:', updateError);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }

    res.json({ success: true, message: 'Request declined.' });
  } catch (err: any) {
    console.error('[collaboration] Reject request error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// DELETE /api/collaboration/rooms/:id
router.delete('/rooms/:id', requireAuth, collaborationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user!.email.trim().toLowerCase();
    const userRole = req.user!.role;

    const { data: room, error: fetchError } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !room) {
      return res.status(404).json({ error: 'Study group not found.' });
    }

    const creatorEmail = (room.creator_email || '').trim().toLowerCase();
    const isAdmin = userRole === 'admin';

    if (userEmail !== creatorEmail && !isAdmin) {
      return res.status(403).json({ error: 'Only the room creator or an admin can delete this study group.' });
    }

    const { error: deleteError } = await supabase
      .from('study_rooms')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[collaboration] Room delete error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete room from database.' });
    }

    if (redisAvailable && redis) {
      try {
        await redis.del(KEYS.roomMembers(id));
      } catch (err) {
        console.warn('[collaboration] Redis room deletion cleanup error:', err);
      }
    }

    res.json({ success: true, message: 'Study group deleted successfully.' });
  } catch (err: any) {
    console.error('[collaboration] Delete room error:', err);
    res.status(500).json({ error: 'An error occurred while deleting the room.' });
  }
});

export default router;

