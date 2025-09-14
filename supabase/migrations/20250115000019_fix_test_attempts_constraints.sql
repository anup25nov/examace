-- Fix test_attempts table constraints to handle missing test_id

-- 1. First, let's check the current structure and make test_id nullable or provide a default
ALTER TABLE test_attempts ALTER COLUMN test_id DROP NOT NULL;

-- 2. Add a default value for test_id if it's null
ALTER TABLE test_attempts ALTER COLUMN test_id SET DEFAULT 'default_test';

-- 3. Update existing records that have null test_id
UPDATE test_attempts 
SET test_id = 'default_test_' || id::text 
WHERE test_id IS NULL;

-- 4. Create a function to insert test attempts with proper defaults
CREATE OR REPLACE FUNCTION insert_test_attempt_with_defaults(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_score INTEGER,
  p_total_questions INTEGER,
  p_correct_answers INTEGER,
  p_time_taken INTEGER,
  p_answers JSONB,
  p_test_id VARCHAR(100) DEFAULT NULL,
  p_test_type VARCHAR(20) DEFAULT 'practice'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  attempt_id UUID
) AS $$
DECLARE
  generated_test_id VARCHAR(100);
  new_attempt_id UUID;
BEGIN
  -- Generate test_id if not provided
  IF p_test_id IS NULL OR p_test_id = '' THEN
    generated_test_id := 'test_' || p_exam_id || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  ELSE
    generated_test_id := p_test_id;
  END IF;
  
  -- Insert the test attempt
  INSERT INTO test_attempts (
    user_id,
    exam_id,
    test_id,
    test_type,
    score,
    total_questions,
    correct_answers,
    time_taken,
    answers,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_exam_id,
    generated_test_id,
    p_test_type,
    p_score,
    p_total_questions,
    p_correct_answers,
    p_time_taken,
    p_answers,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_attempt_id;
  
  RETURN QUERY SELECT true, 'Test attempt created successfully', new_attempt_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating test attempt: ' || SQLERRM, NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create a simpler function for direct inserts (matching the user's format)
CREATE OR REPLACE FUNCTION insert_simple_test_attempt(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_score INTEGER,
  p_total_questions INTEGER,
  p_correct_answers INTEGER,
  p_time_taken INTEGER,
  p_answers JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  attempt_id UUID
) AS $$
DECLARE
  generated_test_id VARCHAR(100);
  new_attempt_id UUID;
BEGIN
  -- Generate a unique test_id
  generated_test_id := 'test_' || p_exam_id || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  
  -- Insert the test attempt with all required fields
  INSERT INTO test_attempts (
    user_id,
    exam_id,
    test_id,
    test_type,
    score,
    total_questions,
    correct_answers,
    time_taken,
    answers,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_exam_id,
    generated_test_id,
    'practice', -- default test type
    p_score,
    p_total_questions,
    p_correct_answers,
    p_time_taken,
    p_answers,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_attempt_id;
  
  RETURN QUERY SELECT true, 'Test attempt created successfully', new_attempt_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating test attempt: ' || SQLERRM, NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION insert_test_attempt_with_defaults(UUID, VARCHAR(50), INTEGER, INTEGER, INTEGER, INTEGER, JSONB, VARCHAR(100), VARCHAR(20)) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_simple_test_attempt(UUID, VARCHAR(50), INTEGER, INTEGER, INTEGER, INTEGER, JSONB) TO authenticated;
