-- Comprehensive fix for test completion tracking issues
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what's currently in the database
SELECT 
  'Current test completions for debugging' as info,
  user_id,
  exam_id,
  test_type,
  test_id,
  topic_id,
  score,
  completed_at
FROM test_completions 
WHERE exam_id = 'ssc-cgl' 
  AND test_type = 'mock'
ORDER BY completed_at DESC;

-- 2. Drop and recreate the is_test_completed function with better logic
DROP FUNCTION IF EXISTS is_test_completed(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR);

CREATE OR REPLACE FUNCTION is_test_completed(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(20),
  test_name VARCHAR(100),
  topic_name VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  completion_exists BOOLEAN := FALSE;
BEGIN
  -- Debug logging (remove in production)
  RAISE NOTICE 'Checking completion for user: %, exam: %, type: %, test: %, topic: %', 
    user_uuid, exam_name, test_type_name, test_name, topic_name;
  
  -- More robust matching logic
  SELECT EXISTS(
    SELECT 1 FROM test_completions 
    WHERE user_id = user_uuid 
      AND exam_id = exam_name 
      AND test_type = test_type_name 
      AND test_id = test_name 
      AND (
        -- Case 1: Both topic_id and topic_name are NULL
        (topic_id IS NULL AND topic_name IS NULL)
        OR
        -- Case 2: Both topic_id and topic_name are empty strings
        (topic_id = '' AND topic_name = '')
        OR
        -- Case 3: topic_id is NULL and topic_name is empty string
        (topic_id IS NULL AND topic_name = '')
        OR
        -- Case 4: topic_id is empty string and topic_name is NULL
        (topic_id = '' AND topic_name IS NULL)
        OR
        -- Case 5: Both have the same non-empty value
        (topic_id IS NOT NULL AND topic_id != '' AND topic_id = topic_name)
      )
  ) INTO completion_exists;
  
  RAISE NOTICE 'Completion exists: %', completion_exists;
  RETURN completion_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION is_test_completed(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated;

-- 4. Test the function with different scenarios
-- Replace 'YOUR_USER_ID' with your actual user ID from step 1
-- SELECT 
--   'Test 1: NULL topic' as test_case,
--   is_test_completed('YOUR_USER_ID'::uuid, 'ssc-cgl', 'mock', 'mock-test-3', NULL) as result
-- UNION ALL
-- SELECT 
--   'Test 2: Empty string topic' as test_case,
--   is_test_completed('YOUR_USER_ID'::uuid, 'ssc-cgl', 'mock', 'mock-test-3', '') as result
-- UNION ALL
-- SELECT 
--   'Test 3: No topic parameter' as test_case,
--   is_test_completed('YOUR_USER_ID'::uuid, 'ssc-cgl', 'mock', 'mock-test-3') as result;

-- 5. Alternative: Create a simpler function that just checks the main fields
CREATE OR REPLACE FUNCTION is_test_completed_simple(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(20),
  test_name VARCHAR(100)
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM test_completions 
    WHERE user_id = user_uuid 
      AND exam_id = exam_name 
      AND test_type = test_type_name 
      AND test_id = test_name
      -- Ignore topic_id completely for now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION is_test_completed_simple(UUID, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
