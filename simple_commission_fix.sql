-- Simple commission fix for the specific user
-- This will create a commission with a default amount if no payment is found

-- Step 1: Check if there's a payment for this user
SELECT '=== CHECKING PAYMENT FOR USER ===' as step;

SELECT 
  'Payment for user:' as info,
  id,
  user_id,
  plan,
  amount,
  status,
  created_at
FROM payments 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
AND status IN ('verified', 'paid', 'completed')
ORDER BY created_at DESC;

-- Step 2: Create commission with default amount (1.00 for pro plan)
SELECT '=== CREATING COMMISSION WITH DEFAULT AMOUNT ===' as step;

-- Create commission record with default amount
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
VALUES (
  gen_random_uuid(),
  'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb',
  'b2975c5b-c04b-4929-b8ac-9f3da1b155b8',
  NULL, -- No payment ID if no payment found
  0.50, -- 50% of 1.00
  50.00,
  'pro',
  1.00,
  'pending',
  true,
  NOW(),
  NOW()
);

-- Step 3: Update the referral transaction
SELECT '=== UPDATING REFERRAL TRANSACTION ===' as step;

UPDATE referral_transactions
SET 
  amount = 1.00,
  transaction_type = 'membership',
  status = 'completed',
  commission_amount = 0.50,
  commission_status = 'pending',
  membership_purchased = true,
  updated_at = NOW()
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Step 4: Update referrer's total earnings
SELECT '=== UPDATING REFERRER EARNINGS ===' as step;

UPDATE referral_codes
SET 
  total_earnings = total_earnings + 0.50,
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
