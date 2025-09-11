-- Unique Constraints Setup for Phone Number and Email
-- This ensures that each phone number and email can only be used by one user

-- ==============================================
-- 1. ADD UNIQUE CONSTRAINTS TO USER_PROFILES
-- ==============================================

-- Add unique constraint for email in user_profiles
DO $$ 
BEGIN
    -- Add unique constraint for email if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_email_unique'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
    END IF;
    
    -- Add unique constraint for phone if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_phone_unique'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_phone_unique UNIQUE (phone);
    END IF;
END $$;

-- ==============================================
-- 2. ADD UNIQUE CONSTRAINTS TO AUTH.USERS
-- ==============================================

-- Note: auth.users table already has unique constraints on email and phone
-- But let's ensure they exist explicitly

-- Check if email constraint exists on auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_key' AND conrelid = 'auth.users'::regclass
    ) THEN
        -- This should already exist, but if not, we can't add it directly
        -- as it's managed by Supabase Auth
        RAISE NOTICE 'Email constraint on auth.users should already exist';
    END IF;
END $$;

-- ==============================================
-- 3. CREATE FUNCTIONS TO CHECK UNIQUENESS
-- ==============================================

-- Function to check if email is already in use
CREATE OR REPLACE FUNCTION public.check_email_uniqueness(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    email_count INTEGER;
BEGIN
    -- Check in user_profiles table
    SELECT COUNT(*) INTO email_count
    FROM public.user_profiles
    WHERE email = p_email;
    
    -- If found in user_profiles, it's not unique
    IF email_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check in auth.users table
    SELECT COUNT(*) INTO email_count
    FROM auth.users
    WHERE email = p_email;
    
    -- If found in auth.users, it's not unique
    IF email_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- If not found in either table, it's unique
    RETURN TRUE;
END;
$$;

-- Function to check if phone is already in use
CREATE OR REPLACE FUNCTION public.check_phone_uniqueness(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    phone_count INTEGER;
BEGIN
    -- Check in user_profiles table
    SELECT COUNT(*) INTO phone_count
    FROM public.user_profiles
    WHERE phone = p_phone;
    
    -- If found in user_profiles, it's not unique
    IF phone_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check in auth.users table
    SELECT COUNT(*) INTO phone_count
    FROM auth.users
    WHERE phone = p_phone;
    
    -- If found in auth.users, it's not unique
    IF phone_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- If not found in either table, it's unique
    RETURN TRUE;
END;
$$;

-- ==============================================
-- 4. CREATE TRIGGER TO ENFORCE UNIQUENESS
-- ==============================================

-- Function to validate uniqueness before insert/update
CREATE OR REPLACE FUNCTION public.validate_user_uniqueness()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check email uniqueness if email is being set
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        IF NOT public.check_email_uniqueness(NEW.email) THEN
            RAISE EXCEPTION 'Email % is already in use by another user', NEW.email;
        END IF;
    END IF;
    
    -- Check phone uniqueness if phone is being set
    IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        IF NOT public.check_phone_uniqueness(NEW.phone) THEN
            RAISE EXCEPTION 'Phone number % is already in use by another user', NEW.phone;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for user_profiles table
DROP TRIGGER IF EXISTS validate_user_uniqueness_trigger ON public.user_profiles;
CREATE TRIGGER validate_user_uniqueness_trigger
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_user_uniqueness();

-- ==============================================
-- 5. GRANT PERMISSIONS
-- ==============================================

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.check_email_uniqueness(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_phone_uniqueness(TEXT) TO authenticated;

-- ==============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Create indexes for faster uniqueness checks
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone) WHERE phone IS NOT NULL;

-- ==============================================
-- 7. COMPLETION MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'Unique constraints setup completed successfully!';
    RAISE NOTICE 'Email uniqueness: user_profiles_email_unique';
    RAISE NOTICE 'Phone uniqueness: user_profiles_phone_unique';
    RAISE NOTICE 'Validation functions: check_email_uniqueness, check_phone_uniqueness';
    RAISE NOTICE 'Trigger: validate_user_uniqueness_trigger';
END $$;
