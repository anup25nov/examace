-- Comprehensive debug script for is_test_completed issue
-- Run this in your Supabase SQL Editor

-- 1. Check what test completions exist for ssc-cgl mock tests
SELECT 
  id,
  user_id,
  exam_id,
  test_type,
  test_id,
  topic_id,
  score,
  completed_at,
  created_at
FROM test_completions 
WHERE exam_id = 'ssc-cgl' 
  AND test_type = 'mock'
ORDER BY completed_at DESC;

-- 2. Check specifically for mock-test-3
SELECT 
  id,
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

-- 3. Test the is_test_completed function with actual data
-- Replace 'YOUR_USER_ID' with the user_id from the query above
-- SELECT is_test_completed(
--   'YOUR_USER_ID'::uuid,
--   'ssc-cgl',
--   'mock',
--   'mock-test-3',
--   NULL
-- ) as is_completed;

-- 4. Test with different parameter combinations
-- SELECT 
--   'with NULL topic' as test_case,
--   is_test_completed('YOUR_USER_ID'::uuid, 'ssc-cgl', 'mock', 'mock-test-3', NULL) as result
-- UNION ALL
-- SELECT 
--   'with empty string topic' as test_case,
--   is_test_completed('YOUR_USER_ID'::uuid, 'ssc-cgl', 'mock', 'mock-test-3', '') as result
-- UNION ALL
-- SELECT 
--   'with test_id as topic' as test_case,
--   is_test_completed('YOUR_USER_ID'::uuid, 'ssc-cgl', 'mock', 'mock-test-3', 'mock-test-3') as result;

-- 5. Check the exact constraint and table structure
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'test_completions'::regclass;

-- 6. Check if there are any data type mismatches
SELECT 
  column_name,
  data_type,
  is_nullable,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'test_completions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Test the function with a simple query to see what it's actually looking for
-- This will show us exactly what the function is searching for
-- SELECT 
--   user_id = 'YOUR_USER_ID'::uuid as user_match,
--   exam_id = 'ssc-cgl' as exam_match,
--   test_type = 'mock' as type_match,
--   test_id = 'mock-test-3' as test_match,
--   (topic_id IS NULL) as topic_null_match,
--   (topic_id = 'mock-test-3') as topic_id_match
-- FROM test_completions 
-- WHERE exam_id = 'ssc-cgl' 
--   AND test_type = 'mock'
--   AND test_id = 'mock-test-3';
