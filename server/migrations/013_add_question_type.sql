-- Migration 013: Add question_type column to distinguish practice vs past_exam questions
-- Practice questions are curriculum-aligned drill questions
-- Past exam questions are from real national exams

ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'practice';

-- Mark existing past exam questions (those whose chapter looks like an exam title, not a curriculum chapter)
UPDATE questions
SET question_type = 'past_exam'
WHERE chapter LIKE '%National Exam%'
   OR chapter LIKE '%Exam%'
   OR chapter LIKE '%Grade 9%'
   OR chapter LIKE '%Grade 10%';

-- Mark remaining as practice (they should already be default, but be explicit)
UPDATE questions
SET question_type = 'practice'
WHERE question_type = 'practice'
  AND (chapter LIKE 'Grade 12 - Chapter%' OR chapter LIKE 'Grade 11 - Chapter%');

-- Create index for fast filtering
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
