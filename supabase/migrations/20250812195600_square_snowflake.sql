/*
  # Fix Progress Tracking System

  1. Database Functions
    - Create proper `update_user_progress_after_session` function
    - Function updates user_progress table when practice sessions are completed
    - Only counts correct answers as "mastered" questions

  2. Trigger
    - Ensure trigger fires after practice session insert
    - Updates user progress automatically

  3. Progress Calculation
    - total_questions_answered = total correct answers (mastered questions)
    - total_correct_answers = same as total_questions_answered
    - Maintains streak and time tracking
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_user_progress_after_session() CASCADE;

-- Create the proper function
CREATE OR REPLACE FUNCTION public.update_user_progress_after_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user progress
  INSERT INTO public.user_progress (
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
    NEW.correct_answers, -- Only correct answers count as "answered/mastered"
    NEW.correct_answers,
    NEW.time_spent_seconds,
    1, -- Initial streak for new entry
    NEW.session_date,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_questions_answered = user_progress.total_questions_answered + NEW.correct_answers,
    total_correct_answers = user_progress.total_correct_answers + NEW.correct_answers,
    total_time_spent_seconds = user_progress.total_time_spent_seconds + NEW.time_spent_seconds,
    current_streak = CASE
      WHEN user_progress.last_practice_date IS NULL THEN 1 -- First session ever
      WHEN NEW.session_date = user_progress.last_practice_date THEN user_progress.current_streak -- Same day, streak unchanged
      WHEN NEW.session_date = user_progress.last_practice_date + INTERVAL '1 day' THEN user_progress.current_streak + 1 -- Consecutive day
      ELSE 1 -- Non-consecutive day, reset streak
    END,
    last_practice_date = NEW.session_date,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_progress_trigger ON public.practice_sessions;

CREATE TRIGGER update_progress_trigger
  AFTER INSERT ON public.practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_progress_after_session();