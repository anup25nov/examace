-- Create missing process_referral_commission function
-- Run this in your Supabase SQL Editor

-- 1. Check what functions exist
SELECT '=== CHECKING EXISTING FUNCTIONS ===' as step;

SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%referral%' OR routine_name LIKE '%commission%'
ORDER BY routine_name;

-- 2. Create process_referral_commission function
SELECT '=== CREATING PROCESS_REFERRAL_COMMISSION FUNCTION ===' as step;

CREATE OR REPLACE FUNCTION process_referral_commission(
  p_user_id UUID,
  p_payment_id UUID,
  p_membership_plan VARCHAR(50),
  p_membership_amount DECIMAL(10,2)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  v_referrer_id UUID;
  v_commission_rate DECIMAL(5,4);
  v_commission_amount DECIMAL(10,2);
  v_referral_code_value VARCHAR(20);
BEGIN
  -- Get referrer_id from referral_transactions
  SELECT rt.referrer_id, rt.referral_code
  INTO v_referrer_id, v_referral_code_value
  FROM referral_transactions rt
  WHERE rt.referred_id = p_user_id
  AND rt.membership_purchased = false
  ORDER BY rt.created_at DESC
  LIMIT 1;

  -- If no referrer found, return success but no commission
  IF v_referrer_id IS NULL THEN
    RETURN QUERY SELECT false, 'No referrer found for user', 0.00;
    RETURN;
  END IF;

  -- Set commission rate (10% for pro, 15% for pro_plus)
  v_commission_rate := CASE 
    WHEN p_membership_plan = 'pro_plus' THEN 0.15
    ELSE 0.10
  END;

  -- Calculate commission amount
  v_commission_amount := p_membership_amount * v_commission_rate;

  -- Update referral_transaction to mark membership as purchased
  UPDATE referral_transactions
  SET 
    amount = p_membership_amount,
    commission_amount = v_commission_amount,
    commission_status = 'pending',
    membership_purchased = true,
    updated_at = NOW()
  WHERE referred_id = p_user_id
  AND referrer_id = v_referrer_id
  AND membership_purchased = false;

  -- Insert commission record
  INSERT INTO referral_commissions (
    referrer_id,
    referred_id,
    amount,
    commission_amount,
    commission_rate,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_referrer_id,
    p_user_id,
    p_membership_amount,
    v_commission_amount,
    v_commission_rate,
    'pending',
    NOW(),
    NOW()
  );

  -- Update referral_codes total_earnings
  UPDATE referral_codes
  SET 
    total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
    updated_at = NOW()
  WHERE user_id = v_referrer_id;

  RETURN QUERY SELECT true, 'Commission processed successfully', v_commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Test the function
SELECT '=== TESTING PROCESS_REFERRAL_COMMISSION ===' as step;

SELECT * FROM process_referral_commission(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  '9e508576-f73c-4d53-9c8d-9119b2d6224c'::UUID,
  'pro_plus',
  2.00
);

-- 4. Check results
SELECT '=== CHECKING RESULTS ===' as step;

-- Check referral_transactions
SELECT * FROM referral_transactions 
WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY created_at DESC;

-- Check referral_commissions
SELECT * FROM referral_commissions 
WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY created_at DESC;

-- Check referral_codes
SELECT * FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';

SELECT 'Function created and tested successfully!' as status;
