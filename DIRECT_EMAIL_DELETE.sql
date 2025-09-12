-- DIRECT EMAIL DELETE - Let's see what's actually in the database and fix it directly

-- 1. First, let's see ALL records with this email
SELECT id, email, created_at, updated_at
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com'
ORDER BY created_at;

-- 2. Let's see if there are any constraints on the email column
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'user_profiles' 
    AND kcu.column_name = 'email'
    AND tc.table_schema = 'public';

-- 3. Let's see ALL duplicate emails in the system
SELECT 
    email, 
    COUNT(*) as count,
    array_agg(id ORDER BY created_at) as user_ids,
    array_agg(created_at ORDER BY created_at) as created_dates
FROM user_profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 4. DIRECT DELETE - Delete ALL records with this specific email
DELETE FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com';

-- 5. Verify the deletion
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com';

-- 6. First, let's see what users exist in the auth.users table
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Get a real user ID to test with
SELECT id FROM auth.users LIMIT 1;

-- 8. Now let's test inserting a fresh record with a real user ID
-- (Replace 'REAL_USER_ID_HERE' with an actual user ID from step 7)
-- INSERT INTO user_profiles (id, email, created_at, updated_at)
-- VALUES ('REAL_USER_ID_HERE', 'askforanup25nov@gmail.com', NOW(), NOW());

-- 9. Verify the deletion worked (should be empty now)
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com';

-- 9. Final check
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com'
ORDER BY created_at;
