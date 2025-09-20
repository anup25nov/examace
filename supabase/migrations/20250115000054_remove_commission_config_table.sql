-- Remove commission_config table and update functions to use constants
-- This migration removes the database table approach and uses application constants instead

-- 1. Drop the commission_config table
DROP TABLE IF EXISTS commission_config;

-- 2. Drop the functions that depend on the table
DROP FUNCTION IF EXISTS get_commission_config(VARCHAR(50));
DROP FUNCTION IF EXISTS update_commission_config(VARCHAR(50), DECIMAL(10,2));
DROP FUNCTION IF EXISTS get_all_commission_config();

-- 3. Update the process_referral_commission function to use constants
CREATE OR REPLACE FUNCTION process_referral_commission(
  p_user_id UUID,
  p_payment_id VARCHAR(100),
  p_membership_plan VARCHAR(50),
  p_membership_amount DECIMAL(10,2)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  referral_record RECORD;
  commission_amount DECIMAL(10,2) := 0.00;
  commission_percentage DECIMAL(5,2) := 50.00; -- 50% commission constant
  minimum_withdrawal DECIMAL(10,2) := 100.00; -- Minimum withdrawal constant
BEGIN
  -- Debug: Log the input parameters
  RAISE NOTICE 'Processing commission for user: %, payment: %, plan: %, amount: %', 
    p_user_id, p_payment_id, p_membership_plan, p_membership_amount;
  
  -- Find the referral transaction for this user
  SELECT * INTO referral_record
  FROM referral_transactions
  WHERE referred_id = p_user_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No pending referral found for user: %', p_user_id;
    RETURN QUERY SELECT true, 'No referral found, no commission to process', 0.00;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found referral record: %, referrer: %', referral_record.id, referral_record.referrer_id;
  
  -- Calculate commission amount
  commission_amount := (p_membership_amount * commission_percentage) / 100;
  
  -- Check if commission meets minimum withdrawal requirement
  IF commission_amount < minimum_withdrawal THEN
    RAISE NOTICE 'Commission amount % is below minimum withdrawal %', commission_amount, minimum_withdrawal;
    RETURN QUERY SELECT true, 'Commission amount below minimum withdrawal threshold', 0.00;
    RETURN;
  END IF;
  
  -- Update referral transaction status
  UPDATE referral_transactions
  SET status = 'completed',
      commission_amount = commission_amount,
      completed_at = NOW()
  WHERE id = referral_record.id;
  
  -- Create commission record
  INSERT INTO referral_commissions (
    referrer_id,
    referred_id,
    payment_id,
    membership_plan,
    membership_amount,
    commission_amount,
    commission_percentage,
    status,
    created_at
  ) VALUES (
    referral_record.referrer_id,
    p_user_id,
    p_payment_id,
    p_membership_plan,
    p_membership_amount,
    commission_amount,
    commission_percentage,
    'pending',
    NOW()
  );
  
  RAISE NOTICE 'Commission processed successfully: %', commission_amount;
  
  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a function to get commission constants (for reference)
CREATE OR REPLACE FUNCTION get_commission_constants()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'commission_percentage', 50.00,
    'minimum_withdrawal', 100.00,
    'maximum_withdrawal', 10000.00,
    'processing_fee', 0.00,
    'tax_deduction', 0.00,
    'first_time_bonus', 0.00,
    'max_daily_withdrawals', 5,
    'withdrawal_processing_days', 3,
    'referral_code_length', 8,
    'referral_code_prefix', 'S2S'
  );
END;
$$ LANGUAGE plpgsql;
