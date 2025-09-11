-- Admin Role Setup
-- This script adds admin role functionality to restrict admin access

-- ==============================================
-- 1. ADD ADMIN ROLE TO USER_PROFILES
-- ==============================================

-- Add admin role column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ==============================================
-- 2. CREATE FUNCTION TO CHECK ADMIN STATUS
-- ==============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    -- Check if user is admin in user_profiles
    SELECT is_admin INTO admin_status
    FROM public.user_profiles
    WHERE id = user_uuid;
    
    -- Return admin status (default to false if user not found)
    RETURN COALESCE(admin_status, FALSE);
END;
$$;

-- ==============================================
-- 3. CREATE FUNCTION TO GRANT ADMIN ACCESS
-- ==============================================

-- Function to grant admin access to a user
CREATE OR REPLACE FUNCTION public.grant_admin_access(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update user_profiles to set is_admin = true
    UPDATE public.user_profiles
    SET is_admin = TRUE, updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Check if update was successful
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- ==============================================
-- 4. CREATE FUNCTION TO REVOKE ADMIN ACCESS
-- ==============================================

-- Function to revoke admin access from a user
CREATE OR REPLACE FUNCTION public.revoke_admin_access(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update user_profiles to set is_admin = false
    UPDATE public.user_profiles
    SET is_admin = FALSE, updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Check if update was successful
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- ==============================================
-- 5. GRANT PERMISSIONS
-- ==============================================

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_access(UUID) TO authenticated;

-- ==============================================
-- 6. SET INITIAL ADMIN USERS (OPTIONAL)
-- ==============================================

-- Uncomment and modify the email below to grant admin access to specific users
-- You can run this after the migration to set initial admin users

-- Example: Grant admin access to a specific user by email
-- UPDATE public.user_profiles 
-- SET is_admin = TRUE, updated_at = NOW()
-- WHERE email = 'admin@examace.com';

-- ==============================================
-- 7. COMPLETION MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'Admin role setup completed successfully!';
    RAISE NOTICE 'Added is_admin column to user_profiles table';
    RAISE NOTICE 'Created functions: is_user_admin, grant_admin_access, revoke_admin_access';
    RAISE NOTICE 'To grant admin access, use: SELECT public.grant_admin_access(user_uuid);';
END $$;
