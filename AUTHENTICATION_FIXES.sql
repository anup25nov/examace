-- Authentication Fixes for ExamAce
-- This script fixes the PGRST116 and P0001 errors in the authentication system

-- 1. First, let's check if there are any duplicate emails in user_profiles
-- This query will help identify the issue
SELECT email, COUNT(*) as count
FROM user_profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- 2. If there are duplicates, we need to clean them up
-- Keep the oldest record and remove duplicates
WITH duplicates AS (
  SELECT id, email, created_at,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
  FROM user_profiles
)
DELETE FROM user_profiles
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 3. Add a unique constraint on email to prevent future duplicates
-- First, drop the existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_email_key' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_email_key;
    END IF;
END $$;

-- Add the unique constraint
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);

-- 4. Create a function to safely create user profiles
CREATE OR REPLACE FUNCTION public.safe_create_user_profile(
    p_user_id UUID,
    p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    existing_user_id UUID;
    result JSONB;
BEGIN
    -- Check if email already exists
    SELECT id INTO existing_user_id
    FROM user_profiles
    WHERE email = p_email;
    
    IF existing_user_id IS NOT NULL THEN
        -- Email already exists, return error
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email already exists',
            'existing_user_id', existing_user_id
        );
    END IF;
    
    -- Check if user profile already exists
    SELECT id INTO existing_user_id
    FROM user_profiles
    WHERE id = p_user_id;
    
    IF existing_user_id IS NOT NULL THEN
        -- User profile already exists, update it
        UPDATE user_profiles
        SET 
            email = p_email,
            updated_at = NOW()
        WHERE id = p_user_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'is_new_user', false,
            'message', 'User profile updated'
        );
    ELSE
        -- Create new user profile
        INSERT INTO user_profiles (id, email, created_at, updated_at)
        VALUES (p_user_id, p_email, NOW(), NOW());
        
        RETURN jsonb_build_object(
            'success', true,
            'is_new_user', true,
            'message', 'User profile created'
        );
    END IF;
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email already exists'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 5. Create a function to safely get user profile
CREATE OR REPLACE FUNCTION public.safe_get_user_profile(
    p_user_id UUID
)
RETURNS TABLE(
    id UUID,
    email TEXT,
    name TEXT,
    phone TEXT,
    phone_verified BOOLEAN,
    upi_id TEXT,
    referral_earnings DECIMAL,
    total_referrals INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        COALESCE(up.name, '') as name,
        COALESCE(up.phone, '') as phone,
        COALESCE(up.phone_verified, false) as phone_verified,
        COALESCE(up.upi_id, '') as upi_id,
        COALESCE(up.referral_earnings, 0) as referral_earnings,
        COALESCE(up.total_referrals, 0) as total_referrals,
        up.created_at,
        up.updated_at
    FROM user_profiles up
    WHERE up.id = p_user_id;
END;
$$;

-- 6. Update RLS policies to be more robust
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 7. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION public.safe_create_user_profile(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_get_user_profile(UUID) TO authenticated;

-- 8. Create an index on email for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- 9. Add a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- 10. Test the functions
-- Uncomment these lines to test the functions
-- SELECT public.safe_create_user_profile('00000000-0000-0000-0000-000000000000', 'test@example.com');
-- SELECT * FROM public.safe_get_user_profile('00000000-0000-0000-0000-000000000000');
