-- Add remaining RPC functions that the application needs

-- Function to upsert test completion (simple version)
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
RETURNS VOID AS $$
BEGIN
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
    completed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to upsert exam stats
CREATE OR REPLACE FUNCTION upsert_exam_stats(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_total_tests INTEGER,
  p_best_score INTEGER,
  p_average_score DECIMAL(5,2),
  p_rank INTEGER DEFAULT NULL,
  p_last_test_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO exam_stats (
    user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date
  )
  VALUES (
    p_user_id, p_exam_id, p_total_tests, p_best_score, p_average_score, p_rank, p_last_test_date
  )
  ON CONFLICT (user_id, exam_id)
  DO UPDATE SET
    total_tests = EXCLUDED.total_tests,
    best_score = EXCLUDED.best_score,
    average_score = EXCLUDED.average_score,
    rank = EXCLUDED.rank,
    last_test_date = EXCLUDED.last_test_date,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to submit individual test score
CREATE OR REPLACE FUNCTION submitindividualtestscore(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(20),
  test_name VARCHAR(100),
  score_value INTEGER
)
RETURNS VOID AS $$
DECLARE
  total_questions INTEGER := 1; -- Default, can be adjusted based on your logic
  correct_answers INTEGER;
BEGIN
  -- Calculate correct answers based on score percentage
  correct_answers := ROUND((score_value * total_questions) / 100.0);
  
  -- Insert or update individual test score
  INSERT INTO individual_test_scores (
    user_id, exam_id, test_type, test_id, score, total_questions, correct_answers, completed_at
  )
  VALUES (
    user_uuid, exam_name, test_type_name, test_name, score_value, total_questions, correct_answers, NOW()
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    completed_at = EXCLUDED.completed_at;
    
  -- Update user streak
  PERFORM update_user_streak(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user streak data
CREATE OR REPLACE FUNCTION get_user_streak(user_uuid UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_activity_date DATE,
  total_tests_taken INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.current_streak,
    us.longest_streak,
    us.last_activity_date,
    us.total_tests_taken
  FROM user_streaks us
  WHERE us.user_id = user_uuid
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user exam stats
CREATE OR REPLACE FUNCTION get_user_exam_stats(user_uuid UUID, exam_name VARCHAR(50))
RETURNS TABLE (
  total_tests INTEGER,
  best_score INTEGER,
  average_score DECIMAL(5,2),
  rank INTEGER,
  last_test_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.total_tests,
    es.best_score,
    es.average_score,
    es.rank,
    es.last_test_date
  FROM exam_stats es
  WHERE es.user_id = user_uuid AND es.exam_id = exam_name
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get all user exam stats
CREATE OR REPLACE FUNCTION get_all_user_exam_stats(user_uuid UUID)
RETURNS TABLE (
  exam_id VARCHAR(50),
  total_tests INTEGER,
  best_score INTEGER,
  average_score DECIMAL(5,2),
  rank INTEGER,
  last_test_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.exam_id,
    es.total_tests,
    es.best_score,
    es.average_score,
    es.rank,
    es.last_test_date
  FROM exam_stats es
  WHERE es.user_id = user_uuid
  ORDER BY es.exam_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions on all new functions
GRANT EXECUTE ON FUNCTION upsert_test_completion_simple(UUID, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER, INTEGER, VARCHAR, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_exam_stats(UUID, VARCHAR, INTEGER, INTEGER, DECIMAL, INTEGER, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION submitindividualtestscore(UUID, VARCHAR, VARCHAR, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_exam_stats(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_user_exam_stats(UUID) TO authenticated;
