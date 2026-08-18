-- 008: Add last_study_date column for streak tracking

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS last_study_date DATE;
