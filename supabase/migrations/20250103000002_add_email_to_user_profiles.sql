-- Add email column to user_profiles table
-- This migration adds the email column to support email-based authentication

-- Add email column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Update existing records to use phone as email (temporary migration)
-- This is for existing users who might have phone numbers
UPDATE user_profiles 
SET email = CONCAT(phone, '@examace.local')
WHERE email IS NULL AND phone IS NOT NULL;

-- Make email column NOT NULL for new records
-- Note: This will fail if there are existing records without email
-- You may need to handle this manually in Supabase dashboard
-- ALTER TABLE user_profiles ALTER COLUMN email SET NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN user_profiles.email IS 'User email address for authentication';
