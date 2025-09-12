-- SIMPLE EMAIL CLEANUP - Just clean up the duplicates, don't test insert

-- 1. First, let's see ALL records with this email
SELECT id, email, created_at, updated_at
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com'
ORDER BY created_at;

-- 2. Let's see ALL duplicate emails in the system
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

-- 3. DIRECT DELETE - Delete ALL records with this specific email
DELETE FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com';

-- 4. Verify the deletion worked (should be empty now)
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com';

-- 5. Check if there are any other duplicate emails left
SELECT 
    email, 
    COUNT(*) as count
FROM user_profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 6. Show some recent user profiles to verify the cleanup worked
SELECT id, email, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 10;
