-- Configure user_profiles table for PIN-based authentication
-- This migration ensures email and PIN columns are properly configured

-- First, ensure email column exists and is properly configured
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Ensure PIN column exists (6-digit PIN for quick login)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS pin VARCHAR(6);

-- Add comments to document the changes
COMMENT ON COLUMN user_profiles.email IS 'User email address for authentication';
COMMENT ON COLUMN user_profiles.pin IS '6-digit PIN for quick login (optional)';

-- Update any existing records that might have NULL email
UPDATE user_profiles 
SET email = CONCAT('user_', id, '@examace.local')
WHERE email IS NULL;
