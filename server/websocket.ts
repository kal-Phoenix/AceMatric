import { WebSocket, WebSocketServer } from 'ws';
// TODO: this file is getting big (~780 lines). Should split into room management, messaging, and whiteboard modules.
import { Server } from 'http';
import { ChatMessage, GoalItem } from './routes/collaboration';
import { ServerNotification } from './routes/notifications';
import { verifyToken } from './middleware';
import { supabaseAdmin as supabase } from './db';
import { redis, redisSub, redisAvailable, CHANNELS, KEYS } from './redis';

const AUTH_TIMEOUT_MS = 5000;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_NOTES_LENGTH = 50000;
const MSG_RATE_WINDOW = 5000;
const MSG_RATE_MAX = 10;

interface CachedRoom {
  name: string;
  creatorEmail: string;
  subject: string;
  description: string;
  messages: ChatMessage[];
  canvasState: any[];
  activeQuiz: any | null;
  goals: GoalItem[];
  sharedNotes: string;
  timerState: { isPlaying: boolean; timeLeft: number; duration: number; lastUpdated: number };
  allowedEmails: string[];
  joinRequests: any[];
  dirty: boolean;
  lastAccessed: number;
}

interface MemberMeta {
  name: string;
  avatar: string;
  stream: string;
  activeChannel: string;
  voiceChannel: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  videoEnabled: boolean;
  studyStatus: string;
  x?: number;
  y?: number;
}

// Local room cache (Supabase is source of truth)
const roomCache: Record<string, CachedRoom> = {};

// Local WebSocket tracking (ws objects are instance-scoped)
const localSockets = new Map<string, Set<WebSocket>>();
const localRoomMembers = new Map<string, Set<string>>();
const subscribedRooms = new Set<string>();

