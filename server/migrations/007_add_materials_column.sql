-- 007: Add missing 'materials' column to content_entries and content_versions.
--
-- The code in content-db.ts was updated to write a 'materials' field but the
-- original 003_cms_content_tables.sql migration did not include this column.
-- Running this migration brings the live schema in sync with the application code.

ALTER TABLE content_entries
  ADD COLUMN IF NOT EXISTS materials JSONB NOT NULL DEFAULT '[]';

ALTER TABLE content_versions
  ADD COLUMN IF NOT EXISTS materials JSONB NOT NULL DEFAULT '[]';
