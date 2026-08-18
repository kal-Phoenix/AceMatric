-- Migration 012: Add columns to replace localStorage app data
-- Ensures all user state lives in the database, not the browser

-- Daily usage tracking (replaces acematric_daily_date localStorage)
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS daily_progress_date TEXT DEFAULT '';

-- Chapters studied (replaces acematric_studied_chapters localStorage)
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS studied_chapters JSONB DEFAULT '[]';

-- Pro study audit text (replaces acematric_pro_study_audit localStorage)
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS pro_study_audit TEXT DEFAULT '';

-- Active grade selection (replaces acematric_active_grade localStorage)
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS active_grade INTEGER DEFAULT 12;
