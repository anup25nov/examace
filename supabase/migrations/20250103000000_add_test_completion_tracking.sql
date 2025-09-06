-- Add test completion tracking and streak functionality

-- Create test_completions table to track individual test completions
CREATE TABLE IF NOT EXISTS test_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL, -- 'pyq', 'practice', 'mock'
  test_id VARCHAR(100) NOT NULL, -- specific test identifier
  topic_id VARCHAR(100), -- for practice tests
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answers JSONB, -- store user answers
  UNIQUE(user_id, exam_id, test_type, test_id, topic_id)
);

-- Create user_streaks table to track daily streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_tests_taken INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE test_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_completions
CREATE POLICY "Users can view own test completions" ON test_completions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own test completions" ON test_completions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own test completions" ON test_completions
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for user_streaks
CREATE POLICY "Users can view own streaks" ON user_streaks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streaks" ON user_streaks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own streaks" ON user_streaks
  FOR UPDATE USING (user_id = auth.uid());

-- Function to update user streak
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

-- Grant necessary permissions
GRANT ALL ON test_completions TO authenticated;
GRANT ALL ON user_streaks TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_test_completed(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