function sanitizeText(text: unknown, maxLen = MAX_MESSAGE_LENGTH): string {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

// --- Room cache (local, backed by Supabase) ---

async function loadRoom(roomId: string): Promise<CachedRoom | null> {
  if (roomCache[roomId]) {
    roomCache[roomId].lastAccessed = Date.now();
    return roomCache[roomId];
  }

  const { data, error } = await supabase
    .from('study_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error || !data) return null;

  const room: CachedRoom = {
    name: data.name,
    creatorEmail: data.creator_email,
    subject: data.subject,
    description: data.description || '',
    messages: data.messages || [],
    canvasState: data.canvas_state || [],
    activeQuiz: data.active_quiz || null,
    goals: data.goals || [],
    sharedNotes: data.shared_notes || '',
    timerState: data.timer_state || { isPlaying: false, timeLeft: 1500, duration: 1500, lastUpdated: Date.now() },
    allowedEmails: data.allowed_emails || [],
    joinRequests: data.join_requests || [],
    dirty: false,
    lastAccessed: Date.now(),
  };

  roomCache[roomId] = room;
  return room;
}

async function saveRoom(roomId: string) {
  const room = roomCache[roomId];
  if (!room || !room.dirty) return;

  const { error } = await supabase
    .from('study_rooms')
    .update({
      messages: room.messages,
      canvas_state: room.canvasState,
      active_quiz: room.activeQuiz,
      goals: room.goals,
      shared_notes: room.sharedNotes,
      timer_state: room.timerState,
    })
    .eq('id', roomId);

  if (error) {
    console.error('[ws] Failed to save room', roomId, error.message);
  } else {
    room.dirty = false;
  }
}

setInterval(() => {
  const now = Date.now();
  const STALE_MS = 30 * 60 * 1000; // 30 minutes
  for (const [id, room] of Object.entries(roomCache)) {
    if (room.dirty) saveRoom(id);
    if (now - room.lastAccessed > STALE_MS) {
      delete roomCache[id];
    }
  }
}, 30000);

// --- Redis-backed member tracking (with local fallback) ---

const localMemberMeta = new Map<string, Map<string, MemberMeta>>();

function localKey(roomId: string, email: string) { return `${roomId}::${email}`; }

async function getMemberMeta(roomId: string, email: string): Promise<MemberMeta | null> {
  if (redisAvailable && redis) {
    try {
      const json = await redis.hget(KEYS.roomMembers(roomId), email);
      return json ? JSON.parse(json) : null;
    } catch (err) { console.debug('[ws] Redis getMemberMeta fallback:', (err as Error).message); }
  }
  const room = localMemberMeta.get(roomId);
  return room?.get(email) ?? null;
}

async function setMemberMeta(roomId: string, email: string, meta: MemberMeta): Promise<void> {
  if (redisAvailable && redis) {
    try {
      await redis.hset(KEYS.roomMembers(roomId), email, JSON.stringify(meta));
    } catch (err) { console.debug('[ws] Redis setMemberMeta fallback:', (err as Error).message); }
  }
  if (!localMemberMeta.has(roomId)) localMemberMeta.set(roomId, new Map());
  localMemberMeta.get(roomId)!.set(email, meta);
}

async function deleteMemberMeta(roomId: string, email: string): Promise<void> {
  if (redisAvailable && redis) {
    try {
      await redis.hdel(KEYS.roomMembers(roomId), email);
    } catch (err) { console.debug('[ws] Redis deleteMemberMeta fallback:', (err as Error).message); }
  }
  localMemberMeta.get(roomId)?.delete(email);
  // Clean up empty room maps to prevent memory leak
  const room = localMemberMeta.get(roomId);
  if (room && room.size === 0) {
    localMemberMeta.delete(roomId);
  }
}

async function getRoomMemberCount(roomId: string): Promise<number> {
  if (redisAvailable && redis) {
    try {
      return await redis.hlen(KEYS.roomMembers(roomId));
    } catch (err) { console.debug('[ws] Redis getRoomMemberCount fallback:', (err as Error).message); }
  }
  return localMemberMeta.get(roomId)?.size ?? 0;
}

async function getAllRoomMembers(roomId: string): Promise<Record<string, MemberMeta>> {
  if (redisAvailable && redis) {
    try {
      const hash = await redis.hgetall(KEYS.roomMembers(roomId));
      const result: Record<string, MemberMeta> = {};
      for (const [email, json] of Object.entries(hash)) {
        result[email] = JSON.parse(json);
      }
      return result;
    } catch (err) { console.debug('[ws] Redis getAllRoomMembers fallback:', (err as Error).message); }
  }
  const room = localMemberMeta.get(roomId);
  if (!room) return {};
  const result: Record<string, MemberMeta> = {};
  for (const [email, meta] of room) {
    result[email] = meta;
  }
  return result;
}

// --- Local WebSocket tracking ---

function addLocalSocket(email: string, ws: WebSocket) {
  if (!localSockets.has(email)) localSockets.set(email, new Set());
  localSockets.get(email)!.add(ws);
}

function removeLocalSocket(email: string, ws: WebSocket) {
  const sockets = localSockets.get(email);
  if (sockets) {
    sockets.delete(ws);
    if (sockets.size === 0) localSockets.delete(email);
  }
}

function addLocalRoomMember(roomId: string, email: string) {
  if (!localRoomMembers.has(roomId)) localRoomMembers.set(roomId, new Set());
  localRoomMembers.get(roomId)!.add(email);
}

function removeLocalRoomMember(roomId: string, email: string) {
  const members = localRoomMembers.get(roomId);
  if (members) {
    members.delete(email);
    if (members.size === 0) {
      localRoomMembers.delete(roomId);
      if (redisAvailable && redisSub && subscribedRooms.has(roomId)) {
        redisSub.unsubscribe(CHANNELS.room(roomId));
        subscribedRooms.delete(roomId);
      }
    }
  }
}

// --- Broadcasting via Redis Pub/Sub ---

/** Strip correctOptionId and answers from quiz before sending to clients */
function sanitizeQuizForBroadcast(quiz: any): any {
  if (!quiz) return null;
  const { correctOptionId: _, answers: __, ...safe } = quiz;
  return safe;
}

function broadcastToRoom(roomId: string, payload: any, excludeEmail?: string) {
  if (redisAvailable && redis) {
    // Redis pub/sub self-subscribes: the subscriber registered in this same
    // process will receive this publish and call deliverToRoomLocally itself.
    // Delivering locally here too would send every message twice.
    redis.publish(CHANNELS.room(roomId), JSON.stringify({ payload, excludeEmail }));
    return;
  }
  deliverToRoomLocally(roomId, payload, excludeEmail);
}

function deliverToRoomLocally(roomId: string, payload: any, excludeEmail?: string) {
  const raw = JSON.stringify(payload);
  const emails = localRoomMembers.get(roomId);
  if (!emails) return;
  for (const email of emails) {
    if (email === excludeEmail) continue;
    const sockets = localSockets.get(email);
    if (!sockets) continue;
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) ws.send(raw);
    }
  }
}

