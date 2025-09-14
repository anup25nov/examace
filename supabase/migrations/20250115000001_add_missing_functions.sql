-- Add missing RPC functions that the application needs

-- Function to check if a test is completed
CREATE OR REPLACE FUNCTION is_test_completed(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(20),
  test_name VARCHAR(100),
  topic_name VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  completion_exists BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM test_completions 
    WHERE user_id = user_uuid 
      AND exam_id = exam_name 
      AND test_type = test_type_name 
      AND test_id = test_name 
      AND (topic_id = topic_name OR (topic_id IS NULL AND topic_name IS NULL))
  ) INTO completion_exists;
  
  RETURN completion_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user test score
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
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    its.score,
    its.total_questions,
    its.correct_answers,
    its.time_taken,
    its.completed_at
  FROM individual_test_scores its
  WHERE its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = test_name
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if user has admin role in user_profiles
  SELECT EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = user_uuid 
      AND (membership_plan = 'admin' OR membership_status = 'admin')
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to initialize user exam stats
CREATE OR REPLACE FUNCTION initialize_user_exam_stats(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert default exam stats for common exams if they don't exist
  INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date)
  VALUES 
    (p_user_id, 'ssc-cgl', 0, 0, 0, NULL, NULL),
    (p_user_id, 'ssc-mts', 0, 0, 0, NULL, NULL),
    (p_user_id, 'railway', 0, 0, 0, NULL, NULL),
    (p_user_id, 'bank-po', 0, 0, 0, NULL, NULL),
    (p_user_id, 'airforce', 0, 0, 0, NULL, NULL)
  ON CONFLICT (user_id, exam_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update user streak (from the old migration)
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  current_streak_count INTEGER := 0;
  longest_streak_count INTEGER := 0;
  last_activity DATE;
BEGIN
  -- Get current streak data
  SELECT current_streak, longest_streak, last_activity_date
  INTO current_streak_count, longest_streak_count, last_activity
  FROM user_streaks
  WHERE user_id = user_uuid;

  -- If no streak record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_tests_taken)
    VALUES (user_uuid, 1, 1, today_date, 1);
    RETURN;
  END IF;

  -- Check if user already completed a test today
  IF last_activity = today_date THEN
    -- Already counted today, just update total tests
    UPDATE user_streaks 
    SET total_tests_taken = total_tests_taken + 1,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    RETURN;
  END IF;

  -- If last activity was yesterday, increment streak
  IF last_activity = yesterday_date THEN
    current_streak_count := current_streak_count + 1;
  ELSE
    -- Streak broken, reset to 1
    current_streak_count := 1;
  END IF;

  -- Update longest streak if current is higher
  IF current_streak_count > longest_streak_count THEN
    longest_streak_count := current_streak_count;
  END IF;

  -- Update or insert streak record
  UPDATE user_streaks 
  SET current_streak = current_streak_count,
      longest_streak = longest_streak_count,
      last_activity_date = today_date,
      total_tests_taken = total_tests_taken + 1,
      updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION is_test_completed(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_test_score(UUID, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_exam_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO authenticated;
