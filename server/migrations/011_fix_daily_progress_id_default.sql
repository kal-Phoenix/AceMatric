-- Add DEFAULT gen_random_uuid() to student_daily_progress.id
-- so future inserts without an explicit id don't fail NOT NULL.

ALTER TABLE student_daily_progress
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
