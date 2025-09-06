-- Debug script to check test completion storage and retrieval
-- Run this in your Supabase SQL Editor to debug the issue

-- 1. Check what test completions exist
SELECT 
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
ORDER BY completed_at DESC
LIMIT 10;

-- 2. Test the is_test_completed function directly
-- Replace 'YOUR_USER_ID' with your actual user ID from the query above
-- SELECT is_test_completed(
--   'YOUR_USER_ID'::uuid,
--   'ssc-cgl',
--   'mock',
--   'mock-test-3',
--   NULL
-- );

-- 3. Check if there are any constraint issues
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'test_completions'::regclass;

-- 4. Check the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'test_completions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
