import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Validation schemas for API endpoints
export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase')
    .regex(/[a-z]/, 'Password must contain lowercase')
    .regex(/[0-9]/, 'Password must contain a number'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  stream: z.enum(['Natural Science', 'Social Science']).optional(),
});

export const signinSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().length(6, 'Recovery code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase')
    .regex(/[a-z]/, 'Password must contain lowercase')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase')
    .regex(/[a-z]/, 'Password must contain lowercase')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100, 'Name too long'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().max(500, 'Description too long').optional(),
});

export const approveRejectSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export const sessionHistorySchema = z.object({
  type: z.enum(['study', 'practice', 'simulation']),
  subject: z.string().min(1),
  chapter: z.string().optional(),
  score: z.number().optional(),
  total: z.number().optional(),
  durationMinutes: z.number().min(0),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  stream: z.enum(['Natural Science', 'Social Science']).optional(),
  school: z.string().max(200).optional(),
  region: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().max(10).optional(),
  targetScore: z.number().min(0).max(700).optional(),
  studyStyle: z.enum(['Visual / Video', 'Practice / Quiz', 'Reading & Summaries', 'Collaborative']).optional(),
  dailyHours: z.number().min(1).max(12).optional(),
});

// ── Question Schemas ─────────────────────────────────────────────────────────

const questionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  textAmharic: z.string().optional(),
});

export const createQuestionSchema = z.object({
  id: z.string().min(1),
  subject: z.string().min(1),
  stream: z.string().min(1),
  chapter: z.string().optional(),
  yearEC: z.string().optional(),
  questionText: z.string().min(1),
  questionTextAmharic: z.string().optional(),
  options: z.array(questionOptionSchema).min(2),
  correctOptionId: z.string().optional(),
  explanation: z.string().optional(),
  explanationAmharic: z.string().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const updateQuestionSchema = z.object({
  subject: z.string().min(1).optional(),
  stream: z.string().min(1).optional(),
  chapter: z.string().optional(),
  yearEC: z.string().optional(),
  questionText: z.string().min(1).optional(),
  questionTextAmharic: z.string().optional(),
  options: z.array(questionOptionSchema).min(2).optional(),
  correctOptionId: z.string().optional(),
  explanation: z.string().optional(),
  explanationAmharic: z.string().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// ── Mock Exam Schemas ────────────────────────────────────────────────────────

export const createMockExamSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  titleAmharic: z.string().optional(),
  stream: z.string().min(1),
  subject: z.string().min(1),
  durationMinutes: z.number().min(1).optional(),
  totalQuestions: z.number().min(0).optional(),
  questionIds: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const updateMockExamSchema = z.object({
  title: z.string().min(1).optional(),
  titleAmharic: z.string().optional(),
  stream: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  durationMinutes: z.number().min(1).optional(),
  totalQuestions: z.number().min(0).optional(),
  questionIds: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// ── Notification Schema ──────────────────────────────────────────────────────

export const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(['challenge', 'mock', 'achievement', 'study_group', 'info']).optional(),
  actionUrl: z.string().max(200).optional(),
  userEmail: z.string().email().optional(),
});

// ── Analytics Schema ─────────────────────────────────────────────────────────

export const trackEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  subject: z.string().max(100).optional(),
  score: z.number().min(0).max(100).optional(),
  durationSeconds: z.number().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ── Flag Schemas ─────────────────────────────────────────────────────────────

export const createFlagSchema = z.object({
  questionId: z.string().min(1),
  reason: z.enum(['incorrect', 'inappropriate', 'unclear', 'other']),
  details: z.string().max(500).optional(),
});

export const updateFlagSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']),
});

// ── Daily Progress Schema ────────────────────────────────────────────────────

export const upsertDailyProgressSchema = z.object({
  stream: z.string().min(1),
  quizDate: z.string().min(1),
  questions: z.array(z.record(z.string(), z.unknown())),
  currentIndex: z.number().min(0).optional(),
  selectedOptionId: z.string().optional(),
  isAnswerChecked: z.boolean().optional(),
  correctAnswersCount: z.number().min(0).optional(),
  completed: z.boolean().optional(),
});

// ── Notes Schema ─────────────────────────────────────────────────────────────

export const toggleChapterSchema = z.object({
  chapterKey: z.string().min(1),
});

// ── Push Schema ──────────────────────────────────────────────────────────────

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

// ── AI Schemas ───────────────────────────────────────────────────────────────

export const conceptExplainerSchema = z.object({
  prompt: z.string().min(1).max(2000),
  subject: z.string().max(100).optional(),
  language: z.enum(['en', 'am']).optional(),
});

export const studyPlanSchema = z.object({
  targetScore: z.number().min(0).max(700).optional(),
  currentHours: z.number().min(1).max(12).optional(),
  weakSubjects: z.array(z.string()).optional(),
  stream: z.string().optional(),
  school: z.string().optional(),
  region: z.string().optional(),
  preparationLevel: z.string().optional(),
  studyStyle: z.string().optional(),
  studyTimeOfDay: z.string().optional(),
  examFocusStrategy: z.string().optional(),
  biggestChallenge: z.string().optional(),
  mockFrequency: z.string().optional(),
});

export const askTutorSchema = z.object({
  question: z.string().min(1).max(2000),
  subject: z.string().max(100).optional(),
});

export const proAuditSchema = z.object({
  name: z.string().optional(),
  school: z.string().optional(),
  region: z.string().optional(),
  preparationLevel: z.string().optional(),
  studyStyle: z.string().optional(),
  weakSubjects: z.array(z.string()).optional(),
  targetScore: z.number().optional(),
  dailyGoalHours: z.number().optional(),
  totalMinutesStudied: z.number().optional(),
  studiedChaptersCount: z.number().optional(),
});

// Middleware factory: validates req.body against a Zod schema
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(i => i.message);
      return res.status(400).json({ error: errors[0] || 'Invalid request body' });
    }
    req.body = result.data;
    next();
  };
}

// Middleware factory: validates req.query against a Zod schema
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map(i => i.message);
      return res.status(400).json({ error: errors[0] || 'Invalid query parameters' });
    }
    req.query = result.data as any;
    next();
  };
}
