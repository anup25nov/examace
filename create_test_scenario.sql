-- Create a complete test scenario to verify the referral system works
-- This will create a referrer, a referred user, a payment, and process commission

-- Step 1: Clean up any existing test data
SELECT '=== CLEANING UP TEST DATA ===' as step;

-- Delete any existing test data
DELETE FROM referral_commissions WHERE referred_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM referral_transactions WHERE referred_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM memberships WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM payments WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM referral_codes WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM user_profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Step 2: Create test referrer
SELECT '=== CREATING TEST REFERRER ===' as step;

INSERT INTO user_profiles (id, phone, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '+919876543210',
  NOW(),
  NOW()
);

INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings, is_active, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'TEST123',
  0,
  0.00,
  true,
  NOW(),
  NOW()
);

-- Step 3: Create test referred user
SELECT '=== CREATING TEST REFERRED USER ===' as step;

INSERT INTO user_profiles (id, phone, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '+919876543211',
  NOW(),
  NOW()
);

-- Step 4: Create referral transaction
SELECT '=== CREATING REFERRAL TRANSACTION ===' as step;

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
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'TEST123',
  0.00,
  'referral_signup',
  'pending',
  0.00,
  'pending',
  false,
  true,
  NOW(),
  NOW()
);

-- Step 5: Create test payment
SELECT '=== CREATING TEST PAYMENT ===' as step;

INSERT INTO payments (
  id,
  user_id,
  plan,
  amount,
  currency,
  status,
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
  created_at,
  paid_at
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'pro',
  1.00,
  'INR',
  'verified',
  'test_razorpay_payment_123',
  'test_razorpay_order_456',
  'test_signature_789',
  NOW(),
  NOW()
);

-- Step 6: Create test membership
SELECT '=== CREATING TEST MEMBERSHIP ===' as step;

INSERT INTO memberships (
  id,
  user_id,
  plan,
  start_date,
  end_date,
  created_at
)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  'pro',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW()
);

-- Step 7: Test commission processing
SELECT '=== TESTING COMMISSION PROCESSING ===' as step;

SELECT 
  'Commission Processing Test:' as info,
  *
FROM process_membership_commission(
  '22222222-2222-2222-2222-222222222222'::UUID,
  '44444444-4444-4444-4444-444444444444'::UUID,
  'pro',
  1.00
);

-- Step 8: Check results
SELECT '=== CHECKING RESULTS ===' as step;

-- Check referral transaction after processing
SELECT 
  'Referral Transaction After Processing:' as info,
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
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Check if commission was created
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
WHERE referred_id = '22222222-2222-2222-2222-222222222222';

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
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Check referral stats
SELECT 
  'Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('11111111-1111-1111-1111-111111111111');

-- Step 9: Clean up test data
SELECT '=== CLEANING UP TEST DATA ===' as step;

DELETE FROM referral_commissions WHERE referred_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM referral_transactions WHERE id = '33333333-3333-3333-3333-333333333333';
DELETE FROM memberships WHERE id = '55555555-5555-5555-5555-555555555555';
DELETE FROM payments WHERE id = '44444444-4444-4444-4444-444444444444';
DELETE FROM referral_codes WHERE user_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM user_profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

SELECT 'Test completed and cleaned up!' as result;
