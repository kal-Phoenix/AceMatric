-- Migration 014: Add image support to questions table
-- Adds has_image and image_placeholder columns for diagram-based questions

ALTER TABLE questions ADD COLUMN IF NOT EXISTS has_image BOOLEAN DEFAULT FALSE;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_placeholder TEXT;

-- Update the status column default if not already set
ALTER TABLE questions ALTER COLUMN status SET DEFAULT 'published';
