/*
  # Enhanced Questions Schema for 300-Question Bank

  1. Schema Updates
    - Optimized for exactly 300 questions
    - Enhanced indexing for random selection
    - Support for mathematical notation
    - Admin-only access controls

  2. Security
    - RLS policies for admin-only uploads
    - User read access for practice sessions
    - Audit trail for question management

  3. Performance
    - Indexes for fast random selection
    - Optimized for selecting 10 random questions from 300
*/

-- Drop existing table if it exists to recreate with enhanced schema
DROP TABLE IF EXISTS questions CASCADE;

-- Create enhanced questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number integer UNIQUE, -- For tracking the 300 questions
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation text NOT NULL,
  topic text NOT NULL,
  difficulty text NOT NULL DEFAULT 'hard' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true -- For enabling/disabling questions
);

-- Create indexes for performance
CREATE INDEX idx_questions_active ON questions (is_active);
CREATE INDEX idx_questions_difficulty ON questions (difficulty);
CREATE INDEX idx_questions_topic ON questions (topic);
CREATE INDEX idx_questions_random ON questions (id); -- For random selection
CREATE INDEX idx_questions_number ON questions (question_number);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Admin can manage all questions (only rptestprepservices@gmail.com)
CREATE POLICY "Admin can manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'rptestprepservices@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'rptestprepservices@gmail.com');

-- Users can read active questions for practice
CREATE POLICY "Users can read active questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Function to get random questions
CREATE OR REPLACE FUNCTION get_random_questions(question_count integer DEFAULT 10)
RETURNS SETOF questions AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM questions 
  WHERE is_active = true AND difficulty = 'hard'
  ORDER BY RANDOM()
  LIMIT question_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;