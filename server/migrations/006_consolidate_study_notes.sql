-- Add materials column to content_entries to support formula sheets and key definitions
ALTER TABLE content_entries
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb;

-- Drop curated_study_notes since all study notes will now use content_entries
DROP TABLE IF NOT EXISTS curated_study_notes CASCADE;
