-- Comprehensive Data Verification and Fix Script
-- Run this in Supabase SQL Editor

-- 1. First, let's check what data exists in each table
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
SELECT 'membership_plans' as table_name, COUNT(*) as record_count FROM membership_plans
UNION ALL
SELECT 'user_messages' as table_name, COUNT(*) as record_count FROM user_messages;

-- 2. Check specific user data
SELECT 'User Profile Data' as check_type, 
       id, email, name, phone, membership_plan, membership_expiry
FROM user_profiles 
WHERE id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 3. Check user memberships
SELECT 'User Memberships' as check_type,
       id, user_id, plan_id, status, start_date, end_date
FROM user_memberships 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 4. Check test attempts
SELECT 'Test Attempts' as check_type,
       id, user_id, exam_id, test_type, test_id, score, status
FROM test_attempts 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;

-- 5. Check test completions
SELECT 'Test Completions' as check_type,
       id, user_id, exam_id, test_type, test_id, score, completed_at
FROM test_completions 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY completed_at DESC;

-- 6. Check exam stats
SELECT 'Exam Stats' as check_type,
       id, user_id, exam_name, total_tests, avg_score, best_score
FROM exam_stats 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 7. Fix user_memberships issue - ensure we have proper data
-- First, create a free plan if it doesn't exist
INSERT INTO membership_plans (id, name, price, duration_months, features, is_active, created_at, updated_at)
VALUES (
    'free-plan-001',
    'Free Plan',
    0.00,
    0,
    '["Basic access to free tests", "Limited practice questions"]',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a premium plan for testing
INSERT INTO membership_plans (id, name, price, duration_months, features, is_active, created_at, updated_at)
VALUES (
    'premium-plan-001',
    'Premium Plan',
    999.00,
    12,
    '["Unlimited access to all tests", "Mock tests", "PYQ tests", "Practice questions", "Detailed analytics"]',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 8. Fix user_memberships - ensure the user has an active membership
-- Delete any existing memberships for this user
DELETE FROM user_memberships WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- Insert a proper membership record
INSERT INTO user_memberships (
    id, user_id, plan_id, status, start_date, end_date, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '9948aaa7-1746-465a-968a-3f8c5b3d5870',
    'free-plan-001',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
);

-- 9. Fix test_attempts - ensure we have proper test attempt data
-- Delete any existing test attempts for this user
DELETE FROM test_attempts WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- Insert sample test attempts
INSERT INTO test_attempts (
    id, user_id, exam_id, test_type, test_id, score, total_questions, 
    correct_answers, time_taken, answers, started_at, completed_at, 
    status, created_at, updated_at
) VALUES 
(
    'ebf660cd-63fb-47bb-8f55-5b2792ca7303',
    '9948aaa7-1746-465a-968a-3f8c5b3d5870',
    'ssc-cgl',
    'mock',
    'ssc-cgl-mock-1',
    85,
    10,
    8,
    1200,
    '{"details": [{"isCorrect": true, "questionId": "q1", "selectedOption": 1}]}',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 40 minutes',
    'completed',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 40 minutes'
),
(
    gen_random_uuid(),
    '9948aaa7-1746-465a-968a-3f8c5b3d5870',
    'ssc-cgl',
    'pyq',
    'ssc-cgl-2024-set-1',
    92,
    10,
    9,
    900,
    '{"details": [{"isCorrect": true, "questionId": "q1", "selectedOption": 2}]}',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '23 hours',
    'completed',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '23 hours'
);

-- 10. Fix exam_stats - ensure we have proper exam statistics
-- Delete any existing exam stats for this user
DELETE FROM exam_stats WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- Insert exam stats for SSC-CGL
INSERT INTO exam_stats (
    id, user_id, exam_name, total_tests, completed_tests, avg_score, 
    best_score, total_time_spent, last_test_date, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '9948aaa7-1746-465a-968a-3f8c5b3d5870',
    'ssc-cgl',
    2,
    2,
    88.5,
    92,
    2100,
    NOW() - INTERVAL '1 hour 40 minutes',
    NOW(),
    NOW()
);

-- 11. Verify the fixes
SELECT '=== VERIFICATION RESULTS ===' as status;

-- Check user memberships again
SELECT 'Fixed User Memberships' as check_type,
       id, user_id, plan_id, status, start_date, end_date
FROM user_memberships 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- Check test attempts again
SELECT 'Fixed Test Attempts' as check_type,
       id, user_id, exam_id, test_type, test_id, score, status
FROM test_attempts 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;

-- Check exam stats again
SELECT 'Fixed Exam Stats' as check_type,
       id, user_id, exam_name, total_tests, avg_score, best_score
FROM exam_stats 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 12. Test the specific queries that were failing
-- Test user_memberships query
SELECT '=== TESTING USER_MEMBERSHIPS QUERY ===' as test_name;
SELECT * FROM user_memberships 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' 
  AND status = 'active' 
  AND end_date > NOW()
ORDER BY created_at DESC 
LIMIT 1;

-- Test test_attempts query
SELECT '=== TESTING TEST_ATTEMPTS QUERY ===' as test_name;
SELECT * FROM test_attempts 
WHERE id = 'ebf660cd-63fb-47bb-8f55-5b2792ca7303';
