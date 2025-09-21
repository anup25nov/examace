-- Database Cleanup Script
-- Run this script to clean up the database issues

-- 1. Check current exam records
SELECT '=== CURRENT EXAM RECORDS ===' as section;
SELECT exam_id, COUNT(*) as record_count, COUNT(DISTINCT user_id) as unique_users
FROM exam_stats 
GROUP BY exam_id 
ORDER BY record_count DESC;

-- 2. Check test completions
SELECT '=== TEST COMPLETIONS ===' as section;
SELECT exam_id, COUNT(*) as completion_count, COUNT(DISTINCT user_id) as unique_users
FROM test_completions 
GROUP BY exam_id 
ORDER BY completion_count DESC;

-- 3. Check membership inconsistencies
SELECT '=== MEMBERSHIP INCONSISTENCIES ===' as section;
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

-- 4. Check table usage
SELECT '=== TABLE USAGE ===' as section;
SELECT * FROM get_table_usage();

-- 5. Run cleanup (uncomment to execute)
-- SELECT '=== RUNNING CLEANUP ===' as section;

-- Clean up exam_stats records with no corresponding test completions
-- DELETE FROM exam_stats 
-- WHERE NOT EXISTS(
--     SELECT 1 FROM test_completions tc 
--     WHERE tc.user_id = exam_stats.user_id 
--     AND tc.exam_id = exam_stats.exam_id
-- );

-- Clean up invalid exam_ids
-- DELETE FROM exam_stats 
-- WHERE exam_id NOT IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army');

-- Fix membership inconsistencies
-- UPDATE user_profiles 
-- SET 
--     membership_status = CASE 
--         WHEN um.status = 'active' AND um.end_date > NOW() THEN 'active'
--         WHEN um.status = 'expired' OR um.end_date <= NOW() THEN 'expired'
--         ELSE 'free'
--     END,
--     membership_plan = um.plan_id,
--     membership_expiry = um.end_date,
--     updated_at = NOW()
-- FROM user_memberships um
-- WHERE user_profiles.id = um.user_id
-- AND user_profiles.membership_status != CASE 
--     WHEN um.status = 'active' AND um.end_date > NOW() THEN 'active'
--     WHEN um.status = 'expired' OR um.end_date <= NOW() THEN 'expired'
--     ELSE 'free'
-- END;

-- Update user_profiles for users without memberships
-- UPDATE user_profiles 
-- SET 
--     membership_status = 'free',
--     membership_plan = NULL,
--     membership_expiry = NULL,
--     updated_at = NOW()
-- WHERE id NOT IN (SELECT user_id FROM user_memberships)
-- AND membership_status != 'free';

-- 6. Show results after cleanup
-- SELECT '=== RESULTS AFTER CLEANUP ===' as section;
-- SELECT exam_id, COUNT(*) as record_count
-- FROM exam_stats 
-- GROUP BY exam_id 
-- ORDER BY record_count DESC;
