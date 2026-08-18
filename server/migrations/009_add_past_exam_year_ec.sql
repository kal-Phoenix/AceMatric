-- Add year_ec column to past_exam_entries for organizing exams by year
ALTER TABLE past_exam_entries ADD COLUMN IF NOT EXISTS year_ec TEXT NOT NULL DEFAULT '';
