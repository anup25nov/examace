-- Fix Test Attempts Issues
-- Run this in Supabase SQL Editor

-- 1. Fix the test_attempts table to handle the PATCH request properly
-- Add a function to upsert test attempts instead of separate GET/PATCH

CREATE OR REPLACE FUNCTION upsert_test_attempt(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100),
  p_score INTEGER DEFAULT 0,
  p_total_questions INTEGER DEFAULT 100,
  p_correct_answers INTEGER DEFAULT 0,
  p_time_taken INTEGER DEFAULT NULL,
  p_answers JSONB DEFAULT NULL,
  p_status VARCHAR(20) DEFAULT 'in_progress'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  attempt_id UUID,
  is_new BOOLEAN
) AS $$
DECLARE
  existing_attempt_id UUID;
  new_attempt_id UUID;
  is_new_attempt BOOLEAN := false;
BEGIN
  -- First, try to find existing incomplete attempt
  SELECT id INTO existing_attempt_id
  FROM test_attempts
  WHERE user_id = p_user_id
    AND exam_id = p_exam_id
    AND test_type = p_test_type
    AND test_id = p_test_id
    AND score = 0
    AND completed_at IS NULL
  LIMIT 1;

  IF existing_attempt_id IS NOT NULL THEN
    -- Update existing attempt
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
    WHERE id = existing_attempt_id;
    
    new_attempt_id := existing_attempt_id;
    is_new_attempt := false;
  ELSE
    -- Create new attempt
    INSERT INTO test_attempts (
      user_id, exam_id, test_type, test_id, score, total_questions,
      correct_answers, time_taken, answers, status, completed_at, created_at, updated_at
    )
    VALUES (
      p_user_id, p_exam_id, p_test_type, p_test_id, p_score, p_total_questions,
      p_correct_answers, p_time_taken, p_answers, p_status,
      CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
      NOW(), NOW()
    )
    RETURNING id INTO new_attempt_id;
    
    is_new_attempt := true;
  END IF;

  -- Return success
  RETURN QUERY
  SELECT 
    true as success,
    CASE WHEN is_new_attempt THEN 'New test attempt created' ELSE 'Existing test attempt updated' END as message,
    new_attempt_id,
    is_new_attempt;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error with test attempt: ' || SQLERRM as message,
      NULL::UUID as attempt_id,
      false as is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION upsert_test_attempt(UUID, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, JSONB, VARCHAR) TO authenticated;

-- 3. Create a function to get test attempt by ID (for the PATCH request)
CREATE OR REPLACE FUNCTION get_test_attempt_by_id(attempt_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  exam_id VARCHAR(50),
  test_type VARCHAR(20),
  test_id VARCHAR(100),
  score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  time_taken INTEGER,
  answers JSONB,
  status VARCHAR(20),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.user_id,
    ta.exam_id,
    ta.test_type,
    ta.test_id,
    ta.score,
    ta.total_questions,
    ta.correct_answers,
    ta.time_taken,
    ta.answers,
    ta.status,
    ta.started_at,
    ta.completed_at,
    ta.created_at,
    ta.updated_at
  FROM test_attempts ta
  WHERE ta.id = attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_test_attempt_by_id(UUID) TO authenticated;
