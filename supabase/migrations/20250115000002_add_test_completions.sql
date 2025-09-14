-- Add test_completions table that was missing

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

-- Grant necessary permissions
GRANT ALL ON test_completions TO authenticated;
GRANT ALL ON user_streaks TO authenticated;
