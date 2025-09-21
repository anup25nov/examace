-- Fix update_user_streak function to use correct table
-- The function was trying to access current_streak in user_profiles but it's in user_streaks

-- Drop existing function
DROP FUNCTION IF EXISTS update_user_streak(UUID);

-- Create corrected update_user_streak function
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  existing_streak RECORD;
  new_streak INTEGER := 1;
  new_longest_streak INTEGER;
  new_total_tests INTEGER;
BEGIN
  -- Get existing streak data
  SELECT current_streak, longest_streak, last_activity_date, total_tests_taken
  INTO existing_streak
  FROM user_streaks
  WHERE user_id = user_uuid;
  
  -- If no streak record exists, create one
  IF existing_streak IS NULL THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_tests_taken)
    VALUES (user_uuid, 1, 1, today_date, 1);
    RETURN;
  END IF;
  
  -- Calculate new streak
  IF existing_streak.last_activity_date = today_date THEN
    -- Already updated today, just increment total tests
    new_streak := existing_streak.current_streak;
    new_total_tests := existing_streak.total_tests_taken + 1;
  ELSIF existing_streak.last_activity_date = yesterday_date THEN
    -- Consecutive day, increment streak
    new_streak := existing_streak.current_streak + 1;
    new_total_tests := existing_streak.total_tests_taken + 1;
  ELSE
    -- Streak broken, reset to 1
    new_streak := 1;
    new_total_tests := existing_streak.total_tests_taken + 1;
  END IF;
  
  -- Calculate new longest streak
  new_longest_streak := GREATEST(existing_streak.longest_streak, new_streak);
  
  -- Update streak record
  UPDATE user_streaks
  SET 
    current_streak = new_streak,
    longest_streak = new_longest_streak,
    last_activity_date = today_date,
    total_tests_taken = new_total_tests,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- If no rows were updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_tests_taken)
    VALUES (user_uuid, new_streak, new_longest_streak, today_date, new_total_tests);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO authenticated, anon;
