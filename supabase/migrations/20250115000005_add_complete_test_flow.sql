-- Add comprehensive test submission flow function

-- Function to handle complete test submission flow
CREATE OR REPLACE FUNCTION submit_test_complete(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100),
  p_score INTEGER,
  p_total_questions INTEGER,
  p_correct_answers INTEGER,
  p_time_taken INTEGER DEFAULT NULL,
  p_answers JSONB DEFAULT NULL,
  p_topic_id VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_best_score INTEGER,
  new_average_score DECIMAL(5,2),
  new_rank INTEGER
) AS $$
DECLARE
  current_stats RECORD;
  new_total_tests INTEGER;
  new_best_score INTEGER;
  new_average_score DECIMAL(5,2);
  new_rank INTEGER;
BEGIN
  -- Insert test attempt
  INSERT INTO test_attempts (
    user_id, exam_id, test_type, test_id, score, total_questions, 
    correct_answers, time_taken, answers, completed_at
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_score, p_total_questions,
    p_correct_answers, p_time_taken, p_answers, NOW()
  );
  
  -- Insert test completion
  INSERT INTO test_completions (
    user_id, exam_id, test_type, test_id, topic_id, score, total_questions,
    correct_answers, time_taken, answers
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_topic_id, p_score, p_total_questions,
    p_correct_answers, p_time_taken, p_answers
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    time_taken = EXCLUDED.time_taken,
    answers = EXCLUDED.answers,
    completed_at = NOW();
  
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
  
  -- Get current exam stats
  SELECT total_tests, best_score, average_score, rank
  INTO current_stats
  FROM exam_stats
  WHERE user_id = p_user_id AND exam_id = p_exam_id;
  
  -- Calculate new stats
  IF NOT FOUND THEN
    -- Create new exam stats
    new_total_tests := 1;
    new_best_score := p_score;
    new_average_score := p_score;
    new_rank := NULL;
    
    INSERT INTO exam_stats (
      user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date
    )
    VALUES (
      p_user_id, p_exam_id, new_total_tests, new_best_score, new_average_score, new_rank, NOW()
    );
  ELSE
    -- Update existing stats
    new_total_tests := current_stats.total_tests + 1;
    new_best_score := GREATEST(current_stats.best_score, p_score);
    new_average_score := (
      (current_stats.average_score * current_stats.total_tests + p_score) / new_total_tests
    );
    
    UPDATE exam_stats
    SET 
      total_tests = new_total_tests,
      best_score = new_best_score,
      average_score = new_average_score,
      last_test_date = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id AND exam_id = p_exam_id;
    
    -- Get updated rank
    SELECT rank INTO new_rank
    FROM exam_stats
    WHERE user_id = p_user_id AND exam_id = p_exam_id;
  END IF;
  
  -- Update user streak
  PERFORM update_user_streak(p_user_id);
  
  -- Return success with stats
  RETURN QUERY
  SELECT 
    true as success,
    'Test submitted successfully' as message,
    new_best_score,
    new_average_score,
    new_rank;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error submitting test: ' || SQLERRM as message,
      NULL::INTEGER as new_best_score,
      NULL::DECIMAL as new_average_score,
      NULL::INTEGER as new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's test history
CREATE OR REPLACE FUNCTION get_user_test_history(
  user_uuid UUID,
  exam_name VARCHAR(50) DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  test_id VARCHAR(100),
  test_type VARCHAR(20),
  score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  time_taken INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.test_id,
    ta.test_type,
    ta.score,
    ta.total_questions,
    ta.correct_answers,
    ta.time_taken,
    ta.completed_at
  FROM test_attempts ta
  WHERE ta.user_id = user_uuid
    AND (exam_name IS NULL OR ta.exam_id = exam_name)
  ORDER BY ta.completed_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's recent test completions
CREATE OR REPLACE FUNCTION get_user_recent_completions(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  exam_id VARCHAR(50),
  test_type VARCHAR(20),
  test_id VARCHAR(100),
  topic_id VARCHAR(100),
  score INTEGER,
  total_questions INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.exam_id,
    tc.test_type,
    tc.test_id,
    tc.topic_id,
    tc.score,
    tc.total_questions,
    tc.completed_at
  FROM test_completions tc
  WHERE tc.user_id = user_uuid
  ORDER BY tc.completed_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions on all new functions
GRANT EXECUTE ON FUNCTION submit_test_complete(UUID, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, JSONB, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_test_history(UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recent_completions(UUID, INTEGER) TO authenticated;
