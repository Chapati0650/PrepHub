/*
  # Update questions table for multiple choice and open-ended questions

  1. Schema Changes
    - Add question_type column (multiple_choice or open_ended)
    - Make options A-D nullable for open-ended questions
    - Update correct_answer to handle both letter choices and numeric answers
    - Remove explanation requirement
    - Update constraints and policies

  2. Security
    - Maintain existing RLS policies
    - Update validation constraints
*/

-- Add question_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'question_type'
  ) THEN
    ALTER TABLE questions ADD COLUMN question_type text DEFAULT 'multiple_choice';
  END IF;
END $$;

-- Make option columns nullable for open-ended questions
ALTER TABLE questions ALTER COLUMN option_a DROP NOT NULL;
ALTER TABLE questions ALTER COLUMN option_b DROP NOT NULL;
ALTER TABLE questions ALTER COLUMN option_c DROP NOT NULL;
ALTER TABLE questions ALTER COLUMN option_d DROP NOT NULL;

-- Make explanation nullable since we're not requiring it
ALTER TABLE questions ALTER COLUMN explanation DROP NOT NULL;

-- Drop old constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'questions_correct_answer_check') THEN
    ALTER TABLE questions DROP CONSTRAINT questions_correct_answer_check;
  END IF;
END $$;

-- Add new constraint for question type
ALTER TABLE questions ADD CONSTRAINT questions_question_type_check 
  CHECK (question_type IN ('multiple_choice', 'open_ended'));

-- Add constraint for correct_answer based on question type
ALTER TABLE questions ADD CONSTRAINT questions_correct_answer_format_check 
  CHECK (
    (question_type = 'multiple_choice' AND correct_answer IN ('A', 'B', 'C', 'D')) OR
    (question_type = 'open_ended' AND correct_answer ~ '^-?[0-9]+(\.[0-9]+)?$')
  );

-- Add constraint to ensure multiple choice questions have all options
ALTER TABLE questions ADD CONSTRAINT questions_multiple_choice_options_check 
  CHECK (
    (question_type = 'open_ended') OR 
    (question_type = 'multiple_choice' AND option_a IS NOT NULL AND option_b IS NOT NULL AND option_c IS NOT NULL AND option_d IS NOT NULL)
  );

-- Update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_topic_type ON questions(topic, question_type) WHERE is_active = true;