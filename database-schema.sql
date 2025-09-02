-- Enable RLS on all tables
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  phone VARCHAR(10) UNIQUE NOT NULL,
  pin VARCHAR(6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_stats table
CREATE TABLE IF NOT EXISTS exam_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  total_tests INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  average_score INTEGER DEFAULT 0,
  rank INTEGER,
  last_test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id)
);

-- Create test_attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answers JSONB -- store user answers
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for exam_stats
CREATE POLICY "Users can view own exam stats" ON exam_stats
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own exam stats" ON exam_stats
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own exam stats" ON exam_stats
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for test_attempts
CREATE POLICY "Users can view own test attempts" ON test_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own test attempts" ON test_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_stats_updated_at BEFORE UPDATE ON exam_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate ranks (call this periodically)
CREATE OR REPLACE FUNCTION calculate_exam_ranks(exam_name VARCHAR(50))
RETURNS VOID AS $$
BEGIN
  UPDATE exam_stats 
  SET rank = ranked.rank
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY best_score DESC, average_score DESC, total_tests DESC) as rank
    FROM exam_stats 
    WHERE exam_id = exam_name
  ) ranked
  WHERE exam_stats.id = ranked.id AND exam_stats.exam_id = exam_name;
END;
$$ LANGUAGE plpgsql;

-- Insert some initial data if needed
-- This can be run after setting up auth

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON exam_stats TO authenticated;
GRANT ALL ON test_attempts TO authenticated;