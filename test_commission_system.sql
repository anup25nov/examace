-- Test Referral Commission System
-- Run this script in your Supabase SQL Editor after applying the commission system

-- Step 1: Create test users (U1 and U2)
-- Note: In real scenario, these would be created through the app signup process

-- First, let's check if we have any existing test data
SELECT '=== CLEANING UP EXISTING TEST DATA ===' as step;

-- Clean up test data (be careful in production!)
DELETE FROM referral_commissions WHERE referrer_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%' OR phone LIKE '%999%'
);
DELETE FROM referral_transactions WHERE referrer_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%' OR phone LIKE '%999%'
);
DELETE FROM referral_codes WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%' OR phone LIKE '%999%'
);
DELETE FROM user_profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%' OR phone LIKE '%999%'
);
DELETE FROM auth.users WHERE email LIKE '%test%' OR phone LIKE '%999%';

-- Step 2: Create U1 (referrer) - this would normally be done through app signup
SELECT '=== CREATING U1 (REFERRER) ===' as step;

-- Insert U1 into auth.users (simulating signup)
INSERT INTO auth.users (
  id, 
  email, 
  phone, 
  email_confirmed_at, 
  phone_confirmed_at, 
  created_at, 
  updated_at,
  aud,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'u1@test.com',
  '+919999999991',
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- Create U1 profile
INSERT INTO user_profiles (
  id, 
  phone, 
  membership_status, 
  membership_plan, 
  created_at, 
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '+919999999991',
  'free',
  'free',
  NOW(),
  NOW()
);

-- Create U1 referral code
INSERT INTO referral_codes (
  user_id, 
  code, 
  total_referrals, 
  total_earnings, 
  is_active, 
  created_at, 
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'U1REF001',
  0,
  0.00,
  true,
  NOW(),
  NOW()
);

-- Step 3: Create U2 (referred user) - this would normally be done through app signup
SELECT '=== CREATING U2 (REFERRED USER) ===' as step;

-- Insert U2 into auth.users
INSERT INTO auth.users (
  id, 
  email, 
  phone, 
  email_confirmed_at, 
  phone_confirmed_at, 
  created_at, 
  updated_at,
  aud,
  role
) VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  'u2@test.com',
  '+919999999992',
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- Create U2 profile
INSERT INTO user_profiles (
  id, 
  phone, 
  membership_status, 
  membership_plan, 
  referred_by,
  created_at, 
  updated_at
) VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '+919999999992',
  'free',
  'free',
  'U1REF001',
  NOW(),
  NOW()
);

-- Create U2 referral code
INSERT INTO referral_codes (
  user_id, 
  code, 
  total_referrals, 
  total_earnings, 
  is_active, 
  created_at, 
  updated_at
) VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  'U2REF001',
  0,
  0.00,
  true,
  NOW(),
  NOW()
);

