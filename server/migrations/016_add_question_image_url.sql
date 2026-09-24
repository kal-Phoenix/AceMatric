-- Migration 016: Add image_url column for actual question images
-- Stores the URL of generated images for practice questions

ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;
