/*
  # Create user question attempts tracking

  1. New Tables
    - `user_question_attempts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `question_id` (uuid, foreign key to questions)
      - `is_correct` (boolean, tracks if user answered correctly)
      - `attempted_at` (timestamp)
      - Unique constraint on (user_id, question_id)

  2. Security
    - Enable RLS on `user_question_attempts` table
    - Add policies for authenticated users to manage their own attempts

  3. Indexes
    - Index on user_id for fast lookups
    - Index on user_id + is_correct for filtering solved questions
*/

-- Create user_question_attempts table
CREATE TABLE IF NOT EXISTS user_question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  is_correct boolean NOT NULL DEFAULT false,
  attempted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own question attempts"
  ON user_question_attempts
  FOR INSERT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own question attempts"
  ON user_question_attempts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own question attempts"
  ON user_question_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_question_attempts_user_id 
  ON user_question_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_user_question_attempts_user_correct 
  ON user_question_attempts(user_id, is_correct) 
  WHERE is_correct = true;

CREATE INDEX IF NOT EXISTS idx_user_question_attempts_question_id 
  ON user_question_attempts(question_id);