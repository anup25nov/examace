-- Add individual test scores and ranks tracking

-- Create individual_test_scores table to track scores for each test attempt
CREATE TABLE IF NOT EXISTS individual_test_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL, -- 'mock' or 'pyq'
  test_id VARCHAR(100) NOT NULL, -- specific test identifier
  score INTEGER NOT NULL,
  rank INTEGER,
  total_participants INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id, test_type, test_id)
);

-- Enable Row Level Security
ALTER TABLE individual_test_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for individual_test_scores
CREATE POLICY "Users can view own individual test scores" ON individual_test_scores
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own individual test scores" ON individual_test_scores
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own individual test scores" ON individual_test_scores
  FOR UPDATE USING (user_id = auth.uid());

-- Function to calculate rank for a specific test
CREATE OR REPLACE FUNCTION calculate_test_rank(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(20),
  test_name VARCHAR(100)
)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
  total_participants INTEGER;
BEGIN
  -- Get user's rank for this specific test
  SELECT 
    ROW_NUMBER() OVER (ORDER BY score DESC, completed_at ASC) as rank,
    COUNT(*) OVER() as total_count
  INTO user_rank, total_participants
  FROM individual_test_scores
  WHERE exam_id = exam_name 
    AND test_type = test_type_name 
    AND test_id = test_name
    AND user_id = user_uuid;
  
  -- Update the rank in the table
  UPDATE individual_test_scores 
  SET rank = user_rank, total_participants = total_participants
  WHERE user_id = user_uuid 
    AND exam_id = exam_name 
    AND test_type = test_type_name 
    AND test_id = test_name;
  
  RETURN user_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's score and rank for a specific test
CREATE OR REPLACE FUNCTION get_user_test_score(
  user_uuid UUID,
  exam_name VARCHAR(50),
  test_type_name VARCHAR(20),
  test_name VARCHAR(100)
)
RETURNS TABLE(score INTEGER, rank INTEGER, total_participants INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    its.score,
    its.rank,
    its.total_participants
  FROM individual_test_scores its
  WHERE its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = test_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update exam stats based only on Mock and PYQ tests
CREATE OR REPLACE FUNCTION update_exam_stats_mock_pyq_only(exam_name VARCHAR(50))
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  total_tests INTEGER;
  avg_score DECIMAL;
  best_score INTEGER;
BEGIN
  -- Loop through all users for this exam
  FOR user_record IN 
    SELECT DISTINCT user_id FROM individual_test_scores WHERE exam_id = exam_name
  LOOP
    -- Calculate stats for this user (Mock and PYQ only)
    SELECT 
      COUNT(*) as test_count,
      ROUND(AVG(score)) as average_score,
      MAX(score) as maximum_score
    INTO total_tests, avg_score, best_score
    FROM individual_test_scores
    WHERE user_id = user_record.user_id 
      AND exam_id = exam_name 
      AND test_type IN ('mock', 'pyq');
    
    -- Update or insert exam stats
    INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, last_test_date)
    VALUES (user_record.user_id, exam_name, total_tests, best_score, avg_score, NOW())
    ON CONFLICT (user_id, exam_id) 
    DO UPDATE SET
      total_tests = EXCLUDED.total_tests,
      best_score = EXCLUDED.best_score,
      average_score = EXCLUDED.average_score,
      last_test_date = EXCLUDED.last_test_date,
      updated_at = NOW();
  END LOOP;
  
  -- Recalculate ranks for this exam
  PERFORM calculate_exam_ranks(exam_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant necessary permissions
GRANT ALL ON individual_test_scores TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_test_rank(UUID, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_test_score(UUID, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION update_exam_stats_mock_pyq_only(VARCHAR) TO authenticated;
