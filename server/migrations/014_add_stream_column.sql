-- Migration 014: Add stream column to content and exam tables
-- This allows the admin to manage content for Natural and Social streams separately

-- Content entries
ALTER TABLE content_entries ADD COLUMN IF NOT EXISTS stream TEXT DEFAULT '';
UPDATE content_entries SET stream = '' WHERE stream IS NULL;

-- Content versions
ALTER TABLE content_versions ADD COLUMN IF NOT EXISTS stream TEXT DEFAULT '';
UPDATE content_versions SET stream = '' WHERE stream IS NULL;

-- Past exams
ALTER TABLE past_exams ADD COLUMN IF NOT EXISTS stream TEXT DEFAULT '';
UPDATE past_exams SET stream = '' WHERE stream IS NULL;

-- Quiz entries
ALTER TABLE quiz_entries ADD COLUMN IF NOT EXISTS stream TEXT DEFAULT '';
UPDATE quiz_entries SET stream = '' WHERE stream IS NULL;