-- Step 4: Apply referral code (simulating U2 using U1's referral code during signup)
SELECT '=== APPLYING REFERRAL CODE ===' as step;

-- This would normally be called through the app when U2 enters U1's referral code
SELECT * FROM apply_referral_code(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'U1REF001'
);

-- Step 5: Check referral relationship was created
SELECT '=== CHECKING REFERRAL RELATIONSHIP ===' as step;

SELECT 
  rt.id,
  rt.referrer_id,
  rt.referred_id,
  rt.referral_code,
  rt.status,
  rt.first_membership_only,
  up1.phone as referrer_phone,
  up2.phone as referred_phone
FROM referral_transactions rt
LEFT JOIN user_profiles up1 ON rt.referrer_id = up1.id
LEFT JOIN user_profiles up2 ON rt.referred_id = up2.id
WHERE rt.referrer_id = '11111111-1111-1111-1111-111111111111'::uuid
AND rt.referred_id = '22222222-2222-2222-2222-222222222222'::uuid;

-- Step 6: Simulate U2 purchasing membership (₹2 pro plan)
SELECT '=== SIMULATING MEMBERSHIP PURCHASE ===' as step;

-- Create membership for U2
INSERT INTO user_memberships (
  id,
  user_id, 
  plan_id, 
  status, 
  start_date, 
  end_date, 
  payment_id,
  created_at, 
  updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'pro',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  'test_payment_123',
  NOW(),
  NOW()
);

-- Create membership transaction
INSERT INTO membership_transactions (
  id,
  user_id, 
  membership_id, 
  transaction_id, 
  amount, 
  currency, 
  status,
  created_at, 
  updated_at
) VALUES (
  '44444444-4444-4444-4444-444444444444'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'test_payment_123',
  2.00,
  'INR',
  'completed',
  NOW(),
  NOW()
);

-- Step 7: Process commission (this would normally be called by the payment verification function)
SELECT '=== PROCESSING COMMISSION ===' as step;

SELECT * FROM process_referral_commission(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'test_payment_123',
  'pro',
  2.00
);

-- Step 8: Check commission was created
SELECT '=== CHECKING COMMISSION CREATION ===' as step;

SELECT 
  rc.id,
  rc.referrer_id,
  rc.referred_id,
  rc.payment_id,
  rc.commission_amount,
  rc.commission_percentage,
  rc.membership_plan,
  rc.membership_amount,
  rc.status,
  rc.is_first_membership,
  up1.phone as referrer_phone,
  up2.phone as referred_phone
FROM referral_commissions rc
LEFT JOIN user_profiles up1 ON rc.referrer_id = up1.id
LEFT JOIN user_profiles up2 ON rc.referred_id = up2.id
WHERE rc.referrer_id = '11111111-1111-1111-1111-111111111111'::uuid
AND rc.referred_id = '22222222-2222-2222-2222-222222222222'::uuid;

-- Step 9: Check U1's referral stats
SELECT '=== CHECKING U1 REFERRAL STATS ===' as step;

SELECT * FROM get_user_referral_stats('11111111-1111-1111-1111-111111111111'::uuid);

-- Step 10: Check U1's commission history
SELECT '=== CHECKING U1 COMMISSION HISTORY ===' as step;

SELECT * FROM get_user_commission_history('11111111-1111-1111-1111-111111111111'::uuid);

-- Step 11: Test withdrawal request
SELECT '=== TESTING WITHDRAWAL REQUEST ===' as step;

SELECT * FROM request_commission_withdrawal(
  '11111111-1111-1111-1111-111111111111'::uuid,
  1.00,
  'bank_transfer'
);

-- Step 12: Check withdrawal was created
SELECT '=== CHECKING WITHDRAWAL CREATION ===' as step;

SELECT 
  rp.id,
  rp.user_id,
  rp.amount,
  rp.status,
  rp.payment_method,
  up.phone
FROM referral_payouts rp
LEFT JOIN user_profiles up ON rp.user_id = up.id
WHERE rp.user_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Step 13: Final verification - check all data
SELECT '=== FINAL VERIFICATION ===' as step;

-- Check U1's updated stats
SELECT 'U1 Final Stats:' as info;
SELECT * FROM get_user_referral_stats('11111111-1111-1111-1111-111111111111'::uuid);

-- Check referral transaction status
SELECT 'Referral Transaction Status:' as info;
SELECT 
  rt.status,
  rt.commission_amount,
  rt.commission_status,
  rt.membership_purchased
FROM referral_transactions rt
WHERE rt.referrer_id = '11111111-1111-1111-1111-111111111111'::uuid
AND rt.referred_id = '22222222-2222-2222-2222-222222222222'::uuid;

-- Check commission status
SELECT 'Commission Status:' as info;
SELECT 
  rc.status,
  rc.commission_amount,
  rc.membership_amount,
  rc.commission_percentage
FROM referral_commissions rc
WHERE rc.referrer_id = '11111111-1111-1111-1111-111111111111'::uuid;

SELECT '=== TEST COMPLETED SUCCESSFULLY! ===' as step;
