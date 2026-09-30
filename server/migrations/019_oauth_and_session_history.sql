-- ============================================================
-- Migration 019: OAuth account support + session history types
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
--
-- 1) users_auth.password was created as NOT NULL, so OAuth sign-ups
--    (Google/Apple) that insert a row without a password fail.
-- 2) users_auth is missing the provider/provider_id/avatar_url columns
--    that server/routes/auth-google.ts and auth-apple.ts read + write,
--    so Google sign-in 500s (column does not exist).
-- 3) student_session_history only allows ('study','practice','simulation')
--    but the API accepts quiz/mock_exam/exam → constraint violation.
-- ============================================================

-- 1. OAuth accounts have no local password
ALTER TABLE users_auth ALTER COLUMN password DROP NOT NULL;

-- 2. OAuth linkage columns
ALTER TABLE users_auth
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS provider_id TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users_auth(provider, provider_id);

-- 3. Widen the session history type check
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'student_session_history'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%type IN%'
  LOOP
    EXECUTE format('ALTER TABLE student_session_history DROP CONSTRAINT %I', constraint_rec.conname);
  END LOOP;

  ALTER TABLE student_session_history
    ADD CONSTRAINT student_session_history_type_check
    CHECK (type IN ('study', 'practice', 'simulation', 'quiz', 'mock_exam', 'exam'));
END $$;

-- Verify
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users_auth'
ORDER BY ordinal_position;
