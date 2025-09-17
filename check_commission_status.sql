-- Check the current status of the commission record
-- The manual calculation shows 0 referrals, so something went wrong

-- Step 1: Check all commission records
SELECT '=== ALL COMMISSION RECORDS ===' as step;

SELECT 
  'All commissions:' as info,
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

-- Step 2: Check commission for the specific referred user
SELECT '=== COMMISSION FOR REFERRED USER ===' as step;

SELECT 
  'Commission for referred user:' as info,
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
ORDER BY created_at DESC;

-- Step 3: Check if there are any commissions for the referrer
SELECT '=== COMMISSIONS FOR REFERRER ===' as step;

SELECT 
  'Commissions for referrer:' as info,
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

-- Step 4: Check referral_transactions
SELECT '=== REFERRAL_TRANSACTIONS ===' as step;

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

-- Step 5: Check if the commission was created but with wrong referrer_id
SELECT '=== COMMISSION WITH WRONG REFERRER_ID ===' as step;

SELECT 
  'Commission with wrong referrer_id:' as info,
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
  AND referrer_id IS NOT NULL
ORDER BY created_at DESC;

-- Step 6: Check if there's a commission with null referrer_id
SELECT '=== COMMISSION WITH NULL REFERRER_ID ===' as step;

SELECT 
  'Commission with null referrer_id:' as info,
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
  AND referrer_id IS NULL
ORDER BY created_at DESC;
