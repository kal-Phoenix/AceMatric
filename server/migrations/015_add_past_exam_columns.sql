-- Add new columns to past_exam_entries for enhanced extraction data
ALTER TABLE past_exam_entries
ADD COLUMN IF NOT EXISTS year_gc TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS exam_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS source_file TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS extraction_notes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS passages JSONB DEFAULT '[]'::jsonb;

-- Add new columns to past_exam_versions for enhanced extraction data
ALTER TABLE past_exam_versions
ADD COLUMN IF NOT EXISTS year_gc TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS exam_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS source_file TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS extraction_notes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS passages JSONB DEFAULT '[]'::jsonb;