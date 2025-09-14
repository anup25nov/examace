-- Add function to update exam stats properly

-- Function to update exam stats properly when a new test is completed
CREATE OR REPLACE FUNCTION update_exam_stats_properly(
  user_uuid UUID,
  exam_name VARCHAR(50),
  new_score INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_stats RECORD;
  new_total_tests INTEGER;
  new_best_score INTEGER;
  new_average_score DECIMAL(5,2);
  new_rank INTEGER;
BEGIN
  -- Get current exam stats
  SELECT total_tests, best_score, average_score, rank
  INTO current_stats
  FROM exam_stats
  WHERE user_id = user_uuid AND exam_id = exam_name;
  
  -- If no stats exist, create initial stats
  IF NOT FOUND THEN
    INSERT INTO exam_stats (
      user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date
    )
    VALUES (
      user_uuid, exam_name, 1, new_score, new_score, NULL, NOW()
    );
    RETURN;
  END IF;
  
  -- Calculate new stats
  new_total_tests := current_stats.total_tests + 1;
  new_best_score := GREATEST(current_stats.best_score, new_score);
  
  -- Calculate new average score
  new_average_score := (
    (current_stats.average_score * current_stats.total_tests + new_score) / new_total_tests
  );
  
  -- Update the exam stats
  UPDATE exam_stats
  SET 
    total_tests = new_total_tests,
    best_score = new_best_score,
    average_score = new_average_score,
    last_test_date = NOW(),
    updated_at = NOW()
  WHERE user_id = user_uuid AND exam_id = exam_name;
  
  -- Update ranks for this exam (optional - can be expensive for large datasets)
  -- This calculates rank based on best_score for the exam
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY best_score DESC, last_test_date ASC) as new_rank
    FROM exam_stats
    WHERE exam_id = exam_name
  )
  UPDATE exam_stats
  SET rank = ranked_users.new_rank
  FROM ranked_users
  WHERE exam_stats.user_id = ranked_users.user_id 
    AND exam_stats.exam_id = exam_name;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get exam leaderboard for a specific exam
CREATE OR REPLACE FUNCTION get_exam_leaderboard(
  exam_name VARCHAR(50),
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  phone TEXT,
  best_score INTEGER,
  total_tests INTEGER,
  average_score DECIMAL(5,2),
  rank INTEGER,
  last_test_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.phone,
    es.best_score,
    es.total_tests,
    es.average_score,
    es.rank,
    es.last_test_date
  FROM exam_stats es
  JOIN user_profiles up ON es.user_id = up.id
  WHERE es.exam_id = exam_name
  ORDER BY es.best_score DESC, es.last_test_date ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's rank in a specific exam
CREATE OR REPLACE FUNCTION get_user_exam_rank(
  user_uuid UUID,
  exam_name VARCHAR(50)
)
RETURNS TABLE (
  rank INTEGER,
  total_participants INTEGER,
  percentile DECIMAL(5,2)
) AS $$
DECLARE
  user_rank INTEGER;
  total_users INTEGER;
  percentile_score DECIMAL(5,2);
BEGIN
  -- Get user's rank and total participants
  SELECT 
    es.rank,
    COUNT(*) OVER() as total_count
  INTO user_rank, total_users
  FROM exam_stats es
  WHERE es.user_id = user_uuid AND es.exam_id = exam_name;
  
  -- Calculate percentile
  IF total_users > 0 THEN
    percentile_score := ((total_users - user_rank + 1) * 100.0) / total_users;
  ELSE
    percentile_score := 0;
  END IF;
  
  RETURN QUERY
  SELECT 
    user_rank,
    total_users,
    percentile_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get comprehensive user stats
CREATE OR REPLACE FUNCTION get_user_comprehensive_stats(user_uuid UUID)
RETURNS TABLE (
  exam_id VARCHAR(50),
  total_tests INTEGER,
  best_score INTEGER,
  average_score DECIMAL(5,2),
  rank INTEGER,
  total_participants INTEGER,
  percentile DECIMAL(5,2),
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
    COUNT(*) OVER(PARTITION BY es.exam_id) as total_participants,
    CASE 
      WHEN COUNT(*) OVER(PARTITION BY es.exam_id) > 0 
      THEN ((COUNT(*) OVER(PARTITION BY es.exam_id) - es.rank + 1) * 100.0) / COUNT(*) OVER(PARTITION BY es.exam_id)
      ELSE 0 
    END as percentile,
    es.last_test_date
  FROM exam_stats es
  WHERE es.user_id = user_uuid
  ORDER BY es.exam_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions on all new functions
GRANT EXECUTE ON FUNCTION update_exam_stats_properly(UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exam_leaderboard(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_exam_rank(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_comprehensive_stats(UUID) TO authenticated;
