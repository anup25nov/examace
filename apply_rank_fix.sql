-- Apply rank and score fixes directly

-- First, add missing columns to individual_test_scores if they don't exist
ALTER TABLE individual_test_scores 
ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0;

-- Create the missing get_test_rank_and_highest_score function
CREATE OR REPLACE FUNCTION get_test_rank_and_highest_score(
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100),
  p_user_id UUID
)
RETURNS TABLE (
  user_rank INTEGER,
  total_participants INTEGER,
  highest_score INTEGER,
  user_score INTEGER
) AS $$
DECLARE
  user_score_val INTEGER;
  total_participants_val INTEGER;
  user_rank_val INTEGER;
  highest_score_val INTEGER;
BEGIN
  -- Get user's score
  SELECT score INTO user_score_val
  FROM individual_test_scores
  WHERE user_id = p_user_id 
    AND exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id
  LIMIT 1;

  -- If no user score found, return null values
  IF user_score_val IS NULL THEN
    RETURN QUERY SELECT NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Get total participants and highest score for this test
  SELECT 
    COUNT(*)::INTEGER,
    MAX(score)::INTEGER
  INTO total_participants_val, highest_score_val
  FROM individual_test_scores
  WHERE exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id;

  -- Calculate user's rank (1-based ranking)
  SELECT COUNT(*) + 1
  INTO user_rank_val
  FROM individual_test_scores
  WHERE exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id
    AND score > user_score_val;

  -- Update the individual_test_scores record with calculated rank and total_participants
  UPDATE individual_test_scores
  SET 
    rank = user_rank_val,
    total_participants = total_participants_val
  WHERE user_id = p_user_id 
    AND exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id;

  -- Return the calculated values
  RETURN QUERY SELECT 
    user_rank_val,
    total_participants_val,
    highest_score_val,
    user_score_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update get_user_test_score to include rank and total_participants
CREATE OR REPLACE FUNCTION get_user_test_score(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(20),
  test_name VARCHAR(100)
)
RETURNS TABLE (
  score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  time_taken INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  rank INTEGER,
  total_participants INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    its.score,
    its.total_questions,
    its.correct_answers,
    its.time_taken,
    its.completed_at,
    COALESCE(its.rank, 0) as rank,
    COALESCE(its.total_participants, 0) as total_participants
  FROM individual_test_scores its
  WHERE its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = test_name
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to update ranks for all tests in an exam
CREATE OR REPLACE FUNCTION update_all_test_ranks(
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100)
)
RETURNS VOID AS $$
DECLARE
  test_record RECORD;
  current_rank INTEGER;
  total_participants INTEGER;
BEGIN
  -- Get total participants for this test
  SELECT COUNT(*) INTO total_participants
  FROM individual_test_scores
  WHERE exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id;

  -- Update ranks for all participants in this test
  current_rank := 1;
  FOR test_record IN
    SELECT user_id, score
    FROM individual_test_scores
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
    ORDER BY score DESC, completed_at ASC
  LOOP
    UPDATE individual_test_scores
    SET 
      rank = current_rank,
      total_participants = total_participants
    WHERE user_id = test_record.user_id 
      AND exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id;
    
    current_rank := current_rank + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create upsert_test_attempt function
CREATE OR REPLACE FUNCTION upsert_test_attempt(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100),
  p_score INTEGER,
  p_total_questions INTEGER,
  p_correct_answers INTEGER,
  p_time_taken INTEGER,
  p_answers JSONB,
  p_status VARCHAR(20)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  attempt_id UUID
) AS $$
DECLARE
  new_attempt_id UUID;
  existing_attempt_id UUID;
BEGIN
  -- Check if attempt already exists
  SELECT id INTO existing_attempt_id
  FROM test_attempts
  WHERE user_id = p_user_id 
    AND exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id
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
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = existing_attempt_id;
    
    new_attempt_id := existing_attempt_id;
  ELSE
    -- Insert new attempt
    INSERT INTO test_attempts (
      user_id, exam_id, test_type, test_id, score, total_questions,
      correct_answers, time_taken, answers, status, completed_at
    )
    VALUES (
      p_user_id, p_exam_id, p_test_type, p_test_id, p_score, p_total_questions,
      p_correct_answers, p_time_taken, p_answers, p_status, NOW()
    )
    RETURNING id INTO new_attempt_id;
  END IF;

  -- Insert/update individual test score
  INSERT INTO individual_test_scores (
    user_id, exam_id, test_type, test_id, score, total_questions,
    correct_answers, time_taken, completed_at
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_score, p_total_questions,
    p_correct_answers, p_time_taken, NOW()
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    time_taken = EXCLUDED.time_taken,
    completed_at = EXCLUDED.completed_at;

  -- Insert/update test completion
  INSERT INTO test_completions (
    user_id, exam_id, test_type, test_id, score, total_questions,
    correct_answers, time_taken, answers, completed_at
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_score, p_total_questions,
    p_correct_answers, p_time_taken, p_answers, NOW()
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    time_taken = EXCLUDED.time_taken,
    answers = EXCLUDED.answers,
    completed_at = EXCLUDED.completed_at;

  -- Return success
  RETURN QUERY SELECT true, 'Test attempt saved successfully', new_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_test_rank_and_highest_score(VARCHAR(50), VARCHAR(20), VARCHAR(100), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_all_test_ranks(VARCHAR(50), VARCHAR(20), VARCHAR(100)) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_test_attempt(UUID, VARCHAR(50), VARCHAR(20), VARCHAR(100), INTEGER, INTEGER, INTEGER, INTEGER, JSONB, VARCHAR(20)) TO authenticated;
