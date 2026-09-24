-- Migration 017: Clear image data from study hub
-- Removes all image URLs, captions, and image-related data from content_entries and questions
-- Keeps the image fields in the schema (empty/null) so a new image method can populate them later

-- Clear subtopic image data in content_entries (set imageUrl and imageCaption to null in JSONB)
UPDATE content_entries
SET subtopics = (
  SELECT jsonb_agg(
    sub - 'imageUrl' - 'imageCaption' - 'imageAlign' - 'imageSize' 
    || jsonb_build_object('imageUrl', null, 'imageCaption', null)
  )
  FROM jsonb_array_elements(subtopics) AS sub
)
WHERE subtopics IS NOT NULL AND subtopics != '[]'::jsonb;

-- Clear image_url from questions table
UPDATE questions
SET image_url = NULL
WHERE image_url IS NOT NULL;

-- Clear content-images storage bucket (optional - run manually if needed)
-- DELETE FROM storage.objects WHERE bucket_id = 'content-images';
