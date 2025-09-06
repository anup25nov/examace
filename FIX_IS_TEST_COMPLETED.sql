-- Fix the is_test_completed function to handle NULL values more robustly
-- Run this in your Supabase SQL Editor

-- Drop and recreate the function with better NULL handling
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
  -- More robust NULL handling
  SELECT EXISTS(
    SELECT 1 FROM test_completions 
    WHERE user_id = user_uuid 
      AND exam_id = exam_name 
      AND test_type = test_type_name 
      AND test_id = test_name 
      AND (
        -- Handle NULL topic_id cases more robustly
        (topic_id IS NULL AND (topic_name IS NULL OR topic_name = ''))
        OR 
        (topic_id IS NOT NULL AND topic_id = topic_name)
        OR
        -- Handle empty string as NULL
        (topic_id = '' AND (topic_name IS NULL OR topic_name = ''))
      )
  ) INTO completion_exists;
  
  RETURN completion_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_test_completed(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated;

-- Test the function with different scenarios
-- Replace 'YOUR_USER_ID' with your actual user ID
-- SELECT 
--   'NULL topic_id, NULL topic_name' as scenario,
--   is_test_completed('YOUR_USER_ID'::uuid, 'ssc-cgl', 'mock', 'mock-test-3', NULL) as result
-- UNION ALL
-- SELECT 
--   'NULL topic_id, empty topic_name' as scenario,
--   is_test_completed('YOUR_USER_ID'::uuid, 'ssc-cgl', 'mock', 'mock-test-3', '') as result
-- UNION ALL
-- SELECT 
--   'empty topic_id, NULL topic_name' as scenario,
--   is_test_completed('YOUR_USER_ID'::uuid, 'ssc-cgl', 'mock', 'mock-test-3', NULL) as result;
