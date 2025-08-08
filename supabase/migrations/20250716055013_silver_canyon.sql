/*
  # Create questions table for SAT Math practice

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `question` (text, the question content)
      - `option_a` (text, first option)
      - `option_b` (text, second option)
      - `option_c` (text, third option)
      - `option_d` (text, fourth option)
      - `correct_answer` (text, A/B/C/D)
      - `explanation` (text, detailed explanation)
      - `topic` (text, subject area)
      - `difficulty` (text, easy/medium/hard)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `questions` table
    - Add policy for authenticated users to read questions
    - Add policy for admin user to insert/update/delete questions

  3. Indexes
    - Index on topic for faster filtering
    - Index on difficulty for faster filtering
*/

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation text NOT NULL,
  topic text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to read questions
CREATE POLICY "Users can read questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admin user to manage questions
CREATE POLICY "Admin can manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'rptestprepservices@gmail.com'
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);