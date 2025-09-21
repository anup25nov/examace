-- Fix bulk APIs to use correct table references
-- individual_test_scores doesn't have topic_id column, only test_id

-- Drop existing functions
DROP FUNCTION IF EXISTS get_bulk_test_completions(UUID, VARCHAR(50), VARCHAR(50));
DROP FUNCTION IF EXISTS get_all_test_completions_for_exam(UUID, VARCHAR(50));
DROP FUNCTION IF EXISTS get_test_completions_by_ids(UUID, VARCHAR(50), VARCHAR(50), TEXT[]);

-- Function to get all test completions for an exam and test type
CREATE OR REPLACE FUNCTION get_bulk_test_completions(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(50)
)
RETURNS TABLE (
  test_id VARCHAR(255),
  is_completed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE,
  score DECIMAL(5,2),
  rank INTEGER,
  total_participants INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.test_id,
    (tc.completed_at IS NOT NULL) as is_completed,
    tc.completed_at,
    COALESCE(tc.score, 0) as score,
    COALESCE(its.rank, 0) as rank,
    COALESCE(its.total_participants, 0) as total_participants
  FROM test_completions tc
  LEFT JOIN individual_test_scores its ON (
    its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = tc.test_id
  )
  WHERE tc.user_id = user_uuid 
    AND tc.exam_id = exam_name 
    AND tc.test_type = test_type_name
  ORDER BY tc.test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get all test completions for an exam (all test types)
CREATE OR REPLACE FUNCTION get_all_test_completions_for_exam(
  user_uuid UUID,
  exam_name VARCHAR(50)
)
RETURNS TABLE (
  test_type VARCHAR(50),
  test_id VARCHAR(255),
  topic_id VARCHAR(255),
  is_completed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE,
  score DECIMAL(5,2),
  rank INTEGER,
  total_participants INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.test_type,
    tc.test_id,
    tc.topic_id,
    (tc.completed_at IS NOT NULL) as is_completed,
    tc.completed_at,
    COALESCE(tc.score, 0) as score,
    COALESCE(its.rank, 0) as rank,
    COALESCE(its.total_participants, 0) as total_participants
  FROM test_completions tc
  LEFT JOIN individual_test_scores its ON (
    its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = tc.test_type
    AND its.test_id = tc.test_id
  )
  WHERE tc.user_id = user_uuid 
    AND tc.exam_id = exam_name
  ORDER BY tc.test_type, tc.test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get test completions for specific test IDs
CREATE OR REPLACE FUNCTION get_test_completions_by_ids(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(50),
  test_ids TEXT[]
)
RETURNS TABLE (
  test_id VARCHAR(255),
  is_completed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE,
  score DECIMAL(5,2),
  rank INTEGER,
  total_participants INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.test_id,
    (tc.completed_at IS NOT NULL) as is_completed,
    tc.completed_at,
    COALESCE(tc.score, 0) as score,
    COALESCE(its.rank, 0) as rank,
    COALESCE(its.total_participants, 0) as total_participants
  FROM test_completions tc
  LEFT JOIN individual_test_scores its ON (
    its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = tc.test_id
  )
  WHERE tc.user_id = user_uuid 
    AND tc.exam_id = exam_name 
    AND tc.test_type = test_type_name
    AND tc.test_id = ANY(test_ids)
  ORDER BY tc.test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_bulk_test_completions(UUID, VARCHAR(50), VARCHAR(50)) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_all_test_completions_for_exam(UUID, VARCHAR(50)) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_test_completions_by_ids(UUID, VARCHAR(50), VARCHAR(50), TEXT[]) TO authenticated, anon;
