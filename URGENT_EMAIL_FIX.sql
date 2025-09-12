-- URGENT EMAIL CONSTRAINT FIX
-- This script will immediately fix the P0001 email constraint error

-- 1. First, let's see what's in the database
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com'
ORDER BY created_at;

-- 2. Check if there are multiple users with the same email
SELECT email, COUNT(*) as count, array_agg(id) as user_ids
FROM user_profiles
WHERE email = 'askforanup25nov@gmail.com'
GROUP BY email;

-- 3. If there are duplicates, we need to clean them up
-- Keep the oldest record and delete the newer ones
WITH duplicates AS (
  SELECT id, email, created_at,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
  FROM user_profiles
  WHERE email = 'askforanup25nov@gmail.com'
)
DELETE FROM user_profiles
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 4. Check what constraints exist on the table
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_profiles'
AND tc.constraint_type = 'UNIQUE';

-- 5. If there's a unique constraint on email, we need to handle it properly
-- Let's create a function that handles email conflicts gracefully
CREATE OR REPLACE FUNCTION public.safe_upsert_user_profile_v2(
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
    existing_email TEXT;
    result JSONB;
BEGIN
    -- Check if email already exists with a different user_id
    SELECT id, email INTO existing_user_id, existing_email
    FROM user_profiles
    WHERE email = p_email;
    
    IF existing_user_id IS NOT NULL AND existing_user_id != p_user_id THEN
        -- Email already exists with different user, return error
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email already in use by another user',
            'existing_user_id', existing_user_id,
            'existing_email', existing_email
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
            'message', 'User profile updated',
            'user_id', p_user_id,
            'email', p_email
        );
    ELSE
        -- Create new user profile
        INSERT INTO user_profiles (id, email, pin, created_at, updated_at)
        VALUES (p_user_id, p_email, p_pin, NOW(), NOW());
        
        RETURN jsonb_build_object(
            'success', true,
            'is_new_user', true,
            'message', 'User profile created',
            'user_id', p_user_id,
            'email', p_email
        );
    END IF;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle unique constraint violations
        IF SQLSTATE = '23505' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Email already exists',
                'sqlstate', SQLSTATE
            );
        END IF;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unique constraint violation: ' || SQLERRM,
            'sqlstate', SQLSTATE
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.safe_upsert_user_profile_v2(UUID, TEXT, TEXT) TO authenticated;

-- 7. Test the function with the problematic email
SELECT public.safe_upsert_user_profile_v2(
    '00000000-0000-0000-0000-000000000000', 
    'askforanup25nov@gmail.com'
);

-- 8. Alternative approach: Use a different upsert strategy
-- This function will handle the upsert more carefully
CREATE OR REPLACE FUNCTION public.upsert_user_profile_safe(
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
    result JSONB;
BEGIN
    -- Try to insert first
    BEGIN
        INSERT INTO user_profiles (id, email, pin, created_at, updated_at)
        VALUES (p_user_id, p_email, p_pin, NOW(), NOW());
        
        RETURN jsonb_build_object(
            'success', true,
            'is_new_user', true,
            'message', 'User profile created',
            'user_id', p_user_id,
            'email', p_email
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- If insert fails due to unique constraint, try update
            BEGIN
                UPDATE user_profiles
                SET 
                    email = p_email,
                    pin = COALESCE(p_pin, pin),
                    updated_at = NOW()
                WHERE id = p_user_id;
                
                IF FOUND THEN
                    RETURN jsonb_build_object(
                        'success', true,
                        'is_new_user', false,
                        'message', 'User profile updated',
                        'user_id', p_user_id,
                        'email', p_email
                    );
                ELSE
                    -- User doesn't exist, but email is taken by someone else
                    RETURN jsonb_build_object(
                        'success', false,
                        'error', 'Email already in use by another user'
                    );
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    RETURN jsonb_build_object(
                        'success', false,
                        'error', 'Update failed: ' || SQLERRM
                    );
            END;
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insert failed: ' || SQLERRM
            );
    END;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.upsert_user_profile_safe(UUID, TEXT, TEXT) TO authenticated;

-- Test this function too
SELECT public.upsert_user_profile_safe(
    '00000000-0000-0000-0000-000000000000', 
    'askforanup25nov@gmail.com'
);
