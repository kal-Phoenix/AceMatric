-- 003: CMS content tables — replaces local JSON file storage for content, quizzes, and past exams.

-- ── Content Entries ──────────────────────────────────────────────────────────
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

-- ── Content Versions ─────────────────────────────────────────────────────────
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

-- ── Quiz Entries ─────────────────────────────────────────────────────────────
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

-- ── Quiz Versions ────────────────────────────────────────────────────────────
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

-- ── Past Exam Entries ────────────────────────────────────────────────────────
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

-- ── Past Exam Versions ───────────────────────────────────────────────────────
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
