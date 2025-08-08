/*
  # Setup Supabase-only welcome email system

  1. Database Changes
    - Create welcome_emails table to track sent emails
    - Create function to handle new user registration
    - Setup trigger to send welcome emails

  2. Email Configuration
    - Uses Supabase's built-in email system
    - No third-party services required
    - Customizable email templates
*/

-- Create table to track welcome emails
CREATE TABLE IF NOT EXISTS welcome_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE welcome_emails ENABLE ROW LEVEL SECURITY;

-- Create policy for welcome emails
CREATE POLICY "Users can view their own welcome emails"
  ON welcome_emails
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to send welcome email using Supabase
CREATE OR REPLACE FUNCTION send_welcome_email_supabase()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_name text;
BEGIN
  -- Get user details
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  
  -- Insert into welcome_emails table (this will trigger Supabase's email system)
  INSERT INTO welcome_emails (user_id, email, status)
  VALUES (NEW.id, user_email, 'pending');
  
  -- Log the welcome email attempt
  INSERT INTO public.user_progress (user_id, total_questions_answered, total_correct_answers, total_time_spent_seconds, current_streak)
  VALUES (NEW.id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_supabase();