-- Direct Database Cleanup Script
-- This script will clean up the database issues directly

-- 1. First, let's see what exam_ids exist in the database
SELECT '=== CURRENT EXAM RECORDS ===' as section;
SELECT exam_id, COUNT(*) as record_count, COUNT(DISTINCT user_id) as unique_users
FROM exam_stats 
GROUP BY exam_id 
ORDER BY record_count DESC;

-- 2. Clean up exam_stats records that have invalid exam_ids
DELETE FROM exam_stats 
WHERE exam_id NOT IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army');

-- 3. Clean up test_completions records that have invalid exam_ids
DELETE FROM test_completions 
WHERE exam_id NOT IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army');

-- 4. Clean up test_attempts records that have invalid exam_ids
DELETE FROM test_attempts 
WHERE exam_id NOT IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army');

-- 5. Clean up individual_test_scores records that have invalid exam_ids
DELETE FROM individual_test_scores 
WHERE exam_id NOT IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army');

-- 6. Remove exam_stats records that have no corresponding test completions
DELETE FROM exam_stats 
WHERE NOT EXISTS(
    SELECT 1 FROM test_completions tc 
    WHERE tc.user_id = exam_stats.user_id 
    AND tc.exam_id = exam_stats.exam_id
);

-- 7. Fix membership inconsistencies
-- Update user_profiles to match user_memberships
UPDATE user_profiles 
SET 
    membership_status = CASE 
        WHEN um.status = 'active' AND um.end_date > NOW() THEN 'active'
        WHEN um.status = 'expired' OR um.end_date <= NOW() THEN 'expired'
        ELSE 'free'
    END,
    membership_plan = um.plan_id,
    membership_expiry = um.end_date,
    updated_at = NOW()
FROM user_memberships um
WHERE user_profiles.id = um.user_id
AND user_profiles.membership_status != CASE 
    WHEN um.status = 'active' AND um.end_date > NOW() THEN 'active'
    WHEN um.status = 'expired' OR um.end_date <= NOW() THEN 'expired'
    ELSE 'free'
END;

-- Update user_profiles for users without memberships
UPDATE user_profiles 
SET 
    membership_status = 'free',
    membership_plan = NULL,
    membership_expiry = NULL,
    updated_at = NOW()
WHERE id NOT IN (SELECT user_id FROM user_memberships)
AND membership_status != 'free';

-- 8. Show results after cleanup
SELECT '=== RESULTS AFTER CLEANUP ===' as section;
SELECT exam_id, COUNT(*) as record_count
FROM exam_stats 
GROUP BY exam_id 
ORDER BY record_count DESC;

-- 9. Show membership summary
SELECT '=== MEMBERSHIP SUMMARY ===' as section;
SELECT 
    up.id,
    up.phone,
    up.membership_status as profile_status,
    up.membership_plan as profile_plan,
    um.plan_id as actual_plan,
    um.status as actual_status,
    um.end_date as expiry_date
FROM user_profiles up
LEFT JOIN user_memberships um ON up.id = um.user_id
WHERE up.membership_status != 'free' OR um.plan_id IS NOT NULL
ORDER BY up.created_at DESC
LIMIT 10;
