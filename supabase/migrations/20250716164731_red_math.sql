/*
  # Add image support to questions

  1. Schema Changes
    - Add `image_url` column to questions table for storing image URLs
    - Column is nullable since not all questions have images

  2. Storage Setup
    - Instructions for creating storage bucket in Supabase dashboard
    - RLS policies will be set up for secure image access
*/

-- Add image_url column to questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE questions ADD COLUMN image_url text;
  END IF;
END $$;

-- Add comment for the new column
COMMENT ON COLUMN questions.image_url IS 'URL of the image associated with the question (graphs, diagrams, etc.)';

-- Create index for questions with images (for potential filtering)
CREATE INDEX IF NOT EXISTS idx_questions_with_images ON questions (image_url) WHERE image_url IS NOT NULL;