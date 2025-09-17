-- Fix commission processing permanently
-- This migration ensures commissions are created with correct referrer_id

-- Step 1: Drop and recreate the process_membership_commission function with proper referrer_id handling
DROP FUNCTION IF EXISTS process_membership_commission(UUID);

CREATE OR REPLACE FUNCTION process_membership_commission(p_payment_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  commission_amount DECIMAL(10,2)
) 
LANGUAGE plpgsql
AS $$
DECLARE
  payment_record RECORD;
  referrer_id_val UUID;
  referral_code_val TEXT;
  commission_amount_val DECIMAL(10,2);
  commission_percentage_val DECIMAL(5,2);
  membership_plan_val TEXT;
  membership_amount_val DECIMAL(10,2);
  is_first_membership_val BOOLEAN;
  commission_id UUID;
BEGIN
  -- Get payment details
  SELECT 
    p.user_id,
    p.plan,
    p.amount,
    p.currency,
    p.status
  INTO payment_record
  FROM payments p
  WHERE p.id = p_payment_id;
  
  -- Check if payment exists and is successful
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Payment not found', 0.00;
    RETURN;
  END IF;
  
  IF payment_record.status != 'completed' THEN
    RETURN QUERY SELECT false, 'Payment not completed', 0.00;
    RETURN;
  END IF;
  
  -- Find referrer through referral_transactions
  SELECT 
    rt.referrer_id,
    rt.referral_code,
    rt.amount,
    rt.commission_amount,
    rt.first_membership_only
  INTO 
    referrer_id_val,
    referral_code_val,
    membership_amount_val,
    commission_amount_val,
    is_first_membership_val
  FROM referral_transactions rt
  WHERE rt.referred_id = payment_record.user_id
    AND rt.transaction_type = 'membership'
    AND rt.status = 'completed'
  ORDER BY rt.created_at DESC
  LIMIT 1;
  
  -- Check if referral exists
  IF referrer_id_val IS NULL THEN
    RETURN QUERY SELECT false, 'No referral found, no commission to process', 0.00;
    RETURN;
  END IF;
  
  -- Check if commission already exists
  IF EXISTS (
    SELECT 1 FROM referral_commissions 
    WHERE referred_id = payment_record.user_id 
      AND referrer_id = referrer_id_val
  ) THEN
    RETURN QUERY SELECT false, 'Commission already exists', 0.00;
    RETURN;
  END IF;
  
  -- Set commission details
  membership_plan_val := payment_record.plan;
  commission_percentage_val := 50.00; -- 50% commission rate
  
  -- Create commission record
  commission_id := gen_random_uuid();
  
  INSERT INTO referral_commissions (
    id,
    referrer_id,
    referred_id,
    payment_id,
    commission_amount,
    commission_percentage,
    membership_plan,
    membership_amount,
    status,
    is_first_membership,
    created_at,
    updated_at
  ) VALUES (
    commission_id,
    referrer_id_val,
    payment_record.user_id,
    p_payment_id,
    commission_amount_val,
    commission_percentage_val,
    membership_plan_val,
    membership_amount_val,
    'pending',
    is_first_membership_val,
    NOW(),
    NOW()
  );
  
  -- Update referral_codes table with new earnings
  UPDATE referral_codes
  SET 
    total_earnings = (
      SELECT COALESCE(SUM(commission_amount), 0.00)
      FROM referral_commissions 
      WHERE referrer_id = referrer_id_val
    ),
    updated_at = NOW()
  WHERE user_id = referrer_id_val;
  
  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount_val;
END;
$$;

-- Step 2: Create a trigger to automatically update referral_codes when commissions are created
CREATE OR REPLACE FUNCTION update_referral_codes_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update referral_codes table when a new commission is created
  UPDATE referral_codes
  SET 
    total_earnings = (
      SELECT COALESCE(SUM(commission_amount), 0.00)
      FROM referral_commissions 
      WHERE referrer_id = NEW.referrer_id
    ),
    updated_at = NOW()
  WHERE user_id = NEW.referrer_id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_referral_codes_earnings ON referral_commissions;

-- Create trigger
CREATE TRIGGER trigger_update_referral_codes_earnings
  AFTER INSERT OR UPDATE ON referral_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_codes_earnings();

-- Step 3: Create a function to fix existing commissions with missing referrer_id
CREATE OR REPLACE FUNCTION fix_existing_commissions()
RETURNS TABLE(
  fixed_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  fixed_count_val INTEGER := 0;
  commission_record RECORD;
BEGIN
  -- Fix commissions with NULL referrer_id
  FOR commission_record IN
    SELECT 
      rc.id,
      rc.referred_id,
      rt.referrer_id,
      rt.referral_code,
      rt.amount,
      rt.commission_amount
    FROM referral_commissions rc
    LEFT JOIN referral_transactions rt ON rc.referred_id = rt.referred_id
    WHERE rc.referrer_id IS NULL
      AND rt.referrer_id IS NOT NULL
      AND rt.transaction_type = 'membership'
      AND rt.status = 'completed'
  LOOP
    -- Update commission with correct referrer_id
    UPDATE referral_commissions
    SET 
      referrer_id = commission_record.referrer_id,
      updated_at = NOW()
    WHERE id = commission_record.id;
    
    fixed_count_val := fixed_count_val + 1;
  END LOOP;
  
  -- Update all referral_codes tables
  UPDATE referral_codes
  SET 
    total_earnings = (
      SELECT COALESCE(SUM(commission_amount), 0.00)
      FROM referral_commissions 
      WHERE referrer_id = referral_codes.user_id
    ),
    updated_at = NOW();
  
  RETURN QUERY SELECT fixed_count_val, 'Fixed ' || fixed_count_val || ' commissions';
END;
$$;

-- Step 4: Run the fix function
SELECT * FROM fix_existing_commissions();
