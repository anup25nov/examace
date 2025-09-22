-- Fix Duplicate Test Attempts Issue
-- This script addresses the root cause of duplicate test attempts

-- 1. Add unique constraint to prevent duplicate test attempts
-- First, let's clean up existing duplicates
WITH ranked_attempts AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, exam_id, test_type, test_id 
               ORDER BY created_at DESC
           ) as rn
    FROM test_attempts
)
DELETE FROM test_attempts 
WHERE id IN (
    SELECT id FROM ranked_attempts WHERE rn > 1
);

-- 2. Add unique constraint to prevent future duplicates
-- This will prevent the same user from having multiple attempts for the same test
ALTER TABLE test_attempts 
ADD CONSTRAINT unique_user_test_attempt 
UNIQUE (user_id, exam_id, test_type, test_id);

-- 3. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_test_attempts_unique 
ON test_attempts (user_id, exam_id, test_type, test_id);

-- 4. Update the test_attempts table to use UPSERT instead of INSERT
-- This will be handled in the application code, but we can create a function for it
CREATE OR REPLACE FUNCTION upsert_test_attempt(
    p_user_id UUID,
    p_exam_id VARCHAR(50),
    p_test_type VARCHAR(20),
    p_test_id VARCHAR(100),
    p_score INTEGER,
    p_total_questions INTEGER,
    p_correct_answers INTEGER,
    p_time_taken INTEGER,
    p_answers JSONB,
    p_status VARCHAR(20) DEFAULT 'completed'
) RETURNS UUID AS $$
DECLARE
    attempt_id UUID;
BEGIN
    -- Try to update existing attempt
    UPDATE test_attempts 
    SET 
        score = p_score,
        total_questions = p_total_questions,
        correct_answers = p_correct_answers,
        time_taken = p_time_taken,
        answers = p_answers,
        status = p_status,
        completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE user_id = p_user_id 
      AND exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
    RETURNING id INTO attempt_id;
    
    -- If no row was updated, insert new attempt
    IF attempt_id IS NULL THEN
        INSERT INTO test_attempts (
            user_id, exam_id, test_type, test_id, score, 
            total_questions, correct_answers, time_taken, 
            answers, status, started_at, completed_at
        ) VALUES (
            p_user_id, p_exam_id, p_test_type, p_test_id, p_score,
            p_total_questions, p_correct_answers, p_time_taken,
            p_answers, p_status, NOW(), 
            CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END
        ) RETURNING id INTO attempt_id;
    END IF;
    
    RETURN attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION upsert_test_attempt(UUID, VARCHAR(50), VARCHAR(20), VARCHAR(100), INTEGER, INTEGER, INTEGER, INTEGER, JSONB, VARCHAR(20)) TO authenticated;

-- 6. Verify the fix
SELECT '=== DUPLICATE PREVENTION VERIFICATION ===' as status;

-- Check current test attempts count
SELECT 'Current Test Attempts Count' as check_type, COUNT(*) as count
FROM test_attempts 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- Check for any remaining duplicates
SELECT 'Remaining Duplicates' as check_type, 
       user_id, exam_id, test_type, test_id, COUNT(*) as duplicate_count
FROM test_attempts 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
GROUP BY user_id, exam_id, test_type, test_id
HAVING COUNT(*) > 1;
