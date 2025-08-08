/*
  # Update questions table for skill-based categorization

  1. Changes
    - Update topic field to use specific skill categories
    - Set all questions to 'hard' difficulty by default
    - Add constraint for valid skills
    - Update indexes for better performance

  2. Skills
    - Algebra
    - Advanced Math  
    - Problem Solving and Data Analysis
    - Geo/Trig
*/

-- Update the topic constraint to use the new skill categories
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_topic_check;
ALTER TABLE questions ADD CONSTRAINT questions_topic_check 
  CHECK (topic = ANY (ARRAY['Algebra'::text, 'Advanced Math'::text, 'Problem Solving and Data Analysis'::text, 'Geo/Trig'::text]));

-- Set default difficulty to hard for all questions
ALTER TABLE questions ALTER COLUMN difficulty SET DEFAULT 'hard';

-- Update existing questions to hard if any exist
UPDATE questions SET difficulty = 'hard' WHERE difficulty != 'hard';

-- Add index for skill-based filtering
DROP INDEX IF EXISTS idx_questions_topic;
CREATE INDEX idx_questions_skill ON questions(topic) WHERE is_active = true;

-- Update the random questions function to work with skills
CREATE OR REPLACE FUNCTION get_random_questions_by_skill(skill_name text, question_count integer)
RETURNS TABLE (
  id uuid,
  question_number integer,
  question text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer text,
  explanation text,
  topic text,
  difficulty text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    q.id,
    q.question_number,
    q.question,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.correct_answer,
    q.explanation,
    q.topic,
    q.difficulty
  FROM questions q
  WHERE q.is_active = true 
    AND q.topic = skill_name
  ORDER BY RANDOM()
  LIMIT question_count;
$$;

-- Function for mixed questions (all skills)
CREATE OR REPLACE FUNCTION get_random_questions_mixed(question_count integer)
RETURNS TABLE (
  id uuid,
  question_number integer,
  question text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer text,
  explanation text,
  topic text,
  difficulty text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    q.id,
    q.question_number,
    q.question,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.correct_answer,
    q.explanation,
    q.topic,
    q.difficulty
  FROM questions q
  WHERE q.is_active = true
  ORDER BY RANDOM()
  LIMIT question_count;
$$;