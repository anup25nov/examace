-- Fix All Dashboard Issues
-- Run this in Supabase SQL Editor

-- 1. Fix get_comprehensive_referral_stats function - remove non-existent column
DROP FUNCTION IF EXISTS get_comprehensive_referral_stats(UUID);

CREATE OR REPLACE FUNCTION get_comprehensive_referral_stats(user_uuid UUID)
RETURNS TABLE(
    referral_code VARCHAR(20),
    total_referrals INTEGER,
    total_commissions_earned DECIMAL(10,2),
    paid_commissions DECIMAL(10,2),
    pending_commissions DECIMAL(10,2),
    cancelled_commissions DECIMAL(10,2),
    active_referrals INTEGER,
    completed_referrals INTEGER,
    pending_referrals INTEGER,
    referral_link TEXT,
    code_created_at TIMESTAMP WITH TIME ZONE,
    last_referral_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.code as referral_code,  -- Explicitly reference rc.code
        COALESCE(rc.total_referrals, 0)::INTEGER as total_referrals,
        COALESCE(rc.total_earnings, 0.00) as total_commissions_earned,
        COALESCE(SUM(CASE WHEN rc_comm.status = 'paid' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as paid_commissions,
        COALESCE(SUM(CASE WHEN rc_comm.status = 'pending' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as pending_commissions,
        COALESCE(SUM(CASE WHEN rc_comm.status = 'refunded' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as cancelled_commissions,
        COUNT(CASE WHEN rt.status = 'pending' THEN 1 END)::INTEGER as active_referrals,
        COUNT(CASE WHEN rt.status = 'completed' THEN 1 END)::INTEGER as completed_referrals,
        COUNT(CASE WHEN rt.status = 'pending' THEN 1 END)::INTEGER as pending_referrals,  -- Removed non-existent column
        CONCAT('https://examace-smoky.vercel.app/auth?ref=', rc.code) as referral_link,
        rc.created_at as code_created_at,
        MAX(rt.created_at) as last_referral_date
    FROM referral_codes rc
    LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
    LEFT JOIN referral_commissions rc_comm ON rt.referred_id = rc_comm.referred_id
    WHERE rc.user_id = user_uuid
    GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings, rc.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix get_user_messages function - use 'content' column instead of 'message'
CREATE OR REPLACE FUNCTION get_user_messages(user_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
    id UUID,
    message_type VARCHAR(50),
    title TEXT,
    message TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.id,
        COALESCE(um.message_type, 'info') as message_type,
        um.title,
        um.content as message,  -- Use 'content' column instead of 'message'
        um.is_read,
        um.created_at
    FROM user_messages um
    WHERE um.user_id = user_uuid
    ORDER BY um.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add message_type column to user_messages table if it doesn't exist
ALTER TABLE user_messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'info';

-- 4. Update existing records to have message_type
UPDATE user_messages 
SET message_type = 'info' 
WHERE message_type IS NULL;

-- 5. Create upsert function for test attempts to fix duplicate API calls
CREATE OR REPLACE FUNCTION upsert_test_attempt(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100),
  p_score INTEGER DEFAULT 0,
  p_total_questions INTEGER DEFAULT 100,
  p_correct_answers INTEGER DEFAULT 0,
  p_time_taken INTEGER DEFAULT NULL,
  p_answers JSONB DEFAULT NULL,
  p_status VARCHAR(20) DEFAULT 'in_progress'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  attempt_id UUID,
  is_new BOOLEAN
) AS $$
DECLARE
  existing_attempt_id UUID;
  new_attempt_id UUID;
  is_new_attempt BOOLEAN := false;
BEGIN
  -- First, try to find existing incomplete attempt
  SELECT id INTO existing_attempt_id
  FROM test_attempts
  WHERE user_id = p_user_id
    AND exam_id = p_exam_id
    AND test_type = p_test_type
    AND test_id = p_test_id
    AND score = 0
    AND completed_at IS NULL
  LIMIT 1;

  IF existing_attempt_id IS NOT NULL THEN
    -- Update existing attempt
    UPDATE test_attempts
    SET 
      score = p_score,
      total_questions = p_total_questions,
      correct_answers = p_correct_answers,
      time_taken = p_time_taken,
      answers = p_answers,
      status = p_status,
      completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE completed_at END,
      updated_at = NOW()
    WHERE id = existing_attempt_id;
    
    new_attempt_id := existing_attempt_id;
    is_new_attempt := false;
  ELSE
    -- Create new attempt
    INSERT INTO test_attempts (
      user_id, exam_id, test_type, test_id, score, total_questions,
      correct_answers, time_taken, answers, status, completed_at, created_at, updated_at
    )
    VALUES (
      p_user_id, p_exam_id, p_test_type, p_test_id, p_score, p_total_questions,
      p_correct_answers, p_time_taken, p_answers, p_status,
      CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
      NOW(), NOW()
    )
    RETURNING id INTO new_attempt_id;
    
    is_new_attempt := true;
  END IF;

  -- Return success
  RETURN QUERY
  SELECT 
    true as success,
    CASE WHEN is_new_attempt THEN 'New test attempt created' ELSE 'Existing test attempt updated' END as message,
    new_attempt_id,
    is_new_attempt;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error with test attempt: ' || SQLERRM as message,
      NULL::UUID as attempt_id,
      false as is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION upsert_test_attempt(UUID, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, JSONB, VARCHAR) TO authenticated;
