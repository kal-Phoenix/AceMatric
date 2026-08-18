-- =============================================================
-- AceMatric Migration 002: Curated Study Notes & Mock Exams
-- =============================================================

-- 1. Curated study notes (admin-managed study materials with YouTube videos + formula sheets)
CREATE TABLE IF NOT EXISTS curated_study_notes (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  stream TEXT NOT NULL,
  chapter TEXT NOT NULL,
  title TEXT NOT NULL,
  title_amharic TEXT,
  summary TEXT NOT NULL,
  summary_amharic TEXT,
  youtube_video_id TEXT NOT NULL,
  video_duration TEXT NOT NULL,
  formula_sheet JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_curated_notes_subject ON curated_study_notes(subject, stream);

-- 2. Mock exams (admin-managed mock exam definitions)
CREATE TABLE IF NOT EXISTS mock_exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_amharic TEXT,
  stream TEXT NOT NULL,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_questions INTEGER NOT NULL DEFAULT 0,
  question_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mock_exams_subject ON mock_exams(subject, stream);
