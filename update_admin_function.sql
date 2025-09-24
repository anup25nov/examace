-- Update the is_admin function to check user_profiles.is_admin column
-- Instead of checking email arrays

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
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
  
  -- Check is_admin column in user_profiles table
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = target_user_id 
    AND is_admin = true
  );
END;
$$;

-- Now insert the user as admin in both tables

-- 1. First ensure user exists in user_profiles with is_admin = true
INSERT INTO user_profiles (
    id,
    phone,
    membership_status,
    membership_plan,
    membership_expiry,
    email,
    name,
    phone_verified,
    is_admin,
    created_at,
    updated_at
) VALUES (
    '9948aaa7-1746-465a-968a-3f8c5b3d5870',
    '+919999999999', -- Placeholder phone, update with actual phone
    'free',
    'pro_plus', -- Give them pro_plus access
    NOW() + INTERVAL '1 year', -- 1 year membership
    'admin@examace.com', -- Placeholder email, update with actual email
    'Super Admin', -- Placeholder name, update with actual name
    true, -- Phone verified
    true, -- Is admin
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    membership_plan = 'pro_plus',
    membership_expiry = NOW() + INTERVAL '1 year',
    updated_at = NOW();

-- 2. Insert into admin_users table
INSERT INTO admin_users (
    user_id,
    role,
    created_by,
    is_active,
    created_at,
    updated_at
) VALUES (
    '9948aaa7-1746-465a-968a-3f8c5b3d5870',
    'super_admin',
    '9948aaa7-1746-465a-968a-3f8c5b3d5870', -- Self-created admin
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    updated_at = NOW();

-- Verify the admin user was added/updated
SELECT 
    'user_profiles' as table_name,
    id,
    phone,
    email,
    name,
    is_admin,
    membership_plan,
    membership_expiry
FROM user_profiles 
WHERE id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'

UNION ALL

SELECT 
    'admin_users' as table_name,
    user_id::text,
    role,
    created_by::text,
    NULL,
    is_active::text,
    NULL,
    created_at::text
FROM admin_users 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- Test the is_admin function
SELECT 
    'is_admin function test' as test,
    is_admin('9948aaa7-1746-465a-968a-3f8c5b3d5870') as result;
