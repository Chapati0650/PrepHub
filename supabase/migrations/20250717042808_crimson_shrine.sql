/*
  # Setup Welcome Email Trigger

  1. Creates a trigger function that calls the Edge Function
  2. Sets up the trigger to fire on user signup
  3. Ensures proper error handling and logging
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'New user trigger fired for user: %', NEW.id;
  
  -- Call the Edge Function to send welcome email
  PERFORM
    net.http_post(
      url := 'https://ehlklfopwpmgkthqmqgd.supabase.co/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVobGtsZm9wd3BtZ2t0aHFtcWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI5NTcyOSwiZXhwIjoyMDY3ODcxNzI5fQ.Ej6zQJGhEOJOGKJJQKJJQKJJQKJJQKJJQKJJQKJJQKJ'
      ),
      body := jsonb_build_object('record', to_jsonb(NEW))
    );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error sending welcome email: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;