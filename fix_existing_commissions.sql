-- Fix commissions for existing data
-- This will process commissions for all existing referrals who made payments

-- Step 1: Check what we have
SELECT '=== CURRENT STATE ===' as step;

-- Check referral code owner
SELECT 
  'Referral Code Owner:' as info,
  user_id,
  code,
  total_referrals,
  total_earnings
FROM referral_codes 
WHERE code = 'AD1CFF7D';

-- Check all referral transactions
SELECT 
  'All Referral Transactions:' as info,
  id,
  referrer_id,
  referred_id,
  referral_code,
  status,
  membership_purchased,
  created_at
FROM referral_transactions 
ORDER BY created_at DESC;

-- Check all payments
SELECT 
  'All Payments:' as info,
  id,
  user_id,
  plan,
  amount,
  status,
  created_at
FROM payments 
WHERE status IN ('verified', 'paid', 'completed')
ORDER BY created_at DESC;

-- Step 2: Find users who have both referral transactions and payments
SELECT '=== USERS WITH BOTH REFERRAL TRANSACTIONS AND PAYMENTS ===' as step;

SELECT 
  rt.referred_id,
  rt.referrer_id,
  rt.referral_code,
  rt.status as referral_status,
  rt.membership_purchased,
  rt.created_at as referral_date,
  p.id as payment_id,
  p.plan,
  p.amount,
  p.status as payment_status,
  p.created_at as payment_date
FROM referral_transactions rt
INNER JOIN payments p ON rt.referred_id = p.user_id
WHERE p.status IN ('verified', 'paid', 'completed')
ORDER BY rt.created_at DESC;

-- Step 3: Process commissions for users who have both referral transactions and payments
SELECT '=== PROCESSING COMMISSIONS ===' as step;

-- Process commissions for each user who has both referral transaction and payment
WITH users_with_both AS (
  SELECT 
    rt.referred_id,
    rt.referrer_id,
    p.id as payment_id,
    p.plan,
    p.amount
  FROM referral_transactions rt
  INNER JOIN payments p ON rt.referred_id = p.user_id
  WHERE p.status IN ('verified', 'paid', 'completed')
)
SELECT 
  'Processing commission for user:' as info,
  uwb.referred_id,
  uwb.payment_id,
  uwb.plan,
  uwb.amount,
  process_membership_commission(
    uwb.referred_id,
    uwb.payment_id,
    uwb.plan,
    uwb.amount::DECIMAL(10,2)
  ) as commission_result
FROM users_with_both uwb
ORDER BY uwb.referred_id;

-- Step 4: Check results after processing
SELECT '=== RESULTS AFTER PROCESSING ===' as step;

-- Check total commissions
SELECT 
  'Total Commissions:' as info,
  COUNT(*) as total_commissions,
  SUM(commission_amount) as total_amount
FROM referral_commissions;

-- Check referral stats
SELECT 
  'Updated Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Check specific commissions created
SELECT 
  'Commissions Created:' as info,
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
ORDER BY created_at DESC;
