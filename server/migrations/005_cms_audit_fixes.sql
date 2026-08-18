-- 005: CMS audit fixes — status columns, question versioning, referential integrity guards.

-- ── 1. Add status column to tables that lack it ──────────────────────────────

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published'));

CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

ALTER TABLE mock_exams
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published'));

CREATE INDEX IF NOT EXISTS idx_mock_exams_status ON mock_exams(status);

ALTER TABLE curated_study_notes
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published'));

CREATE INDEX IF NOT EXISTS idx_curated_notes_status ON curated_study_notes(status);

-- ── 2. Questions version history ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS question_versions (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id           TEXT NOT NULL,
  subject               TEXT NOT NULL,
  stream                TEXT NOT NULL,
  chapter               TEXT NOT NULL DEFAULT '',
  year_ec               TEXT NOT NULL DEFAULT '',
  question_text         TEXT NOT NULL,
  question_text_amharic TEXT,
  options               JSONB DEFAULT '[]',
  correct_option_id     TEXT,
  explanation           TEXT NOT NULL DEFAULT '',
  explanation_amharic   TEXT,
  difficulty            TEXT NOT NULL DEFAULT 'Medium',
  status                TEXT NOT NULL DEFAULT 'published',
  version               INTEGER NOT NULL,
  saved_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_versions_question ON question_versions(question_id);
