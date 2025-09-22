-- Fix Data Issues Based on Current State
-- Run this in Supabase SQL Editor

-- 1. Fix exam_stats column name issue
-- First, let's check the actual structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exam_stats' 
ORDER BY ordinal_position;

-- 2. Create user membership for the user
INSERT INTO user_memberships (
    id, user_id, plan_id, status, start_date, end_date, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    '9948aaa7-1746-465a-968a-3f8c5b3d5870',
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
);

-- 3. Clean up duplicate test attempts (keep only the latest one for each test)
WITH ranked_attempts AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, exam_id, test_type, test_id 
               ORDER BY created_at DESC
           ) as rn
    FROM test_attempts
    WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
)
DELETE FROM test_attempts 
WHERE id IN (
    SELECT id FROM ranked_attempts WHERE rn > 1
);

-- 4. Create test_completions records from existing test_attempts
INSERT INTO test_completions (
    id, user_id, exam_id, test_type, test_id, topic_id, score, 
    total_questions, correct_answers, time_taken, answers, completed_at
)
SELECT 
    gen_random_uuid(),
    user_id,
    exam_id,
    test_type,
    test_id,
    NULL as topic_id,
    score,
    total_questions,
    correct_answers,
    time_taken,
    answers,
    completed_at
FROM test_attempts 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
  AND status = 'completed'
  AND completed_at IS NOT NULL
ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id) DO NOTHING;

-- 5. Fix exam_stats - update the column name if needed
-- First check if exam_name column exists
DO $$
BEGIN
    -- If exam_name column doesn't exist, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_stats' AND column_name = 'exam_name'
    ) THEN
        ALTER TABLE exam_stats ADD COLUMN exam_name VARCHAR(50);
        -- Update existing records
        UPDATE exam_stats SET exam_name = exam_id WHERE exam_name IS NULL;
    END IF;
END $$;

-- 6. First, let's check the actual exam_stats table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exam_stats' 
ORDER BY ordinal_position;

-- 7. Update exam_stats with proper data (using correct column names)
UPDATE exam_stats 
SET 
    total_tests = (
        SELECT COUNT(*) 
        FROM test_attempts 
        WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' 
          AND exam_id = exam_stats.exam_id
          AND status = 'completed'
    ),
    avg_score = (
        SELECT AVG(score) 
        FROM test_attempts 
        WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' 
          AND exam_id = exam_stats.exam_id
          AND status = 'completed'
    ),
    best_score = (
        SELECT MAX(score) 
        FROM test_attempts 
        WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' 
          AND exam_id = exam_stats.exam_id
          AND status = 'completed'
    ),
    last_test_date = (
        SELECT MAX(completed_at) 
        FROM test_attempts 
        WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' 
          AND exam_id = exam_stats.exam_id
          AND status = 'completed'
    )
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 7. Verify the fixes
SELECT '=== VERIFICATION RESULTS ===' as status;

-- Check user memberships
SELECT 'User Memberships' as check_type,
       id, user_id, plan_id, status, start_date, end_date
FROM user_memberships 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- Check test completions
SELECT 'Test Completions' as check_type,
       id, user_id, exam_id, test_type, test_id, score, completed_at
FROM test_completions 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY completed_at DESC;

-- Check cleaned test attempts
SELECT 'Cleaned Test Attempts' as check_type,
       id, user_id, exam_id, test_type, test_id, score, status, created_at
FROM test_attempts 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;

-- Check exam stats
SELECT 'Exam Stats' as check_type,
       id, user_id, exam_id, exam_name, total_tests, avg_score, best_score, last_test_date
FROM exam_stats 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 8. Test the specific queries that were failing
SELECT '=== TESTING FAILED QUERIES ===' as test_name;

-- Test user_memberships query
SELECT 'User Memberships Query Test' as test_name;
SELECT * FROM user_memberships 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' 
  AND status = 'active' 
  AND end_date > NOW()
ORDER BY created_at DESC 
LIMIT 1;

-- Test test_attempts query
SELECT 'Test Attempts Query Test' as test_name;
SELECT * FROM test_attempts 
WHERE id = 'ebf660cd-63fb-47bb-8f55-5b2792ca7303';
