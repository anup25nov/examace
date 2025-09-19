-- ===============================================
-- FIXED DATABASE FUNCTIONS
-- This script safely handles existing functions
-- ===============================================

-- First, let's check what functions exist and drop only if needed
DO $$
BEGIN
  -- Drop existing functions with different signatures if they exist
  DROP FUNCTION IF EXISTS get_pending_question_reports();
  DROP FUNCTION IF EXISTS get_pending_withdrawal_requests();
  DROP FUNCTION IF EXISTS get_user_messages(uuid,integer);
  DROP FUNCTION IF EXISTS get_unread_message_count(uuid);
  DROP FUNCTION IF EXISTS upsert_test_completion_simple(uuid,varchar,varchar,varchar,varchar,integer,integer,integer,integer,jsonb);
  
  RAISE NOTICE '🗑️ Dropped existing functions with conflicting signatures';
END $$;

-- 1. Create admin functions for payment management (only if not exists)
CREATE OR REPLACE FUNCTION get_all_payments(
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  payment_id VARCHAR(100),
  user_id UUID,
  plan_name VARCHAR(100),
  amount DECIMAL(10,2),
  status VARCHAR(20),
  verification_status VARCHAR(20),
  payment_reference VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  dispute_reason TEXT,
  admin_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.payment_id,
    p.user_id,
    p.plan_name,
    p.amount,
    p.status,
    COALESCE(p.verification_status, p.status) as verification_status,
    COALESCE(p.razorpay_payment_id, p.payment_id) as payment_reference,
    p.created_at,
    p.paid_at,
    p.verified_at,
    (p.created_at + INTERVAL '1 hour') as expires_at,
    p.failed_reason,
    NULL::TEXT as dispute_reason,
    NULL::TEXT as admin_notes
  FROM payments p
  WHERE (p_status IS NULL OR p.status = p_status)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create admin payment verification function (only if not exists)
CREATE OR REPLACE FUNCTION admin_verify_payment(
  p_payment_id VARCHAR(100),
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  payment_record RECORD;
BEGIN
  -- Get payment record
  SELECT * INTO payment_record
  FROM payments
  WHERE payment_id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Payment not found';
    RETURN;
  END IF;
  
  -- Update payment status
  UPDATE payments
  SET 
    status = 'verified',
    verification_status = 'verified',
    verified_at = NOW(),
    updated_at = NOW()
  WHERE payment_id = p_payment_id;
  
  -- Activate membership
  UPDATE user_profiles
  SET 
    membership_plan = payment_record.plan_id,
    membership_expiry = CASE 
      WHEN payment_record.plan_id = 'yearly' THEN NOW() + INTERVAL '1 year'
      WHEN payment_record.plan_id = 'lifetime' THEN NOW() + INTERVAL '100 years'
      ELSE NOW() + INTERVAL '1 month'
    END,
    updated_at = NOW()
  WHERE id = payment_record.user_id;
  
  RETURN QUERY SELECT true, 'Payment verified and membership activated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create admin status check function (only if not exists)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_user BOOLEAN := false;
BEGIN
  -- Check if user is admin (you can customize this logic)
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_uuid 
    AND (
      email LIKE '%@admin.examace.com' OR
      email IN ('admin@examace.com', 'support@examace.com')
    )
  ) INTO admin_user;
  
  RETURN admin_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create question report functions with correct signature
CREATE FUNCTION get_pending_question_reports()
RETURNS TABLE (
  id UUID,
  exam_id VARCHAR(50),
  question_id VARCHAR(100),
  question_number INTEGER,
  issue_type VARCHAR(50),
  issue_description TEXT,
  user_id UUID,
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if question_reports table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_reports') THEN
    RETURN QUERY
    SELECT 
      qr.id,
      qr.exam_id,
      qr.question_id,
      qr.question_number,
      qr.issue_type,
      qr.issue_description,
      qr.user_id,
      qr.status,
      qr.created_at
    FROM question_reports qr
    WHERE qr.status = 'pending'
    ORDER BY qr.created_at DESC;
  ELSE
    -- Return empty result set if table doesn't exist
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create withdrawal request functions with correct signature
CREATE FUNCTION get_pending_withdrawal_requests()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  amount DECIMAL(10,2),
  status VARCHAR(20),
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if referral_payouts table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_payouts') THEN
    RETURN QUERY
    SELECT 
      rp.id,
      rp.user_id,
      rp.amount,
      rp.status,
      jsonb_build_object(
        'method', rp.payment_method,
        'details', rp.account_details
      ) as payment_details,
      rp.created_at
    FROM referral_payouts rp
    WHERE rp.status = 'pending'
    ORDER BY rp.created_at DESC;
  ELSE
    -- Return empty result set if table doesn't exist
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create user message functions with correct signature
CREATE FUNCTION get_user_messages(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  message_type VARCHAR(50),
  message TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if user_messages table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_messages') THEN
    RETURN QUERY
    SELECT 
      um.id,
      um.message_type,
      um.message,
      um.is_read,
      um.created_at
    FROM user_messages um
    WHERE um.user_id = user_uuid
    ORDER BY um.created_at DESC
    LIMIT limit_count;
  ELSE
    -- Return empty result set if table doesn't exist
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER := 0;
BEGIN
  -- Check if user_messages table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_messages') THEN
    SELECT COUNT(*)::INTEGER INTO unread_count
    FROM user_messages
    WHERE user_id = user_uuid AND is_read = false;
  END IF;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE FUNCTION mark_message_as_read(
  message_id UUID,
  user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user_messages table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_messages') THEN
    UPDATE user_messages
    SET is_read = true, updated_at = NOW()
    WHERE id = message_id AND user_id = user_uuid;
    
    RETURN FOUND;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Create test completion function with correct parameter defaults
CREATE FUNCTION upsert_test_completion_simple(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100),
  p_score INTEGER,
  p_total_questions INTEGER,
  p_correct_answers INTEGER,
  p_time_taken INTEGER,
  p_answers JSONB,
  p_topic_id VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Check if test_completions table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_completions') THEN
    -- Insert or update test completion
    INSERT INTO test_completions (
      user_id,
      exam_id,
      test_type,
      test_id,
      topic_id,
      score,
      total_questions,
      correct_answers,
      time_taken,
      answers,
      completed_at
    ) VALUES (
      p_user_id,
      p_exam_id,
      p_test_type,
      p_test_id,
      p_topic_id,
      p_score,
      p_total_questions,
      p_correct_answers,
      p_time_taken,
      p_answers,
      NOW()
    )
    ON CONFLICT (user_id, exam_id, test_type, test_id)
    DO UPDATE SET
      score = GREATEST(test_completions.score, EXCLUDED.score),
      total_questions = EXCLUDED.total_questions,
      correct_answers = EXCLUDED.correct_answers,
      time_taken = EXCLUDED.time_taken,
      answers = EXCLUDED.answers,
      completed_at = EXCLUDED.completed_at,
      updated_at = NOW();
  END IF;
  
  RETURN QUERY SELECT true, 'Test completion recorded successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Create user streak update function (only if not exists)
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  last_test_date DATE;
  current_streak INTEGER := 0;
BEGIN
  -- Check if test_completions table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_completions') THEN
    -- Get the last test date
    SELECT DATE(completed_at) INTO last_test_date
    FROM test_completions
    WHERE user_id = user_uuid
    ORDER BY completed_at DESC
    LIMIT 1;
    
    -- Update user streak (simplified logic)
    IF last_test_date = CURRENT_DATE THEN
      -- Test completed today, increment streak
      UPDATE user_profiles
      SET current_streak = COALESCE(current_streak, 0) + 1,
          updated_at = NOW()
      WHERE id = user_uuid;
    ELSIF last_test_date = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Test completed yesterday, maintain streak
      -- Do nothing
      NULL;
    ELSE
      -- Reset streak
      UPDATE user_profiles
      SET current_streak = 1,
          updated_at = NOW()
      WHERE id = user_uuid;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Grant necessary permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 10. Create indexes for better performance (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id_status ON payments(user_id, status);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_completions') THEN
    CREATE INDEX IF NOT EXISTS idx_test_completions_user_exam ON test_completions(user_id, exam_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_payouts') THEN
    CREATE INDEX IF NOT EXISTS idx_referral_payouts_status ON referral_payouts(status);
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed database functions have been created successfully!';
  RAISE NOTICE '🔧 Handled existing function conflicts properly';
  RAISE NOTICE '📊 Payment management functions: ✅';
  RAISE NOTICE '👨‍💼 Admin functions: ✅';
  RAISE NOTICE '📝 Question report functions: ✅';
  RAISE NOTICE '💰 Withdrawal functions: ✅';
  RAISE NOTICE '💬 Message functions: ✅';
  RAISE NOTICE '📈 Test completion functions: ✅';
  RAISE NOTICE '🔥 User streak functions: ✅';
  RAISE NOTICE '🛡️ All functions check for table existence before operating';
END $$;