function deliverNotificationLocally(payload: string, userEmail?: string) {
  if (userEmail) {
    const sockets = localSockets.get(userEmail);
    if (sockets) {
      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
      }
    }
  } else {
    for (const sockets of localSockets.values()) {
      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
      }
    }
  }
}

// --- Redis subscriber ---

if (redisSub) {
  redisSub.on('message', (channel, message) => {
    for (const roomId of subscribedRooms) {
      if (channel === CHANNELS.room(roomId)) {
        try {
          const { payload, excludeEmail } = JSON.parse(message);
          deliverToRoomLocally(roomId, payload, excludeEmail);
        } catch {}
        return;
      }
    }

    if (channel === CHANNELS.allNotif) {
      deliverNotificationLocally(message);
      return;
    }

    const notifMatch = channel.match(/^ws:notif:(.+)$/);
    if (notifMatch) {
      deliverNotificationLocally(message, notifMatch[1]);
    }
  });
}

function ensureRoomSubscription(roomId: string) {
  if (redisAvailable && redisSub && !subscribedRooms.has(roomId)) {
    redisSub.subscribe(CHANNELS.room(roomId));
    subscribedRooms.add(roomId);
  }
}

// --- WebSocket server ---

const ALLOWED_WS_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''));

const DEV_ORIGINS = ['http://127.0.0.1:3000', 'http://localhost:3000'];

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  const normalized = origin.replace(/\/$/, '');
  // Only include dev origins in non-production environments
  const isProd = process.env.NODE_ENV === 'production';
  const allAllowed = isProd
    ? ALLOWED_WS_ORIGINS
    : [...new Set([...ALLOWED_WS_ORIGINS, ...DEV_ORIGINS])];
  return allAllowed.some(allowed => normalized === allowed || normalized === allowed + '/');
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });

  server.on('upgrade', (request, socket, head) => {
    const url = request.url || '/';
    if (url !== '/' && !url.startsWith('/ws')) {
      socket.destroy();
      return;
    }

    const origin = request.headers.origin;
    if (!isOriginAllowed(origin)) {
      console.warn(`[ws] Rejected connection from disallowed origin: ${origin || '(none)'}`);
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  const HEARTBEAT_INTERVAL = 30000;
  const HEARTBEAT_TIMEOUT = 10000;
  const alive = new WeakMap<WebSocket, boolean>();

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (alive.get(ws) === false) {
        ws.terminate();
        return;
      }
      alive.set(ws, false);
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    });
  }, HEARTBEAT_INTERVAL);

  wss.on('connection', (ws) => {
    alive.set(ws, true);
    ws.on('pong', () => { alive.set(ws, true); });
  });

  wss.on('close', () => { clearInterval(heartbeat); });

  // Per-user rate limit tracking (shared across all connections for the same user)
  const userMsgTimestamps = new Map<string, number[]>();

  wss.on('connection', (ws: WebSocket) => {
    let currentEmail = '';
    let currentRoom = '';
    let isAuthenticated = false;

    const authTimer = setTimeout(() => {
      if (!isAuthenticated) {
        ws.send(JSON.stringify({ type: 'error', error: 'Authentication timeout. Please reconnect.' }));
        ws.close();
      }
    }, AUTH_TIMEOUT_MS);

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'register') {
          if (!data.token) {
            ws.send(JSON.stringify({ type: 'error', error: 'Token required for registration.' }));
            ws.close();
            return;
          }
          const payload = verifyToken(data.token);
          if (!payload) {
            ws.send(JSON.stringify({ type: 'error', error: 'Invalid or expired token.' }));
            ws.close();
            return;
          }
          isAuthenticated = true;
          clearTimeout(authTimer);
          currentEmail = payload.email.trim().toLowerCase();
          addLocalSocket(currentEmail, ws);

          // Subscribe to user-specific notification channel via Redis
          if (redisAvailable && redisSub) {
            redisSub.subscribe(CHANNELS.allNotif);
            redisSub.subscribe(CHANNELS.userNotif(currentEmail));
          }

          ws.send(JSON.stringify({ type: 'registered', email: currentEmail }));
          return;
        }

        if (!isAuthenticated) {
          ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated. Send register message first.' }));
          return;
        }

        const now = Date.now();
        const timestamps = userMsgTimestamps.get(currentEmail) || [];
        const recent = timestamps.filter(t => now - t < MSG_RATE_WINDOW);
        if (recent.length >= MSG_RATE_MAX) {
          ws.send(JSON.stringify({ type: 'error', error: 'Too many messages. Please slow down.' }));
          return;
        }
        recent.push(now);
        userMsgTimestamps.set(currentEmail, recent);

        switch (data.type) {
          case 'join_room': {
            const { room } = data;
            if (!room) return;

            loadRoom(room).then(async (state) => {
              if (!state) {
                ws.send(JSON.stringify({ type: 'room_error', error: 'Study group not found.' }));
                return;
              }

              const isCreator = state.creatorEmail === currentEmail;
              const isAllowed = state.allowedEmails.includes(currentEmail);
              if (!isCreator && !isAllowed) {
                ws.send(JSON.stringify({ type: 'room_error', error: 'Unauthorized: You must request to join and be approved.' }));
                return;
              }

              const memberCount = await getRoomMemberCount(room);
              const existingMember = await getMemberMeta(room, currentEmail);
              if (memberCount >= 10 && !existingMember) {
                ws.send(JSON.stringify({ type: 'room_error', error: 'Room Full: Maximum 10 students.' }));
                return;
              }

              // Only assign currentRoom AFTER authorization + capacity checks succeed
              currentRoom = room;
              ensureRoomSubscription(room);

              const newMeta: MemberMeta = {
                name: sanitizeText(data.name, 50) || 'Student',
                avatar: sanitizeText(data.avatar, 20) || '🎓',
                stream: sanitizeText(data.stream, 50) || 'Natural Science',
                activeChannel: 'general',
                voiceChannel: null,
                isMuted: false,
                isDeafened: false,
                videoEnabled: false,
                studyStatus: '',
              };

              await setMemberMeta(room, currentEmail, newMeta);
              addLocalRoomMember(room, currentEmail);

              ws.send(JSON.stringify({
                type: 'room_state',
                room,
                members: await getMembersList(room),
                messages: state.messages,
                canvasState: state.canvasState,
                activeQuiz: sanitizeQuizForBroadcast(state.activeQuiz),
                goals: state.goals,
                sharedNotes: state.sharedNotes,
                timerState: state.timerState,
              }));

              broadcastToRoom(room, {
                type: 'member_joined',
                member: { email: currentEmail, ...newMeta },
              }, currentEmail);
            }).catch((err) => {
              console.error('[ws] join_room error:', err);
              ws.send(JSON.stringify({ type: 'room_error', error: 'Failed to join room. Please try again.' }));
            });
            break;
          }

          case 'send_message': {
            if (!currentRoom) return;
            const { text } = data;
            const state = roomCache[currentRoom];
            if (!state) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (!member || !text) return;

            const safeText = sanitizeText(text);
            if (!safeText) return;

            const newMessage: ChatMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: member.name,
              email: currentEmail,
              avatar: member.avatar,
              text: safeText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            state.messages.push(newMessage);
            if (state.messages.length > 50) state.messages.shift();
            state.dirty = true;
            broadcastToRoom(currentRoom, { type: 'receive_message', message: newMessage });
            break;
          }

          case 'canvas_draw': {
            if (!currentRoom) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (!member) return;
            const state = roomCache[currentRoom];
            if (!state) return;
            const { stroke } = data;
            if (!stroke) return;
            state.canvasState.push(stroke);
            if (state.canvasState.length > 300) state.canvasState.shift();
            state.dirty = true;
            broadcastToRoom(currentRoom, { type: 'canvas_update', stroke }, currentEmail);
            break;
          }

          case 'canvas_clear': {
            if (!currentRoom) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (!member) return;
            const state = roomCache[currentRoom];
            if (!state) return;
            state.canvasState = [];
            state.dirty = true;
            broadcastToRoom(currentRoom, { type: 'canvas_cleared' });
            break;
          }

          case 'cursor_move': {
            if (!currentRoom) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (member) {
              member.x = data.x;
              member.y = data.y;
              setMemberMeta(currentRoom, currentEmail, member);
              broadcastToRoom(currentRoom, { type: 'cursor_update', email: currentEmail, x: data.x, y: data.y }, currentEmail);
            }
            break;
          }

          case 'trigger_quiz': {
            if (!currentRoom) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (!member) return;
            const state = roomCache[currentRoom];
            if (!state) return;
            const { question } = data;
            if (!question || !question.id || !question.questionText || !question.options || !Array.isArray(question.options) || question.options.length < 2) return;
            const safeText = sanitizeText(question.questionText, 2000);
            if (!safeText) return;
            const safeOptions = question.options.map((opt: any) => ({
              id: sanitizeText(opt.id || '', 10) || 'a',
              text: sanitizeText(opt.text || '', 500),
            })).filter((opt: any) => opt.text);
            if (safeOptions.length < 2) return;
            state.activeQuiz = {
              questionId: sanitizeText(question.id, 100),
              subject: sanitizeText(question.subject || '', 50),
              questionText: safeText,
              options: safeOptions,
              correctOptionId: sanitizeText(question.correctOptionId || '', 10),
              endTime: Date.now() + 45 * 1000,
              answers: {},
            };
            state.dirty = true;
            broadcastToRoom(currentRoom, {
              type: 'quiz_started',
              quiz: { questionId: state.activeQuiz.questionId, subject: state.activeQuiz.subject, questionText: state.activeQuiz.questionText, options: state.activeQuiz.options, endTime: state.activeQuiz.endTime },
            });
            break;
          }

          case 'submit_quiz_answer': {
            if (!currentRoom) return;
            const state = roomCache[currentRoom];
            if (!state || !state.activeQuiz) return;
            const { questionId, selectedOptionId } = data;
            if (!questionId || !selectedOptionId) return;
            if (state.activeQuiz.questionId !== questionId) return;
            if (state.activeQuiz.answers[currentEmail]) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (!member) return;

            const isCorrect = state.activeQuiz.correctOptionId === selectedOptionId;
            state.activeQuiz.answers[currentEmail] = {
              selectedOptionId: sanitizeText(selectedOptionId, 10),
              isCorrect,
              userName: member.name,
              score: isCorrect ? 10 : 0,
            };
            state.dirty = true;

            const scoresList = Object.entries(state.activeQuiz.answers).map(([email, ans]: [string, any]) => ({
              email, name: ans.userName, isCorrect: ans.isCorrect, selectedOptionId: ans.selectedOptionId,
            }));
            broadcastToRoom(currentRoom, { type: 'quiz_score_update', scores: scoresList });

            ws.send(JSON.stringify({ type: 'quiz_answer_result', isCorrect }));
            break;
          }

          case 'add_goal': {
            if (!currentRoom) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (!member) return;
            const state = roomCache[currentRoom];
            if (!state) return;
            const { text, setter } = data;
            if (!text) return;
            const safeText = sanitizeText(text, 500);
            if (!safeText) return;
            const newGoal: GoalItem = { id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: safeText, completed: false, setter: sanitizeText(setter, 50) || 'Partner' };
            state.goals.push(newGoal);
            state.dirty = true;
            broadcastToRoom(currentRoom, { type: 'goals_update', goals: state.goals });
            break;
          }

          case 'toggle_goal': {
            if (!currentRoom) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (!member) return;
            const state = roomCache[currentRoom];
            if (!state) return;
            const goal = state.goals.find(g => g.id === data.id);
            if (goal) goal.completed = !goal.completed;
            state.dirty = true;
            broadcastToRoom(currentRoom, { type: 'goals_update', goals: state.goals });
            break;
          }

          case 'delete_goal': {
            if (!currentRoom) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (!member) return;
            const state = roomCache[currentRoom];
            if (!state) return;
            state.goals = state.goals.filter(g => g.id !== data.id);
            state.dirty = true;
            broadcastToRoom(currentRoom, { type: 'goals_update', goals: state.goals });
            break;
          }

          case 'update_notes': {
            if (!currentRoom) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (!member) return;
            const state = roomCache[currentRoom];
            if (!state) return;
            const safeNotes = sanitizeText(data.notes, MAX_NOTES_LENGTH);
            state.sharedNotes = safeNotes;
            state.dirty = true;
            broadcastToRoom(currentRoom, { type: 'notes_update', notes: safeNotes }, currentEmail);
            break;
          }

          case 'timer_control': {
            if (!currentRoom) return;
            const state = roomCache[currentRoom];
            if (!state) return;
            if (state.creatorEmail !== currentEmail) {
              ws.send(JSON.stringify({ type: 'timer_error', error: 'Only the room creator can control the timer.' }));
              return;
            }
            const { action, duration } = data;
            if (action === 'start') {
              state.timerState.isPlaying = true;
              state.timerState.lastUpdated = Date.now();
            } else if (action === 'pause') {
              state.timerState.isPlaying = false;
              if (data.timeLeft !== undefined) state.timerState.timeLeft = data.timeLeft;
            } else if (action === 'reset') {
              state.timerState.isPlaying = false;
              state.timerState.timeLeft = duration || 1500;
              state.timerState.duration = duration || 1500;
            }
            state.dirty = true;
            broadcastToRoom(currentRoom, { type: 'timer_update', timerState: state.timerState });
            break;
          }

          case 'update_member_state': {
            if (!currentRoom) return;
            const member = await getMemberMeta(currentRoom, currentEmail);
            if (!member) return;
            if (data.activeChannel !== undefined) member.activeChannel = data.activeChannel;
            if (data.voiceChannel !== undefined) member.voiceChannel = data.voiceChannel;
            if (data.isMuted !== undefined) member.isMuted = data.isMuted;
            if (data.isDeafened !== undefined) member.isDeafened = data.isDeafened;
            if (data.videoEnabled !== undefined) member.videoEnabled = data.videoEnabled;
            if (data.studyStatus !== undefined) member.studyStatus = sanitizeText(data.studyStatus, 100);

            await setMemberMeta(currentRoom, currentEmail, member);

            const state = roomCache[currentRoom];
            if (!state) return;
            broadcastToRoom(currentRoom, {
              type: 'room_state',
              room: currentRoom,
              members: await getMembersList(currentRoom),
              messages: state.messages,
              canvasState: state.canvasState,
              activeQuiz: sanitizeQuizForBroadcast(state.activeQuiz),
              goals: state.goals,
              sharedNotes: state.sharedNotes,
              timerState: state.timerState,
            });
            break;
          }
        }
      } catch (err) {
        console.error('[ws] Message handler error:', err);
      }
    });

    ws.on('close', () => {
      clearTimeout(authTimer);
      if (currentEmail) {
        removeLocalSocket(currentEmail, ws);
      }
      if (currentRoom && currentEmail) {
        deleteMemberMeta(currentRoom, currentEmail);
        removeLocalRoomMember(currentRoom, currentEmail);
        broadcastToRoom(currentRoom, { type: 'member_left', email: currentEmail });
        saveRoom(currentRoom);
      }
    });
  });
}

async function getMembersList(roomId: string) {
  const members = await getAllRoomMembers(roomId);
  return Object.entries(members).map(([email, m]) => ({
    email,
    name: m.name,
    avatar: m.avatar,
    stream: m.stream,
    activeChannel: m.activeChannel || 'general',
    voiceChannel: m.voiceChannel || null,
    isMuted: !!m.isMuted,
    isDeafened: !!m.isDeafened,
    videoEnabled: !!m.videoEnabled,
    studyStatus: m.studyStatus || '',
    x: m.x,
    y: m.y,
  }));
}

export function broadcastNotification(notif: ServerNotification) {
  const payload = JSON.stringify({ type: 'new_notification', notification: notif });
  if (redisAvailable && redis) {
    if (notif.userEmail === 'all') {
      redis.publish(CHANNELS.allNotif, payload);
    } else {
      redis.publish(CHANNELS.userNotif(notif.userEmail), payload);
    }
  } else {
    deliverNotificationLocally(payload, notif.userEmail === 'all' ? undefined : notif.userEmail);
  }
}
