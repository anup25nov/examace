-- COMPREHENSIVE DATABASE FIX
-- This script fixes both the duplicate key violation and the individual test scores issue

-- 1. Fix the broken submitindividualtestscore function
CREATE OR REPLACE FUNCTION public.submitindividualtestscore(
  p_user_id UUID,
  p_exam_id TEXT,
  p_test_type TEXT,
  p_test_id TEXT,
  p_score INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rank INTEGER := 1;
  v_total_participants INTEGER := 1;
BEGIN
  -- Insert or update individual test score
  INSERT INTO individual_test_scores (user_id, exam_id, test_type, test_id, score, rank, total_participants)
  VALUES (p_user_id, p_exam_id, p_test_type, p_test_id, p_score, v_rank, v_total_participants)
  ON CONFLICT (user_id, exam_id, test_type, test_id) 
  DO UPDATE SET
    score = EXCLUDED.score,
    rank = EXCLUDED.rank,
    total_participants = EXCLUDED.total_participants,
    completed_at = now();
  
  RETURN jsonb_build_object(
    'score', p_score,
    'rank', v_rank,
    'total_participants', v_total_participants
  );
END;
$$;

-- 2. Fix the test_completions table to handle upserts properly
-- First, let's create a function that handles the upsert logic correctly
CREATE OR REPLACE FUNCTION public.upsert_test_completion(
  p_user_id UUID,
  p_exam_id TEXT,
  p_test_type TEXT,
  p_test_id TEXT,
  p_topic_id TEXT DEFAULT NULL,
  p_score INTEGER DEFAULT 0,
  p_total_questions INTEGER DEFAULT 0,
  p_correct_answers INTEGER DEFAULT 0,
  p_time_taken INTEGER DEFAULT 0,
  p_answers JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Insert or update test completion
  INSERT INTO test_completions (
    user_id, exam_id, test_type, test_id, topic_id, 
    score, total_questions, correct_answers, time_taken, answers
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_topic_id,
    p_score, p_total_questions, p_correct_answers, p_time_taken, p_answers
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id) 
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    time_taken = EXCLUDED.time_taken,
    answers = EXCLUDED.answers,
    completed_at = now();
  
  -- Return the result
  SELECT to_jsonb(tc.*) INTO v_result
  FROM test_completions tc
  WHERE tc.user_id = p_user_id 
    AND tc.exam_id = p_exam_id 
    AND tc.test_type = p_test_type 
    AND tc.test_id = p_test_id 
    AND (tc.topic_id = p_topic_id OR (tc.topic_id IS NULL AND p_topic_id IS NULL));
  
  RETURN v_result;
END;
$$;

-- 3. Create a function to get user test score with proper error handling
CREATE OR REPLACE FUNCTION public.get_user_test_score(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(20),
  test_name VARCHAR(100)
)
RETURNS TABLE(score INTEGER, rank INTEGER, total_participants INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    its.score,
    its.rank,
    its.total_participants
  FROM individual_test_scores its
  WHERE its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = test_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.submitindividualtestscore(UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_test_completion(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_test_score(UUID, VARCHAR, VARCHAR, VARCHAR) TO authenticated;

-- 5. Clean up any existing duplicate records (optional - run if you want to clean up)
-- DELETE FROM test_completions 
-- WHERE id NOT IN (
--   SELECT MIN(id) 
--   FROM test_completions 
--   GROUP BY user_id, exam_id, test_type, test_id, topic_id
-- );

-- 6. Verify the functions work
-- Test the functions (uncomment to test):
-- SELECT public.submitindividualtestscore(
--   'your-user-id-here'::UUID,
--   'ssc-cgl',
--   'mock',
--   'mock-test-1',
--   85
-- );

-- SELECT public.get_user_test_score(
--   'your-user-id-here'::UUID,
--   'ssc-cgl',
--   'mock',
--   'mock-test-1'
-- );
