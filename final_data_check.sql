-- Final check of all data to understand why stats show 0.00
-- The commission exists but stats function shows 0.00

-- Step 1: Check referral_codes table
SELECT '=== REFERRAL_CODES TABLE ===' as step;

SELECT 
  'Referral codes:' as info,
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

-- Step 2: Check referral_commissions table
SELECT '=== REFERRAL_COMMISSIONS TABLE ===' as step;

SELECT 
  'Referral commissions:' as info,
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
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb'
ORDER BY created_at DESC;

-- Step 3: Check referral_transactions table
SELECT '=== REFERRAL_TRANSACTIONS TABLE ===' as step;

SELECT 
  'Referral transactions:' as info,
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
  created_at
FROM referral_transactions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb'
ORDER BY created_at DESC;

-- Step 4: Check payments table
SELECT '=== PAYMENTS TABLE ===' as step;

SELECT 
  'Payments:' as info,
  id,
  user_id,
  plan,
  amount,
  currency,
  status,
  razorpay_payment_id,
  created_at
FROM payments 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Step 5: Check memberships table
SELECT '=== MEMBERSHIPS TABLE ===' as step;

SELECT 
  'Memberships:' as info,
  *
FROM memberships 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Step 6: Manual calculation of what stats should be
SELECT '=== MANUAL CALCULATION ===' as step;

SELECT 
  'Manual calculation:' as info,
  COUNT(*) as total_referrals,
  SUM(commission_amount) as total_commissions_earned,
  SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_commissions,
  SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_commissions,
  SUM(CASE WHEN status = 'cancelled' THEN commission_amount ELSE 0 END) as cancelled_commissions
FROM referral_commissions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 7: Check if there's a mismatch in user IDs
SELECT '=== USER ID MISMATCH CHECK ===' as step;

SELECT 
  'User ID mismatch check:' as info,
  'Referral codes user_id:' as field1,
  rc.user_id as value1,
  'Commissions referrer_id:' as field2,
  rc2.referrer_id as value2,
  'Transactions referrer_id:' as field3,
  rt.referrer_id as value3
FROM referral_codes rc
LEFT JOIN referral_commissions rc2 ON rc.user_id = rc2.referrer_id
LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
WHERE rc.user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';
