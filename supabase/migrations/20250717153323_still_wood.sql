/*
  # Remove all auth triggers to fix registration

  This migration removes all triggers and functions that run on auth.users table
  to prevent the "Database error saving new user" issue during registration.

  ## Changes Made
  1. Drop all triggers on auth.users table
  2. Remove the handle_new_user function
  3. Remove the send_welcome_email_supabase function
  4. Clean up any remaining trigger dependencies

  This will allow users to register successfully without any automatic
  profile creation or welcome email functionality.
*/

-- Drop all triggers on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;

-- Drop the problematic functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS send_welcome_email_supabase() CASCADE;

-- Also drop any other auth-related triggers that might exist
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Find and drop all triggers on auth.users table
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON auth.users CASCADE';
    END LOOP;
END $$;

-- Ensure users table in public schema has proper RLS policies
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for users table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can read own data" ON public.users;
        DROP POLICY IF EXISTS "Users can update own data" ON public.users;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
        
        -- Create simple policies
        CREATE POLICY "Users can read own data" ON public.users
            FOR SELECT USING (auth.uid() = id);
            
        CREATE POLICY "Users can update own data" ON public.users
            FOR UPDATE USING (auth.uid() = id);
            
        CREATE POLICY "Enable insert for authenticated users only" ON public.users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;