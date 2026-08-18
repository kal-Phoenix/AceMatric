-- =============================================================
-- AceMatric Storage Migration 001
-- Run this SQL in Supabase SQL Editor to create new tables
-- =============================================================

-- 1. Session history (replaces localStorage acematric_session_history_v1)
CREATE TABLE IF NOT EXISTS student_session_history (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('study', 'practice', 'simulation')),
  subject TEXT NOT NULL,
  chapter TEXT,
  score INTEGER,
  total INTEGER,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_session_history_user ON student_session_history(user_email);

-- 2. Daily quiz progress (replaces localStorage acematric_daily_questions_*)
CREATE TABLE IF NOT EXISTS student_daily_progress (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  stream TEXT NOT NULL,
  quiz_date DATE NOT NULL,
  questions JSONB NOT NULL,
  current_index INTEGER DEFAULT 0,
  selected_option_id TEXT,
  is_answer_checked BOOLEAN DEFAULT FALSE,
  correct_answers_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_email, stream, quiz_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user ON student_daily_progress(user_email, stream, quiz_date);

-- 3. Notifications (replaces in-memory serverNotifications array)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('challenge','mock','achievement','study_group','info')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_url TEXT,
  user_email TEXT NOT NULL DEFAULT 'all'
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email);

-- Seed default notifications
INSERT INTO notifications (id, title, message, type, is_read, created_at, action_url, user_email)
VALUES
  ('notif-1', 'Daily Challenge Ready', 'Review 5 new Physics electrostatics questions to keep up your streak!', 'challenge', false, NOW() - INTERVAL '4 hours', 'practice', 'all'),
  ('notif-2', 'Achievement Unlocked: Early Bird', 'You solved three practice sets before 8:00 AM.', 'achievement', false, NOW() - INTERVAL '1 day', 'dashboard', 'all'),
  ('notif-3', 'New English Mock Released', 'National English Exam Mock Simulator 3 is now open.', 'mock', true, NOW() - INTERVAL '2 days', 'simulator', 'all')
ON CONFLICT (id) DO NOTHING;

-- 4. Study rooms persistence — defined in 002_study_rooms_analytics_push.sql
-- (This section intentionally left blank; the canonical study_rooms schema is in migration 002)

-- 5. Admin-managed question bank (replaces hardcoded PRACTICE_QUESTIONS)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  stream TEXT NOT NULL,
  chapter TEXT NOT NULL,
  year_ec TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_text_amharic TEXT,
  options JSONB NOT NULL,
  correct_option_id TEXT NOT NULL,
  explanation TEXT NOT NULL,
  explanation_amharic TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy','Medium','Hard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject, stream);

-- 6. Past papers (replaces empty PAST_PAPERS array)
CREATE TABLE IF NOT EXISTS past_papers (
  id TEXT PRIMARY KEY,
  year_ec TEXT NOT NULL,
  year_gc TEXT NOT NULL,
  stream TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  title_amharic TEXT,
  file_url TEXT,
  file_size_mb NUMERIC,
  downloads_count INTEGER DEFAULT 0,
  avg_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Add gamification fields to student_profiles
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_milestones TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pro_audit TEXT DEFAULT '';

-- =============================================================
-- Storage Buckets (run via Supabase Dashboard > Storage > New Bucket)
-- =============================================================
-- Bucket: payment-screenshots (public: true)
-- Bucket: note-images (public: true)
-- Bucket: study-images (public: true)
-- Bucket: past-papers (public: true)
