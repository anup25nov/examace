-- Fix upsert_test_completion_simple to set completed_at on both insert and update
-- This ensures that test completions are properly marked as completed

-- Drop and recreate the function with the fix
DROP FUNCTION IF EXISTS upsert_test_completion_simple(UUID, VARCHAR(50), VARCHAR(20), VARCHAR(100), INTEGER, INTEGER, INTEGER, VARCHAR(100), INTEGER, JSONB);

CREATE OR REPLACE FUNCTION upsert_test_completion_simple(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100),
  p_score INTEGER,
  p_total_questions INTEGER,
  p_correct_answers INTEGER,
  p_topic_id VARCHAR(100) DEFAULT NULL,
  p_time_taken INTEGER DEFAULT NULL,
  p_answers JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Insert or update test completion
  INSERT INTO test_completions (
    user_id, exam_id, test_type, test_id, topic_id, 
    score, total_questions, correct_answers, time_taken, answers, completed_at
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_topic_id,
    p_score, p_total_questions, p_correct_answers, p_time_taken, p_answers, NOW()
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    time_taken = EXCLUDED.time_taken,
    answers = EXCLUDED.answers,
    completed_at = NOW();
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION upsert_test_completion_simple(UUID, VARCHAR(50), VARCHAR(20), VARCHAR(100), INTEGER, INTEGER, INTEGER, VARCHAR(100), INTEGER, JSONB) TO authenticated, anon;
