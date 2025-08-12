/*
  # Fix User Progress Tracking

  1. Database Functions
    - Create proper `update_user_progress_after_session` function
    - Function calculates progress from question attempts table
    - Only counts correct answers as "mastered questions"

  2. Trigger Setup
    - Ensure trigger fires after practice session insert
    - Updates user_progress table with latest stats

  3. Progress Calculation
    - total_questions_answered = count of correct question attempts
    - total_correct_answers = same as above (since only correct count as answered)
    - current_streak = consecutive practice days
    - last_practice_date = most recent session date
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_user_progress_after_session() CASCADE;

-- Create the proper function
CREATE OR REPLACE FUNCTION public.update_user_progress_after_session()
RETURNS TRIGGER AS $$
DECLARE
  correct_attempts_count INTEGER;
  total_time_spent INTEGER;
  last_session_date DATE;
  streak_count INTEGER;
BEGIN
  -- Calculate total correct attempts for this user
  SELECT COUNT(*)
  INTO correct_attempts_count
  FROM public.user_question_attempts
  WHERE user_id = NEW.user_id AND is_correct = true;

  -- Calculate total time spent from all sessions
  SELECT COALESCE(SUM(time_spent_seconds), 0)
  INTO total_time_spent
  FROM public.practice_sessions
  WHERE user_id = NEW.user_id;

  -- Get the most recent session date before this one
  SELECT session_date
  INTO last_session_date
  FROM public.practice_sessions
  WHERE user_id = NEW.user_id AND session_date < NEW.session_date
  ORDER BY session_date DESC
  LIMIT 1;

  -- Calculate streak
  IF last_session_date IS NULL THEN
    -- First session ever
    streak_count := 1;
  ELSIF NEW.session_date = last_session_date THEN
    -- Same day, keep existing streak
    SELECT COALESCE(current_streak, 1)
    INTO streak_count
    FROM public.user_progress
    WHERE user_id = NEW.user_id;
  ELSIF NEW.session_date = last_session_date + INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    SELECT COALESCE(current_streak, 0) + 1
    INTO streak_count
    FROM public.user_progress
    WHERE user_id = NEW.user_id;
  ELSE
    -- Non-consecutive day, reset streak
    streak_count := 1;
  END IF;

  -- Upsert user progress
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
    correct_attempts_count,
    correct_attempts_count,
    total_time_spent,
    streak_count,
    NEW.session_date,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_questions_answered = correct_attempts_count,
    total_correct_answers = correct_attempts_count,
    total_time_spent_seconds = total_time_spent,
    current_streak = streak_count,
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