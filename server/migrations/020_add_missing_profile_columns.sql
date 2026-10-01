-- Migration 020: columns the application writes that are missing from the
-- production student_profiles table (verified 2026-10-01).
-- Every statement is idempotent — safe to re-run.
-- Run in Supabase Dashboard > SQL Editor.

-- Payment approval (server/routes/payments.ts) sets premium_expires_at;
-- without it, approving a payment fails and rolls back, so Pro upgrades break.
-- Profile auto-downgrade on expiry (server/routes/profile.ts) reads it too.
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- Streak reset cron (server/push-scheduler.ts) reads last_study_date.
-- (Supersedes migration 008, which was never applied.)
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Profile page writes daily goal + notification toggle (ProfileView).
-- Without these columns every profile save returns 500.
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS daily_goal_hours INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS notifications BOOLEAN DEFAULT TRUE;

-- Video watch history field of the profile payload.
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS video_watch_history JSONB DEFAULT '{}';

-- Server-enforced free-tier daily AI quota (server/routes/ai.ts).
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS ai_daily_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_daily_date TEXT NOT NULL DEFAULT '';
