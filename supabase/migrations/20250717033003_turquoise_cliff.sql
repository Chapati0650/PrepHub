/*
  # Create User Progress Tracking Tables

  1. New Tables
    - `practice_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `topic` (text)
      - `difficulty` (text, default 'hard')
      - `total_questions` (integer)
      - `correct_answers` (integer)
      - `time_spent_seconds` (integer)
      - `session_date` (date)
      - `created_at` (timestamp)
    
    - `user_progress`
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `total_questions_answered` (integer, default 0)
      - `total_correct_answers` (integer, default 0)
      - `total_time_spent_seconds` (integer, default 0)
      - `current_streak` (integer, default 0)
      - `last_practice_date` (date)
      - `updated_at` (timestamp)
    
    - `topic_mastery`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `topic` (text)
      - `mastery_percentage` (integer, 0-100)
      - `updated_at` (timestamp)
      - Unique constraint on (user_id, topic)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  difficulty text NOT NULL DEFAULT 'hard',
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  time_spent_seconds integer NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions_answered integer DEFAULT 0,
  total_correct_answers integer DEFAULT 0,
  total_time_spent_seconds integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  last_practice_date date,
  updated_at timestamptz DEFAULT now()
);

-- Create topic_mastery table
CREATE TABLE IF NOT EXISTS topic_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  mastery_percentage integer NOT NULL DEFAULT 0 CHECK (mastery_percentage >= 0 AND mastery_percentage <= 100),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, topic)
);

-- Enable Row Level Security
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_mastery ENABLE ROW LEVEL SECURITY;

-- Policies for practice_sessions
CREATE POLICY "Users can view their own practice sessions"
  ON practice_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions"
  ON practice_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_progress
CREATE POLICY "Users can view their own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for topic_mastery
CREATE POLICY "Users can view their own topic mastery"
  ON topic_mastery
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topic mastery"
  ON topic_mastery
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topic mastery"
  ON topic_mastery
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update user progress after a practice session
CREATE OR REPLACE FUNCTION update_user_progress_after_session()
RETURNS TRIGGER AS $$
DECLARE
  streak_count integer := 0;
  prev_date date;
BEGIN
  -- Get the previous practice date
  SELECT last_practice_date INTO prev_date
  FROM user_progress
  WHERE user_id = NEW.user_id;

  -- Calculate streak
  IF prev_date IS NULL THEN
    -- First session
    streak_count := 1;
  ELSIF NEW.session_date = prev_date THEN
    -- Same day, keep current streak
    SELECT current_streak INTO streak_count
    FROM user_progress
    WHERE user_id = NEW.user_id;
  ELSIF NEW.session_date = prev_date + INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    SELECT current_streak + 1 INTO streak_count
    FROM user_progress
    WHERE user_id = NEW.user_id;
  ELSE
    -- Streak broken, reset to 1
    streak_count := 1;
  END IF;

  -- Insert or update user progress
  INSERT INTO user_progress (
    user_id,
    total_questions_answered,
    total_correct_answers,
    total_time_spent_seconds,
    current_streak,
    last_practice_date,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.total_questions,
    NEW.correct_answers,
    NEW.time_spent_seconds,
    streak_count,
    NEW.session_date,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_questions_answered = user_progress.total_questions_answered + NEW.total_questions,
    total_correct_answers = user_progress.total_correct_answers + NEW.correct_answers,
    total_time_spent_seconds = user_progress.total_time_spent_seconds + NEW.time_spent_seconds,
    current_streak = streak_count,
    last_practice_date = NEW.session_date,
    updated_at = now();

  -- Update topic mastery
  INSERT INTO topic_mastery (user_id, topic, mastery_percentage, updated_at)
  VALUES (
    NEW.user_id,
    NEW.topic,
    LEAST(100, GREATEST(0, (NEW.correct_answers * 100 / NEW.total_questions))),
    now()
  )
  ON CONFLICT (user_id, topic) DO UPDATE SET
    mastery_percentage = LEAST(100, GREATEST(0, 
      (topic_mastery.mastery_percentage * 0.7 + (NEW.correct_answers * 100 / NEW.total_questions) * 0.3)::integer
    )),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update progress
CREATE TRIGGER update_progress_trigger
  AFTER INSERT ON practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress_after_session();