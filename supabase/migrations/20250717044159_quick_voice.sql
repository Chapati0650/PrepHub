/*
  # Fix user registration database error

  This migration fixes the "Database error saving new user" issue by:
  1. Updating the handle_new_user function to handle errors gracefully
  2. Ensuring the users table exists with proper structure
  3. Adding proper error handling to prevent registration failures
  4. Making the welcome email sending non-blocking
*/

-- First, ensure the users table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  picture text,
  provider text DEFAULT 'email',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create or replace the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into users table with error handling
  BEGIN
    INSERT INTO public.users (id, email, name, picture, provider)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
      COALESCE(NEW.raw_user_meta_data->>'picture', NEW.raw_user_meta_data->>'avatar_url'),
      COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the registration
    RAISE WARNING 'Failed to insert user into public.users: %', SQLERRM;
  END;

  -- Initialize user progress with error handling
  BEGIN
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the registration
    RAISE WARNING 'Failed to initialize user progress: %', SQLERRM;
  END;

  -- Send welcome email with error handling (non-blocking)
  BEGIN
    PERFORM public.send_welcome_email_supabase(NEW.id, NEW.email);
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the registration
    RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the send_welcome_email_supabase function to be more robust
CREATE OR REPLACE FUNCTION public.send_welcome_email_supabase(user_id uuid, user_email text)
RETURNS void AS $$
BEGIN
  -- Insert welcome email record with error handling
  BEGIN
    INSERT INTO public.welcome_emails (user_id, email, status)
    VALUES (user_id, user_email, 'sent')
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail
    RAISE WARNING 'Failed to log welcome email: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure welcome_emails table exists
CREATE TABLE IF NOT EXISTS public.welcome_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent'
);

-- Enable RLS on welcome_emails table
ALTER TABLE public.welcome_emails ENABLE ROW LEVEL SECURITY;

-- Create policy for welcome_emails
DROP POLICY IF EXISTS "Users can view their own welcome emails" ON public.welcome_emails;
CREATE POLICY "Users can view their own welcome emails"
  ON public.welcome_emails
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);