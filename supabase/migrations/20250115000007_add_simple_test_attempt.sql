-- Add simple test attempt function for direct table insertion

-- Function to handle simple test attempt insertion (matches your request format)
CREATE OR REPLACE FUNCTION insert_simple_test_attempt(
  user_id UUID,
  exam_id VARCHAR(50),
  score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  time_taken INTEGER DEFAULT NULL,
  answers JSONB DEFAULT NULL,
  test_type VARCHAR(20) DEFAULT 'practice',
  test_id VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  attempt_id UUID
) AS $$
DECLARE
  new_attempt_id UUID;
  generated_test_id VARCHAR(100);
BEGIN
  -- Generate test_id if not provided
  IF test_id IS NULL THEN
    generated_test_id := exam_id || '-' || test_type || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
  ELSE
    generated_test_id := test_id;
  END IF;
  
  -- Insert the test attempt
  INSERT INTO test_attempts (
    user_id, exam_id, test_type, test_id, score, total_questions,
    correct_answers, time_taken, answers, completed_at
  )
  VALUES (
    user_id, exam_id, test_type, generated_test_id, score, total_questions,
    correct_answers, time_taken, answers, NOW()
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_simple_test_attempt(UUID, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, JSONB, VARCHAR, VARCHAR) TO authenticated;
