-- Fix commission processing to ensure it works automatically
-- This migration ensures commissions are processed correctly

-- 1. Create a simple function to manually process commission for existing users
CREATE OR REPLACE FUNCTION process_existing_user_commission(
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  payment_record RECORD;
  commission_result RECORD;
BEGIN
  -- Find the latest verified payment for this user
  SELECT * INTO payment_record
  FROM payments
  WHERE user_id = p_user_id
  AND status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No verified payment found for user', 0.00;
    RETURN;
  END IF;
  
  -- Process commission
  RETURN QUERY
  SELECT * FROM process_membership_commission(
    p_user_id,
    payment_record.id,
    payment_record.plan,
    payment_record.amount::DECIMAL(10,2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Grant execute permission
GRANT EXECUTE ON FUNCTION process_existing_user_commission(UUID) TO authenticated, anon;

-- 3. Create a function to check if commission processing is needed
CREATE OR REPLACE FUNCTION check_commission_status(
  p_user_id UUID
)
RETURNS TABLE (
  has_payment BOOLEAN,
  has_commission BOOLEAN,
  has_referral BOOLEAN,
  payment_id UUID,
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  payment_count INTEGER;
  commission_count INTEGER;
  referral_count INTEGER;
  latest_payment_id UUID;
  total_commission DECIMAL(10,2);
BEGIN
  -- Check if user has verified payments
  SELECT COUNT(*), MAX(id) INTO payment_count, latest_payment_id
  FROM payments
  WHERE user_id = p_user_id
  AND status IN ('verified', 'paid', 'completed');
  
  -- Check if user has commissions
  SELECT COUNT(*), COALESCE(SUM(commission_amount), 0) INTO commission_count, total_commission
  FROM referral_commissions
  WHERE referred_id = p_user_id;
  
  -- Check if user has referral transaction
  SELECT COUNT(*) INTO referral_count
  FROM referral_transactions
  WHERE referred_id = p_user_id;
  
  RETURN QUERY
  SELECT 
    (payment_count > 0) as has_payment,
    (commission_count > 0) as has_commission,
    (referral_count > 0) as has_referral,
    latest_payment_id as payment_id,
    total_commission as commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION check_commission_status(UUID) TO authenticated, anon;

-- 5. Create a function to fix all pending commissions
CREATE OR REPLACE FUNCTION fix_all_pending_commissions()
RETURNS TABLE (
  user_id UUID,
  success BOOLEAN,
  message TEXT,
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  user_record RECORD;
  commission_result RECORD;
BEGIN
  -- Find all users who have payments but no commissions
  FOR user_record IN
    SELECT DISTINCT p.user_id
    FROM payments p
    WHERE p.status IN ('verified', 'paid', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM referral_commissions rc 
      WHERE rc.referred_id = p.user_id
    )
    AND EXISTS (
      SELECT 1 FROM referral_transactions rt 
      WHERE rt.referred_id = p.user_id 
      AND rt.status = 'pending'
    )
  LOOP
    -- Process commission for this user
    SELECT * INTO commission_result
    FROM process_existing_user_commission(user_record.user_id);
    
    RETURN QUERY
    SELECT 
      user_record.user_id,
      commission_result.success,
      commission_result.message,
      commission_result.commission_amount;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION fix_all_pending_commissions() TO authenticated, anon;
