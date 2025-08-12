/*
  # Update progress tracking to count only correct answers as completed

  1. Function Updates
    - Modify `update_user_progress_after_session` function
    - Change `total_questions_answered` to only increment by correct answers
    - This means a question is only "completed" when answered correctly
  
  2. Behavior Changes
    - Dashboard "Questions Answered" will only show correctly answered questions
    - "Questions Remaining" calculation will be based on correct answers only
    - Accuracy percentage remains unchanged (correct/total attempted)
*/

CREATE OR REPLACE FUNCTION public.update_user_progress_after_session()
RETURNS TRIGGER AS $$
BEGIN
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
    NEW.correct_answers, -- Only count correct answers as "completed"
    NEW.correct_answers,
    NEW.time_spent_seconds,
    1, -- Initial streak for new entry
    NEW.session_date,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_questions_answered = user_progress.total_questions_answered + NEW.correct_answers, -- Only add correct answers
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