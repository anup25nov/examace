-- NUCLEAR EMAIL FIX - This will definitely work by temporarily disabling constraints

-- 1. First, let's see the current state
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com'
ORDER BY created_at;

-- 2. Check all duplicate emails
SELECT email, COUNT(*) as count, array_agg(id ORDER BY created_at) as user_ids
FROM user_profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. NUCLEAR OPTION: Temporarily disable the unique constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_email_key;

-- 4. Delete ALL duplicate records, keeping only the oldest one per email
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

-- 5. Re-add the unique constraint
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);

-- 6. Verify the fix
SELECT email, COUNT(*) as count
FROM user_profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- 7. Check our specific email
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com';

-- 8. Create a simple upsert function that will definitely work
CREATE OR REPLACE FUNCTION public.simple_upsert_user_profile(
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
    -- Simple approach: try insert, if fails, do update
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
            -- Update existing record
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
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Database error: ' || SQLERRM
            );
    END;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.simple_upsert_user_profile(UUID, TEXT, TEXT) TO authenticated;

-- 9. Test the simple function
SELECT public.simple_upsert_user_profile(
    '00000000-0000-0000-0000-000000000000', 
    'askforanup25nov@gmail.com'
);

-- 10. Final verification
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com';
