-- Run Database Analysis and Cleanup
-- Execute this script to analyze and fix database issues

-- 1. Analyze database usage
SELECT '=== DATABASE USAGE ANALYSIS ===' as section;
SELECT * FROM analyze_database_usage();

-- 2. Find unused exam records
SELECT '=== UNUSED EXAM RECORDS ===' as section;
SELECT * FROM find_unused_exam_records() LIMIT 10;

-- 3. Check membership consistency
SELECT '=== MEMBERSHIP CONSISTENCY CHECK ===' as section;
SELECT * FROM check_membership_consistency() LIMIT 10;

-- 4. Identify droppable tables
SELECT '=== DROPPABLE TABLES ===' as section;
SELECT * FROM identify_droppable_tables();

-- 5. Show membership summary
SELECT '=== MEMBERSHIP SUMMARY ===' as section;
SELECT * FROM membership_summary LIMIT 10;

-- 6. Count records by exam
SELECT '=== EXAM RECORD COUNTS ===' as section;
SELECT 
    exam_id,
    COUNT(*) as record_count,
    COUNT(DISTINCT user_id) as unique_users
FROM exam_stats 
GROUP BY exam_id 
ORDER BY record_count DESC;

-- 7. Count test completions by exam
SELECT '=== TEST COMPLETION COUNTS ===' as section;
SELECT 
    exam_id,
    COUNT(*) as completion_count,
    COUNT(DISTINCT user_id) as unique_users
FROM test_completions 
GROUP BY exam_id 
ORDER BY completion_count DESC;
