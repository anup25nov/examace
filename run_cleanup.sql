-- Run Database Cleanup
-- This script will clean up the database issues

-- 1. Show current table usage
SELECT '=== CURRENT TABLE USAGE ===' as section;
SELECT * FROM get_table_usage();

-- 2. Show exam records before cleanup
SELECT '=== EXAM RECORDS BEFORE CLEANUP ===' as section;
SELECT 
    exam_id,
    COUNT(*) as record_count,
    COUNT(DISTINCT user_id) as unique_users
FROM exam_stats 
GROUP BY exam_id 
ORDER BY record_count DESC;

-- 3. Show test completions
SELECT '=== TEST COMPLETIONS ===' as section;
SELECT 
    exam_id,
    COUNT(*) as completion_count,
    COUNT(DISTINCT user_id) as unique_users
FROM test_completions 
GROUP BY exam_id 
ORDER BY completion_count DESC;

-- 4. Show membership inconsistencies before fix
SELECT '=== MEMBERSHIP INCONSISTENCIES BEFORE FIX ===' as section;
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

-- 5. Run cleanup (commented out for safety - uncomment to run)
-- SELECT '=== RUNNING CLEANUP ===' as section;
-- SELECT cleanup_unused_exam_records() as deleted_exam_records;
-- SELECT fix_membership_inconsistencies() as updated_memberships;
