-- Email Constraint Fix for ExamAce
-- This script fixes the P0001 error: "Email already in use by another user"

-- 1. First, let's check if there are any duplicate emails in user_profiles
-- This query will help identify the issue
SELECT email, COUNT(*) as count, array_agg(id) as user_ids
FROM user_profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- 2. If there are duplicates, we need to clean them up
-- Keep the oldest record and remove duplicates
WITH duplicates AS (
  SELECT id, email, created_at,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
  FROM user_profiles
  WHERE email IS NOT NULL
)
DELETE FROM user_profiles
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 3. Check if there's already a unique constraint on email
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles' 
AND constraint_type = 'UNIQUE'
AND constraint_name LIKE '%email%';

-- 4. If there's no unique constraint, add one
-- First, drop any existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_email_key' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_email_key;
        RAISE NOTICE 'Dropped existing email constraint';
    END IF;
END $$;

-- Add the unique constraint on email
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);

-- 5. Create a function to safely handle user profile creation/update
CREATE OR REPLACE FUNCTION public.safe_upsert_user_profile(
    p_user_id UUID,
    p_email TEXT,
    p_pin TEXT DEFAULT NULL
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
    -- Check if email already exists with a different user_id
    SELECT id INTO existing_user_id
    FROM user_profiles
    WHERE email = p_email AND id != p_user_id;
    
    IF existing_user_id IS NOT NULL THEN
        -- Email already exists with different user, return error
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email already in use by another user',
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
            pin = COALESCE(p_pin, pin),
            updated_at = NOW()
        WHERE id = p_user_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'is_new_user', false,
            'message', 'User profile updated'
        );
    ELSE
        -- Create new user profile
        INSERT INTO user_profiles (id, email, pin, created_at, updated_at)
        VALUES (p_user_id, p_email, p_pin, NOW(), NOW());
        
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

-- 6. Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.safe_upsert_user_profile(UUID, TEXT, TEXT) TO authenticated;

-- 7. Create an index on email for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- 8. Add a trigger to automatically update updated_at
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

-- 9. Test the function
-- Uncomment these lines to test the function
-- SELECT public.safe_upsert_user_profile('00000000-0000-0000-0000-000000000000', 'test@example.com');
-- SELECT public.safe_upsert_user_profile('00000000-0000-0000-0000-000000000000', 'test@example.com', '123456');
