-- TEST SCRIPT TO VERIFY DATABASE FIX
-- Run this after applying the COMPREHENSIVE_DATABASE_FIX.sql

-- 1. Test the submitindividualtestscore function
-- Replace 'your-user-id-here' with an actual user ID from your database
SELECT public.submitindividualtestscore(
  '660edf9c-fcad-41a3-8f27-4a496413899f'::UUID,  -- Replace with actual user ID
  'ssc-cgl',
  'mock',
  'mock-test-1',
  85
) as test_score_result;

-- 2. Test the get_user_test_score function
SELECT public.get_user_test_score(
  '660edf9c-fcad-41a3-8f27-4a496413899f'::UUID,  -- Replace with actual user ID
  'ssc-cgl',
  'mock',
  'mock-test-1'
) as get_score_result;

-- 3. Test the upsert_test_completion function
SELECT public.upsert_test_completion(
  '660edf9c-fcad-41a3-8f27-4a496413899f'::UUID,  -- Replace with actual user ID
  'ssc-cgl',
  'mock',
  'mock-test-1',
  NULL,  -- topic_id
  85,    -- score
  100,   -- total_questions
  85,    -- correct_answers
  3600,  -- time_taken in seconds
  '{"test": "data"}'::JSONB  -- answers
) as upsert_result;

-- 4. Check if data was inserted correctly
SELECT * FROM individual_test_scores 
WHERE user_id = '660edf9c-fcad-41a3-8f27-4a496413899f'::UUID
  AND exam_id = 'ssc-cgl'
  AND test_type = 'mock'
  AND test_id = 'mock-test-1';

-- 5. Check test_completions table
SELECT * FROM test_completions 
WHERE user_id = '660edf9c-fcad-41a3-8f27-4a496413899f'::UUID
  AND exam_id = 'ssc-cgl'
  AND test_type = 'mock'
  AND test_id = 'mock-test-1';
