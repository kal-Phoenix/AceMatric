import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { globalLimiter } from './middleware';
import { testSupabaseConnection } from './db';
import { redis } from './redis';
import authRoutes from './routes/auth';
import googleAuthRoutes from './routes/auth-google';
import oauthConfigRoutes from './routes/auth-oauth';
import profileRoutes from './routes/profile';
import contactRoutes from './routes/contact';
import notificationRoutes from './routes/notifications';
import collaborationRoutes from './routes/collaboration';
import aiRoutes from './routes/ai';
import notesRoutes from './routes/notes';
import contentRoutes from './routes/content';
import sessionHistoryRoutes from './routes/session-history';
import dailyProgressRoutes from './routes/daily-progress';
import questionsRoutes from './routes/questions';
import storageRoutes from './routes/storage';
import mockExamsRoutes from './routes/mock-exams';
import flagsRoutes from './routes/flags';
import paymentsRoutes from './routes/payments';
import leaderboardRoutes from './routes/leaderboard';
import adminRoutes from './routes/admin';
import analyticsRoutes from './routes/analytics';
import pushRoutes from './routes/push';
import contentManageRoutes from './routes/content-manage';
import pastExamManageRoutes from './routes/past-exam-manage';
import quizManageRoutes from './routes/quiz-manage';
import contentGenerateRoutes from './routes/content-generate';

const app = express();

app.set('trust proxy', 1);

app.use(compression());

const isDev = process.env.NODE_ENV !== 'production';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isDev
        ? ["'self'", "'unsafe-inline'"]
        : ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:4000,http://127.0.0.1:3000,http://127.0.0.1:4000,https://acematric.com,https://www.acematric.com,https://acematric.fly.dev')
  .split(',')
  .map(o => o.trim())
  .filter(o => isDev || !o.startsWith('http://localhost'));
if (process.env.APP_URL && !ALLOWED_ORIGINS.includes(process.env.APP_URL)) {
  ALLOWED_ORIGINS.push(process.env.APP_URL);
}
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (/\.fly\.dev$/.test(origin)) return callback(null, true);
    if (isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/auth/oauth', oauthConfigRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/session-history', sessionHistoryRoutes);
app.use('/api/daily-progress', dailyProgressRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/mock-exams', mockExamsRoutes);
app.use('/api/flags', flagsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/content-manage', contentManageRoutes);
app.use('/api/past-exam-manage', pastExamManageRoutes);
app.use('/api/quiz-manage', quizManageRoutes);
app.use('/api/content-generate', contentGenerateRoutes);

app.get('/api/health', async (_req, res) => {
  const dbOk = await testSupabaseConnection().then(() => true).catch(() => false);
  let redisOk = true;
  if (redis) {
    try { await redis.ping(); } catch { redisOk = false; }
  }
  const healthy = dbOk && redisOk;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    db: dbOk,
    redis: redisOk,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/version', (_req, res) => {
  res.json({ version: '4.2.0' });
});

app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.error('[app] Unhandled server error:', err);
  } else {
    console.error('[app] Unhandled server error:', err?.message || 'Unknown error');
  }
  if (!res.headersSent) {
    res.status(err.status || 500).json({ error: 'An unexpected server error occurred' });
  }
});

export default app;
