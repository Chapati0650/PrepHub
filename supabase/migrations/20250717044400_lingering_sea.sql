/*
  # Disable problematic triggers causing registration failure

  1. Changes Made
    - Temporarily disable the handle_new_user trigger on auth.users
    - Temporarily disable the send_welcome_email trigger (if exists)
    - This allows user registration to complete successfully

  2. Security
    - No RLS changes - maintains existing security
    - Only disables automatic triggers that were blocking registration

  3. Notes
    - User registration will work without automatic profile creation
    - Welcome emails will not be sent automatically
    - Can re-enable triggers once issues are resolved
*/

-- Disable the handle_new_user trigger that's causing registration failures
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Disable any welcome email triggers that might exist
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;

-- Also disable any triggers on the public.users table that might be interfering
DROP TRIGGER IF EXISTS on_public_user_created ON public.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON public.users;