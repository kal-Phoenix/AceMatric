-- =============================================================
-- AceMatric Storage Migration 003
-- Question Flags Table - for reporting flagged questions
-- =============================================================

CREATE TABLE IF NOT EXISTS question_flags (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('incorrect', 'inappropriate', 'unclear', 'other')),
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Prevent duplicate flags from same user on same question
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_flags_unique 
  ON question_flags(question_id, user_email);

-- Index for querying by question
CREATE INDEX IF NOT EXISTS idx_question_flags_question 
  ON question_flags(question_id);

-- Index for admin queries by status
CREATE INDEX IF NOT EXISTS idx_question_flags_status 
  ON question_flags(status);

-- Index for user's flagged questions
CREATE INDEX IF NOT EXISTS idx_question_flags_user 
  ON question_flags(user_email);