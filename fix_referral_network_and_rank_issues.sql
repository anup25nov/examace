-- Fix Referral Network and Rank Issues
-- Run this in Supabase SQL Editor

-- 1. Fix get_referral_network_detailed function - remove non-existent column rc.membership_plan
DROP FUNCTION IF EXISTS get_referral_network_detailed(UUID);

CREATE OR REPLACE FUNCTION get_referral_network_detailed(user_uuid UUID)
RETURNS TABLE (
  referred_user_id UUID,
  referred_phone_masked TEXT,
  signup_date TIMESTAMP WITH TIME ZONE,
  referral_status TEXT,
  commission_status TEXT,
  commission_amount DECIMAL(10,2),
  membership_plan TEXT,
  membership_amount DECIMAL(10,2),
  membership_date TIMESTAMP WITH TIME ZONE,
  is_first_membership BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.referred_id,
    CASE 
      WHEN LENGTH(up.phone) >= 10 THEN 
        (SUBSTRING(up.phone, 1, 3) || '****' || SUBSTRING(up.phone, LENGTH(up.phone) - 2))::TEXT
      ELSE up.phone::TEXT
    END as referred_phone_masked,
    up.created_at,
    rt.status::TEXT as referral_status,
    COALESCE(rc.status, 'pending')::TEXT as commission_status,
    COALESCE(rc.commission_amount, 0.00) as commission_amount,
    -- Use up.membership_plan instead of rc.membership_plan (which doesn't exist)
    COALESCE(up.membership_plan, 'none')::TEXT as membership_plan,
    COALESCE(rc.membership_amount, 0.00) as membership_amount,
    COALESCE(rc.created_at, up.created_at) as membership_date,
    COALESCE(rt.first_membership_only, false) as is_first_membership
  FROM referral_transactions rt
  LEFT JOIN user_profiles up ON rt.referred_id = up.id
  LEFT JOIN referral_commissions rc ON rt.referred_id = rc.referred_id
  WHERE rt.referrer_id = user_uuid
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION get_referral_network_detailed(UUID) TO authenticated;

-- 3. Create function to get real-time rank and highest score for a test
CREATE OR REPLACE FUNCTION get_test_rank_and_highest_score(
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100),
  p_user_id UUID
)
RETURNS TABLE (
  user_rank INTEGER,
  total_participants INTEGER,
  highest_score DECIMAL(5,2),
  user_score DECIMAL(5,2)
) AS $$
DECLARE
  user_score_val DECIMAL(5,2);
  highest_score_val DECIMAL(5,2);
  user_rank_val INTEGER;
  total_participants_val INTEGER;
BEGIN
  -- Get user's score
  SELECT COALESCE(score, 0) INTO user_score_val
  FROM test_attempts
  WHERE exam_id = p_exam_id
    AND test_type = p_test_type
    AND test_id = p_test_id
    AND user_id = p_user_id
    AND completed_at IS NOT NULL
  ORDER BY completed_at DESC
  LIMIT 1;

  -- Get highest score for this test
  SELECT COALESCE(MAX(score), 0) INTO highest_score_val
  FROM test_attempts
  WHERE exam_id = p_exam_id
    AND test_type = p_test_type
    AND test_id = p_test_id
    AND completed_at IS NOT NULL;

  -- Get total participants
  SELECT COUNT(DISTINCT user_id) INTO total_participants_val
  FROM test_attempts
  WHERE exam_id = p_exam_id
    AND test_type = p_test_type
    AND test_id = p_test_id
    AND completed_at IS NOT NULL;

  -- Calculate user's rank
  SELECT COUNT(*) + 1 INTO user_rank_val
  FROM test_attempts
  WHERE exam_id = p_exam_id
    AND test_type = p_test_type
    AND test_id = p_test_id
    AND completed_at IS NOT NULL
    AND score > user_score_val;

  -- If no one has a higher score, user is rank 1
  IF user_rank_val > total_participants_val THEN
    user_rank_val := 1;
  END IF;

  RETURN QUERY
  SELECT 
    user_rank_val as user_rank,
    total_participants_val as total_participants,
    highest_score_val as highest_score,
    user_score_val as user_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_test_rank_and_highest_score(VARCHAR, VARCHAR, VARCHAR, UUID) TO authenticated;

-- 5. Create function to get leaderboard for a specific test
CREATE OR REPLACE FUNCTION get_test_leaderboard(
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100),
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  score DECIMAL(5,2),
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ta.score DESC, ta.completed_at ASC)::INTEGER as rank,
    ta.user_id,
    ta.score,
    ta.completed_at
  FROM test_attempts ta
  WHERE ta.exam_id = p_exam_id
    AND ta.test_type = p_test_type
    AND ta.test_id = p_test_id
    AND ta.completed_at IS NOT NULL
  ORDER BY ta.score DESC, ta.completed_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION get_test_leaderboard(VARCHAR, VARCHAR, VARCHAR, INTEGER) TO authenticated;
