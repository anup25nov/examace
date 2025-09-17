-- Manual commission fix for the specific user
-- This will manually create the commission and update the referral transaction

-- Step 1: Get the payment data for the specific user
SELECT '=== GETTING PAYMENT DATA ===' as step;

WITH latest_payment AS (
  SELECT 
    id,
    plan,
    amount
  FROM payments 
  WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
  AND status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Payment Data:' as info,
  id as payment_id,
  plan,
  amount
FROM latest_payment;

-- Step 2: Manually create the commission
SELECT '=== MANUALLY CREATING COMMISSION ===' as step;

-- Calculate commission (50% of payment amount)
WITH latest_payment AS (
  SELECT 
    id,
    plan,
    amount
  FROM payments 
  WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
  AND status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
),
commission_amount AS (
  SELECT (amount * 0.50) as commission
  FROM latest_payment
)
-- Create commission record
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
)
SELECT 
  gen_random_uuid() as id,
  'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb' as referrer_id,
  'b2975c5b-c04b-4929-b8ac-9f3da1b155b8' as referred_id,
  lp.id as payment_id,
  ca.commission as commission_amount,
  50.00 as commission_percentage,
  lp.plan as membership_plan,
  lp.amount as membership_amount,
  'pending' as status,
  true as is_first_membership,
  NOW() as created_at,
  NOW() as updated_at
FROM latest_payment lp
CROSS JOIN commission_amount ca;

-- Step 3: Update the referral transaction
SELECT '=== UPDATING REFERRAL TRANSACTION ===' as step;

-- Update referral transaction to mark as completed
WITH latest_payment AS (
  SELECT 
    id,
    plan,
    amount
  FROM payments 
  WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
  AND status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE referral_transactions
SET 
  amount = COALESCE((SELECT amount FROM latest_payment), 0.00),
  transaction_type = 'membership',
  status = 'completed',
  commission_amount = COALESCE((SELECT amount * 0.50 FROM latest_payment), 0.00),
  commission_status = 'pending',
  membership_purchased = true,
  updated_at = NOW()
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Step 4: Update referrer's total earnings
SELECT '=== UPDATING REFERRER EARNINGS ===' as step;

-- Update referrer's total earnings
WITH latest_payment AS (
  SELECT 
    amount
  FROM payments 
  WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
  AND status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE referral_codes
SET 
  total_earnings = total_earnings + (SELECT amount * 0.50 FROM latest_payment),
  updated_at = NOW()
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 5: Check final results
SELECT '=== FINAL RESULTS ===' as step;

-- Check referral transaction after update
SELECT 
  'Referral Transaction After Update:' as info,
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
  first_membership_only,
  created_at,
  updated_at
FROM referral_transactions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Check commission created
SELECT 
  'Commission Created:' as info,
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
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Check referrer's earnings
SELECT 
  'Referrer Earnings:' as info,
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

-- Check referral stats
SELECT 
  'Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');