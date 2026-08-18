-- Run this SQL in the Supabase Dashboard > SQL Editor
-- Then re-run: npx tsx server/seed.ts

-- Add year_ec column to past_exam_entries
ALTER TABLE past_exam_entries ADD COLUMN IF NOT EXISTS year_ec TEXT NOT NULL DEFAULT '';

-- Add grade column to mock_exams  
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS grade INTEGER DEFAULT 12;
