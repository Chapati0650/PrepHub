/*
  # Fix Supabase Performance and Security Issues

  This migration addresses the critical performance issues identified by Supabase linter:
  
  1. **RLS Policy Performance**: Fix auth function calls that re-evaluate for each row
  2. **Missing Indexes**: Add indexes for foreign keys to improve query performance
  3. **Duplicate Policies**: Remove duplicate RLS policies that cause performance issues
  4. **Unused Indexes**: Clean up unused indexes

  ## Changes Made:
  - Updated all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
  - Added missing indexes for foreign key columns
  - Removed duplicate RLS policies
  - Cleaned up unused indexes
*/

-- First, drop duplicate policies that are causing performance issues
DROP POLICY IF EXISTS "Authenticated users can view their own practice sessions." ON practice_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert their own practice sessions." ON practice_sessions;
DROP POLICY IF EXISTS "Authenticated users can view their own user progress." ON user_progress;
DROP POLICY IF EXISTS "Authenticated users can insert their own user progress." ON user_progress;
DROP POLICY IF EXISTS "Authenticated users can update their own user progress." ON user_progress;
DROP POLICY IF EXISTS "Authenticated users can view their own topic mastery." ON topic_mastery;
DROP POLICY IF EXISTS "Authenticated users can insert their own topic mastery." ON topic_mastery;
DROP POLICY IF EXISTS "Authenticated users can update their own topic mastery." ON topic_mastery;

-- Drop and recreate RLS policies with optimized auth function calls
-- Practice Sessions
DROP POLICY IF EXISTS "Users can view their own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can insert their own practice sessions" ON practice_sessions;

CREATE POLICY "Users can view their own practice sessions"
  ON practice_sessions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own practice sessions"
  ON practice_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- User Progress
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;

CREATE POLICY "Users can view their own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Topic Mastery
DROP POLICY IF EXISTS "Users can view their own topic mastery" ON topic_mastery;
DROP POLICY IF EXISTS "Users can insert their own topic mastery" ON topic_mastery;
DROP POLICY IF EXISTS "Users can update their own topic mastery" ON topic_mastery;

CREATE POLICY "Users can view their own topic mastery"
  ON topic_mastery
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own topic mastery"
  ON topic_mastery
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own topic mastery"
  ON topic_mastery
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Welcome Emails
DROP POLICY IF EXISTS "Users can view their own welcome emails" ON welcome_emails;

CREATE POLICY "Users can view their own welcome emails"
  ON welcome_emails
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO public
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO public
  USING ((select auth.uid()) = id);

CREATE POLICY "Enable insert for authenticated users only"
  ON users
  FOR INSERT
  TO public
  WITH CHECK ((select auth.uid()) = id);

-- Questions table - fix admin policy
DROP POLICY IF EXISTS "Admin can manage questions" ON questions;
DROP POLICY IF EXISTS "Users can read active questions" ON questions;

CREATE POLICY "Admin can manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (((select auth.jwt()) ->> 'email'::text) = 'rptestprepservices@gmail.com'::text)
  WITH CHECK (((select auth.jwt()) ->> 'email'::text) = 'rptestprepservices@gmail.com'::text);

CREATE POLICY "Users can read active questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Add missing indexes for foreign keys to improve performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);
CREATE INDEX IF NOT EXISTS idx_welcome_emails_user_id ON welcome_emails(user_id);

-- Drop unused indexes that are not being utilized
DROP INDEX IF EXISTS idx_questions_difficulty;
DROP INDEX IF EXISTS idx_questions_random;
DROP INDEX IF EXISTS idx_questions_number;
DROP INDEX IF EXISTS idx_questions_type;
DROP INDEX IF EXISTS idx_questions_with_images;

-- Add more useful indexes based on actual query patterns
CREATE INDEX IF NOT EXISTS idx_questions_topic_active ON questions(topic, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_questions_active_only ON questions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_date ON practice_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user_topic ON topic_mastery(user_id, topic);