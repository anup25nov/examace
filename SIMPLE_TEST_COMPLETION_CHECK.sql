-- Simple test to check test completion
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what's actually in the database
SELECT 
  'Current test completions' as info,
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
  AND test_id = 'mock-test-3';

-- 2. Test the current function with the exact parameters
-- Replace 'YOUR_USER_ID' with the user_id from step 1
-- SELECT 
--   'Testing is_test_completed' as info,
--   is_test_completed('YOUR_USER_ID'::uuid, 'ssc-cgl', 'mock', 'mock-test-3', NULL) as result;

-- 3. Test with a manual query to see what should match
-- SELECT 
--   'Manual query test' as info,
--   EXISTS(
--     SELECT 1 FROM test_completions 
--     WHERE user_id = 'YOUR_USER_ID'::uuid
--       AND exam_id = 'ssc-cgl'
--       AND test_type = 'mock'
--       AND test_id = 'mock-test-3'
--       AND topic_id IS NULL
--   ) as should_match;
