-- Direct test of the commission function
-- This will help us verify the function works correctly

-- First, let's check if the function exists and what it expects
SELECT 
  'Function Information:' as info,
  routine_name,
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters 
WHERE specific_name = (
  SELECT specific_name 
  FROM information_schema.routines 
  WHERE routine_name = 'process_membership_commission'
  AND routine_type = 'FUNCTION'
)
ORDER BY ordinal_position;

-- Test with the actual user data
SELECT '=== TESTING WITH ACTUAL USER DATA ===' as test_type;

-- Get the latest payment for the specific user
WITH latest_payment AS (
  SELECT 
    id,
    plan,
    amount,
    status,
    created_at
  FROM payments 
  WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Latest Payment:' as info,
  *
FROM latest_payment;

-- Test the commission function with actual data
WITH latest_payment AS (
  SELECT 
    id,
    plan,
    amount
  FROM payments 
  WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Commission Function Test:' as test_type,
  *
FROM process_membership_commission(
  'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'::UUID,
  (SELECT id FROM latest_payment),
  (SELECT plan FROM latest_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_payment)
);

-- Check the referral transaction before processing
SELECT 
  'Referral Transaction Before:' as info,
  id,
  referrer_id,
  referred_id,
  referral_code,
  amount,
  transaction_type,
  status,
  commission_amount,
  commission_status,
  membership_purchased,
  first_membership_only
FROM referral_transactions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Check if any commission records exist
SELECT 
  'Existing Commissions:' as info,
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
  created_at
FROM referral_commissions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
OR referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Check referrer's current earnings
SELECT 
  'Referrer Current Earnings:' as info,
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active,
  created_at,
  updated_at
FROM referral_codes 
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';
