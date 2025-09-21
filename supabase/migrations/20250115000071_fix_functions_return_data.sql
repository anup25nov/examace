-- Fix functions to return data instead of VOID to avoid 204 responses

-- Fix submitindividualtestscore to return data
DROP FUNCTION IF EXISTS submitindividualtestscore(UUID, VARCHAR(50), VARCHAR(20), VARCHAR(100), INTEGER);

CREATE OR REPLACE FUNCTION submitindividualtestscore(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(20),
  test_name VARCHAR(100),
  score_value INTEGER
)
RETURNS JSONB AS $$
DECLARE
  total_questions INTEGER := 1; -- Default, can be adjusted based on your logic
  correct_answers INTEGER;
  result JSONB;
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
  
  -- Return the inserted/updated record
  SELECT to_jsonb(its.*) INTO result
  FROM individual_test_scores its
  WHERE its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = test_name;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_exam_stats_properly to return data
DROP FUNCTION IF EXISTS update_exam_stats_properly(UUID, VARCHAR(50), INTEGER);

CREATE OR REPLACE FUNCTION update_exam_stats_properly(
  user_uuid UUID,
  exam_name VARCHAR(50),
  new_score INTEGER
)
RETURNS JSONB AS $$
DECLARE
  current_stats RECORD;
  new_total_tests INTEGER;
  new_best_score INTEGER;
  new_average_score DECIMAL(5,2);
  new_rank INTEGER;
  result JSONB;
BEGIN
  -- Get current stats
  SELECT total_tests, best_score, average_score, rank
  INTO current_stats
  FROM exam_stats
  WHERE user_id = user_uuid AND exam_id = exam_name;
  
  -- Calculate new values
  IF current_stats IS NULL THEN
    -- First test for this exam
    new_total_tests := 1;
    new_best_score := new_score;
    new_average_score := new_score;
    new_rank := 1;
  ELSE
    -- Update existing stats
    new_total_tests := current_stats.total_tests + 1;
    new_best_score := GREATEST(current_stats.best_score, new_score);
    new_average_score := ((current_stats.average_score * current_stats.total_tests) + new_score) / new_total_tests;
    new_rank := 1; -- Will be calculated by rank function later
  END IF;
  
  -- Insert or update exam stats
  INSERT INTO exam_stats (
    user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date
  )
  VALUES (
    user_uuid, exam_name, new_total_tests, new_best_score, new_average_score, new_rank, NOW()
  )
  ON CONFLICT (user_id, exam_id)
  DO UPDATE SET
    total_tests = EXCLUDED.total_tests,
    best_score = EXCLUDED.best_score,
    average_score = EXCLUDED.average_score,
    rank = EXCLUDED.rank,
    last_test_date = EXCLUDED.last_test_date,
    updated_at = NOW();
  
  -- Return the updated stats
  SELECT to_jsonb(es.*) INTO result
  FROM exam_stats es
  WHERE es.user_id = user_uuid AND es.exam_id = exam_name;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION submitindividualtestscore(UUID, VARCHAR(50), VARCHAR(20), VARCHAR(100), INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_exam_stats_properly(UUID, VARCHAR(50), INTEGER) TO authenticated, anon;
