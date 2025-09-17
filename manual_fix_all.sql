-- Manual fix for all missing connections and commissions
-- This will create the missing connections and process all commissions

-- Step 1: Create referral transactions for all users who made payments but don't have them
SELECT '=== CREATING MISSING REFERRAL TRANSACTIONS ===' as step;

-- Find users who made payments but don't have referral transactions
WITH users_with_payments_no_referrals AS (
  SELECT DISTINCT p.user_id, p.plan, p.amount, p.created_at
  FROM payments p
  WHERE p.status IN ('verified', 'paid', 'completed')
  AND NOT EXISTS (
    SELECT 1 FROM referral_transactions rt 
    WHERE rt.referred_id = p.user_id
  )
)
-- Create referral transactions for these users
INSERT INTO referral_transactions (
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
)
SELECT 
  gen_random_uuid() as id,
  'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb' as referrer_id,
  uwp.user_id as referred_id,
  'AD1CFF7D' as referral_code,
  0.00 as amount,
  'referral_signup' as transaction_type,
  'pending' as status,
  0.00 as commission_amount,
  'pending' as commission_status,
  false as membership_purchased,
  true as first_membership_only,
  uwp.created_at as created_at,
  NOW() as updated_at
FROM users_with_payments_no_referrals uwp;

-- Show how many were created
SELECT 
  'Referral transactions created:' as info,
  COUNT(*) as count
FROM referral_transactions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 2: Process commissions for all users with payments
SELECT '=== PROCESSING COMMISSIONS FOR ALL USERS ===' as step;

-- Process commissions for each user who has a payment
WITH users_with_payments AS (
  SELECT DISTINCT p.user_id, p.id as payment_id, p.plan, p.amount
  FROM payments p
  WHERE p.status IN ('verified', 'paid', 'completed')
)
SELECT 
  'Processing commission for user:' as info,
  uwp.user_id,
  uwp.payment_id,
  uwp.plan,
  uwp.amount,
  process_membership_commission(
    uwp.user_id,
    uwp.payment_id,
    uwp.plan,
    uwp.amount::DECIMAL(10,2)
  ) as commission_result
FROM users_with_payments uwp
ORDER BY uwp.user_id;

-- Step 3: Check results
SELECT '=== FINAL RESULTS ===' as step;

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

-- Step 4: Check referral transactions after processing
SELECT '=== REFERRAL TRANSACTIONS AFTER PROCESSING ===' as step;
SELECT 
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
