-- Fix missing functions and schema issues

-- 1. Add display_order column to membership_plans
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing plans with display order
UPDATE membership_plans SET display_order = 1 WHERE id = 'free';
UPDATE membership_plans SET display_order = 2 WHERE id = 'premium';
UPDATE membership_plans SET display_order = 3 WHERE id = 'pro';

-- 2. Create update_daily_visit function
CREATE OR REPLACE FUNCTION update_daily_visit(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Update user streak for daily visit
  INSERT INTO user_streaks (user_id, last_visit_date, current_streak, longest_streak)
  VALUES (user_uuid, CURRENT_DATE, 1, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_visit_date = CURRENT_DATE,
    current_streak = CASE 
      WHEN user_streaks.last_visit_date = CURRENT_DATE - INTERVAL '1 day' 
      THEN user_streaks.current_streak + 1
      WHEN user_streaks.last_visit_date = CURRENT_DATE 
      THEN user_streaks.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_streaks.longest_streak,
      CASE 
        WHEN user_streaks.last_visit_date = CURRENT_DATE - INTERVAL '1 day' 
        THEN user_streaks.current_streak + 1
        WHEN user_streaks.last_visit_date = CURRENT_DATE 
        THEN user_streaks.current_streak
        ELSE 1
      END
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create get_user_performance_stats function
CREATE OR REPLACE FUNCTION get_user_performance_stats(exam_name VARCHAR(50), user_uuid UUID)
RETURNS TABLE (
  total_tests INTEGER,
  total_score INTEGER,
  average_score DECIMAL(5,2),
  best_score INTEGER,
  total_time_taken INTEGER,
  average_time_per_question DECIMAL(5,2),
  accuracy_percentage DECIMAL(5,2),
  rank INTEGER,
  percentile DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(*) as test_count,
      SUM(score) as user_total_score,
      AVG(score) as avg_score,
      MAX(score) as best_score,
      SUM(time_taken) as total_time,
      AVG(time_taken::DECIMAL / NULLIF(total_questions, 0)) as avg_time_per_q,
      AVG((correct_answers::DECIMAL / NULLIF(total_questions, 0)) * 100) as accuracy
    FROM test_completions tc
    WHERE tc.user_id = user_uuid AND tc.exam_id = exam_name
  ),
  rank_stats AS (
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE user_total_score > (SELECT user_total_score FROM user_stats)) as users_below
    FROM (
      SELECT user_id, SUM(score) as user_total_score
      FROM test_completions 
      WHERE exam_id = exam_name
      GROUP BY user_id
    ) all_users
  )
  SELECT 
    COALESCE(us.test_count, 0)::INTEGER as total_tests,
    COALESCE(us.user_total_score, 0)::INTEGER as total_score,
    COALESCE(us.avg_score, 0)::DECIMAL(5,2) as average_score,
    COALESCE(us.best_score, 0)::INTEGER as best_score,
    COALESCE(us.total_time, 0)::INTEGER as total_time_taken,
    COALESCE(us.avg_time_per_q, 0)::DECIMAL(5,2) as average_time_per_question,
    COALESCE(us.accuracy, 0)::DECIMAL(5,2) as accuracy_percentage,
    COALESCE(rs.users_below + 1, 1)::INTEGER as rank,
    COALESCE((rs.users_below::DECIMAL / NULLIF(rs.total_users, 0)) * 100, 0)::DECIMAL(5,2) as percentile
  FROM user_stats us, rank_stats rs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create get_membership_plans function
CREATE OR REPLACE FUNCTION get_membership_plans()
RETURNS TABLE (
  id VARCHAR(50),
  name VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  duration_days INTEGER,
  duration_months INTEGER,
  mock_tests INTEGER,
  features JSONB,
  is_active BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.id,
    mp.name,
    mp.description,
    mp.price,
    mp.original_price,
    mp.duration_days,
    mp.duration_months,
    mp.mock_tests,
    mp.features,
    mp.is_active,
    mp.display_order,
    mp.created_at,
    mp.updated_at
  FROM membership_plans mp
  WHERE mp.is_active = true
  ORDER BY mp.display_order ASC, mp.price ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Fix RLS policies for user_profiles
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_daily_visit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_performance_stats(VARCHAR(50), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_membership_plans() TO authenticated;
