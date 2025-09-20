-- Fix is_admin function to prevent stack depth exceeded error
-- This migration creates a simple, non-recursive is_admin function

-- Drop policies that depend on is_admin function
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can delete admin users" ON admin_users;

-- Drop existing is_admin function if it exists
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_admin();

-- Create a simple is_admin function with default parameter
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  admin_emails TEXT[] := ARRAY['admin@step2sarkari.com', 'support@step2sarkari.com'];
  user_email TEXT;
BEGIN
  -- If no user_id provided, get current user
  IF user_uuid IS NULL THEN
    target_user_id := auth.uid();
  ELSE
    target_user_id := user_uuid;
  END IF;
  
  -- If no user found, return false
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = target_user_id;
  
  -- If no email found, return false
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if email is in admin list
  RETURN user_email = ANY(admin_emails);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated, anon;

-- Recreate policies
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert admin users" ON admin_users
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update admin users" ON admin_users
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete admin users" ON admin_users
  FOR DELETE USING (is_admin());
