import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalLimiter } from './middleware';
import authRoutes from './routes/auth';
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

const app = express();

app.set('trust proxy', 1);

const isDev = process.env.NODE_ENV !== 'production';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isDev ? ["'self'", "'unsafe-inline'"] : ["'self'"],
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

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://acematric.com,https://www.acematric.com').split(',').map(o => o.trim());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/api', globalLimiter);

app.use('/api/auth', authRoutes);
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/version', (_req, res) => {
  res.json({ version: '4.2.0', environment: process.env.NODE_ENV || 'development' });
});

app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[ERROR] Unhandled server error:', err);
  res.status(err.status || 500).json({ error: 'An unexpected server error occurred' });
});

export default app;
