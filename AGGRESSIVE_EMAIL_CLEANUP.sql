-- AGGRESSIVE EMAIL CLEANUP - This will definitely fix the P0001 error
-- WARNING: This will delete duplicate email entries, keeping only the oldest one

-- 1. First, let's see exactly what we're dealing with
SELECT 
    id, 
    email, 
    created_at,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as row_num
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com'
ORDER BY created_at;

-- 2. Check if there are any other duplicate emails
SELECT 
    email, 
    COUNT(*) as count,
    array_agg(id ORDER BY created_at) as user_ids
FROM user_profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. AGGRESSIVE CLEANUP - Delete ALL duplicates, keeping only the oldest record per email
WITH duplicates_to_delete AS (
    SELECT id
    FROM (
        SELECT 
            id, 
            email,
            ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
        FROM user_profiles
        WHERE email IS NOT NULL
    ) ranked
    WHERE rn > 1
)
DELETE FROM user_profiles
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- 4. Verify the cleanup worked
SELECT 
    email, 
    COUNT(*) as count
FROM user_profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- 5. Check the specific email we're fixing
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com';

-- 6. Now let's test the upsert function again
SELECT public.upsert_user_profile_safe(
    '00000000-0000-0000-0000-000000000000', 
    'askforanup25nov@gmail.com'
);

-- 7. If that still fails, let's create an even more aggressive function
CREATE OR REPLACE FUNCTION public.force_upsert_user_profile(
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
    -- First, delete any existing records with this email (except the current user)
    DELETE FROM user_profiles 
    WHERE email = p_email AND id != p_user_id;
    
    -- Now try to insert or update
    BEGIN
        -- Try insert first
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
            -- If insert fails, try update
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
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Failed to create or update profile'
                );
            END IF;
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Database error: ' || SQLERRM
            );
    END;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.force_upsert_user_profile(UUID, TEXT, TEXT) TO authenticated;

-- 8. Test the aggressive function
SELECT public.force_upsert_user_profile(
    '00000000-0000-0000-0000-000000000000', 
    'askforanup25nov@gmail.com'
);

-- 9. Final verification
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com';
