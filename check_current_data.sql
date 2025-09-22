-- Quick Data Check Script
-- Run this first to see what data currently exists

-- 1. Check all table counts
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles
UNION ALL
SELECT 'user_memberships' as table_name, COUNT(*) as record_count FROM user_memberships
UNION ALL
SELECT 'test_attempts' as table_name, COUNT(*) as record_count FROM test_attempts
UNION ALL
SELECT 'test_completions' as table_name, COUNT(*) as record_count FROM test_completions
UNION ALL
SELECT 'exam_stats' as table_name, COUNT(*) as record_count FROM exam_stats
UNION ALL
SELECT 'membership_plans' as table_name, COUNT(*) as record_count FROM membership_plans;

-- 2. Check specific user data
SELECT '=== USER PROFILE ===' as section;
SELECT id, email, name, phone, membership_plan, membership_expiry, created_at
FROM user_profiles 
WHERE id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 3. Check user memberships
SELECT '=== USER MEMBERSHIPS ===' as section;
SELECT id, user_id, plan_id, status, start_date, end_date, created_at
FROM user_memberships 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 4. Check test attempts
SELECT '=== TEST ATTEMPTS ===' as section;
SELECT id, user_id, exam_id, test_type, test_id, score, status, created_at
FROM test_attempts 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;

-- 5. Check test completions
SELECT '=== TEST COMPLETIONS ===' as section;
SELECT id, user_id, exam_id, test_type, test_id, score, completed_at
FROM test_completions 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY completed_at DESC;

-- 6. Check exam stats
SELECT '=== EXAM STATS ===' as section;
SELECT id, user_id, exam_name, total_tests, avg_score, best_score, created_at
FROM exam_stats 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 7. Check membership plans
SELECT '=== MEMBERSHIP PLANS ===' as section;
SELECT id, name, price, duration_months, is_active
FROM membership_plans;
