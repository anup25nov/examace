-- Fix test_attempts table to handle missing test_type

-- First, let's make test_type nullable temporarily to handle existing data
ALTER TABLE test_attempts ALTER COLUMN test_type DROP NOT NULL;

-- Add a default value for test_type
ALTER TABLE test_attempts ALTER COLUMN test_type SET DEFAULT 'practice';

-- Create a function to insert test attempt with automatic test_type detection
CREATE OR REPLACE FUNCTION insert_test_attempt(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_test_id VARCHAR(100),
  p_score INTEGER,
  p_total_questions INTEGER,
  p_correct_answers INTEGER,
  p_time_taken INTEGER DEFAULT NULL,
  p_answers JSONB DEFAULT NULL,
  p_test_type VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  attempt_id UUID
) AS $$
DECLARE
  detected_test_type VARCHAR(20);
  new_attempt_id UUID;
BEGIN
  -- Auto-detect test_type if not provided
  IF p_test_type IS NULL THEN
    -- Try to detect test type from test_id
    IF p_test_id LIKE '%mock%' THEN
      detected_test_type := 'mock';
    ELSIF p_test_id LIKE '%pyq%' OR p_test_id LIKE '%previous%' THEN
      detected_test_type := 'pyq';
    ELSIF p_test_id LIKE '%practice%' THEN
      detected_test_type := 'practice';
    ELSE
      detected_test_type := 'practice'; -- Default fallback
    END IF;
  ELSE
    detected_test_type := p_test_type;
  END IF;
  
  -- Insert the test attempt
  INSERT INTO test_attempts (
    user_id, exam_id, test_type, test_id, score, total_questions,
    correct_answers, time_taken, answers, completed_at
  )
  VALUES (
    p_user_id, p_exam_id, detected_test_type, p_test_id, p_score, p_total_questions,
    p_correct_answers, p_time_taken, p_answers, NOW()
  )
  RETURNING id INTO new_attempt_id;
  
  -- Return success
  RETURN QUERY
  SELECT 
    true as success,
    'Test attempt recorded successfully' as message,
    new_attempt_id;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error recording test attempt: ' || SQLERRM as message,
      NULL::UUID as attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to update test attempt with test_type
CREATE OR REPLACE FUNCTION update_test_attempt_type(
  p_attempt_id UUID,
  p_test_type VARCHAR(20)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE test_attempts
  SET test_type = p_test_type
  WHERE id = p_attempt_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to get test attempts without test_type filter
CREATE OR REPLACE FUNCTION get_user_test_attempts(
  p_user_id UUID,
  p_exam_id VARCHAR(50) DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  exam_id VARCHAR(50),
  test_type VARCHAR(20),
  test_id VARCHAR(100),
  score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  time_taken INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  answers JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.exam_id,
    ta.test_type,
    ta.test_id,
    ta.score,
    ta.total_questions,
    ta.correct_answers,
    ta.time_taken,
    ta.started_at,
    ta.completed_at,
    ta.answers
  FROM test_attempts ta
  WHERE ta.user_id = p_user_id
    AND (p_exam_id IS NULL OR ta.exam_id = p_exam_id)
  ORDER BY ta.completed_at DESC NULLS LAST, ta.started_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION insert_test_attempt(UUID, VARCHAR, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, JSONB, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION update_test_attempt_type(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_test_attempts(UUID, VARCHAR, INTEGER) TO authenticated;
