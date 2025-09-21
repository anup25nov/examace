-- Verify Database Cleanup Results
-- This script verifies that the cleanup worked correctly

-- 1. Check exam records after cleanup
SELECT '=== EXAM RECORDS AFTER CLEANUP ===' as section;
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

-- 3. Check membership summary
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

-- 4. Check table usage
SELECT '=== TABLE USAGE ===' as section;
SELECT * FROM get_table_usage();

-- 5. Check for any remaining invalid exam_ids
SELECT '=== INVALID EXAM IDS CHECK ===' as section;
SELECT exam_id, COUNT(*) as count
FROM exam_stats 
WHERE exam_id NOT IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army')
GROUP BY exam_id;
