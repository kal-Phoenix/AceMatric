-- =============================================================
-- AceMatric: Combined migration for ALL missing tables
-- Run this ENTIRE script in Supabase SQL Editor to create all
-- tables needed by the application.
-- =============================================================

-- ── 1. Student Session History ────────────────────────────────────────────
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

-- ── 2. Daily Quiz Progress ────────────────────────────────────────────────
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

-- ── 3. Notifications ─────────────────────────────────────────────────────
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

-- ── 4. Saved Chapters ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_saved_chapters (
  user_email TEXT NOT NULL,
  chapter_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_email, chapter_key)
);

-- ── 5. Studied Chapters ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_studied_chapters (
  user_email TEXT NOT NULL,
  chapter_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_email, chapter_key)
);

-- ── 6. Content Entries (CMS) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_entries (
  id            TEXT PRIMARY KEY,
  subject       TEXT NOT NULL,
  grade         INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  title         TEXT NOT NULL,
  overview      TEXT DEFAULT '',
  core_points   JSONB DEFAULT '[]',
  exam_tips     TEXT DEFAULT '',
  youtube_video_id TEXT DEFAULT '',
  video_duration TEXT DEFAULT '',
  subtopics     JSONB DEFAULT '[]',
  content_html  TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version       INTEGER NOT NULL DEFAULT 1,
  UNIQUE (subject, grade, chapter_number)
);
CREATE INDEX IF NOT EXISTS idx_content_entries_subject ON content_entries(subject);
CREATE INDEX IF NOT EXISTS idx_content_entries_grade ON content_entries(grade);
CREATE INDEX IF NOT EXISTS idx_content_entries_status ON content_entries(status);

-- ── 7. Content Versions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_versions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subject       TEXT NOT NULL,
  grade         INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  title         TEXT NOT NULL,
  overview      TEXT DEFAULT '',
  core_points   JSONB DEFAULT '[]',
  exam_tips     TEXT DEFAULT '',
  youtube_video_id TEXT DEFAULT '',
  video_duration TEXT DEFAULT '',
  subtopics     JSONB DEFAULT '[]',
  content_html  TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'draft',
  version       INTEGER NOT NULL,
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_versions_key ON content_versions(subject, grade, chapter_number);

-- ── 8. Quiz Entries (CMS) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_entries (
  id            TEXT PRIMARY KEY,
  subject       TEXT NOT NULL,
  grade         INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  chapter_name  TEXT NOT NULL DEFAULT '',
  questions     JSONB DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version       INTEGER NOT NULL DEFAULT 1,
  UNIQUE (subject, grade, chapter_number)
);
CREATE INDEX IF NOT EXISTS idx_quiz_entries_subject ON quiz_entries(subject);
CREATE INDEX IF NOT EXISTS idx_quiz_entries_grade ON quiz_entries(grade);
CREATE INDEX IF NOT EXISTS idx_quiz_entries_status ON quiz_entries(status);

-- ── 9. Quiz Versions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_versions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subject       TEXT NOT NULL,
  grade         INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  chapter_name  TEXT NOT NULL DEFAULT '',
  questions     JSONB DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'draft',
  version       INTEGER NOT NULL,
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_versions_key ON quiz_versions(subject, grade, chapter_number);

-- ── 10. Past Exam Entries (CMS) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS past_exam_entries (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  grade           INTEGER NOT NULL,
  subject         TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  total_questions  INTEGER NOT NULL DEFAULT 0,
  questions       JSONB DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_past_exam_entries_subject ON past_exam_entries(subject);
CREATE INDEX IF NOT EXISTS idx_past_exam_entries_grade ON past_exam_entries(grade);
CREATE INDEX IF NOT EXISTS idx_past_exam_entries_status ON past_exam_entries(status);

-- ── 11. Past Exam Versions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS past_exam_versions (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  entry_id        TEXT NOT NULL,
  title           TEXT NOT NULL,
  grade           INTEGER NOT NULL,
  subject         TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  total_questions  INTEGER NOT NULL DEFAULT 0,
  questions       JSONB DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'draft',
  version         INTEGER NOT NULL,
  saved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_past_exam_versions_entry ON past_exam_versions(entry_id);

-- ── 12. Audit Log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  admin_email   TEXT NOT NULL,
  action        TEXT NOT NULL,
  target_email  TEXT,
  details       JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON audit_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- ── 13. Question Flags ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_flags (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id   TEXT NOT NULL,
  user_email    TEXT NOT NULL,
  reason        TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_question_flags_question ON question_flags(question_id);

-- ── 14. Study Rooms ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_rooms (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  subject       TEXT NOT NULL,
  description   TEXT DEFAULT '',
  creator_email TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  state         JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 15. User Analytics ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_analytics (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_email      TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  subject         TEXT,
  score           NUMERIC,
  duration_seconds INTEGER,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_analytics_email ON user_analytics(user_email);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created ON user_analytics(created_at DESC);

-- ── 16. Push Subscriptions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_email    TEXT NOT NULL,
  endpoint      TEXT NOT NULL,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email ON push_subscriptions(user_email);

-- ── 17. Refresh Tokens ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_email    TEXT NOT NULL,
  token_hash    TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_email ON refresh_tokens(user_email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
