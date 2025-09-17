-- Complete test script for referral flow
-- This will test the entire referral system end-to-end

-- Step 1: Create test users and referral relationship
SELECT '=== SETTING UP TEST DATA ===' as step;

-- Create a test referrer (if not exists)
INSERT INTO user_profiles (id, phone, created_at, updated_at)
VALUES (
  'test-referrer-123',
  '+919876543210',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a test referred user (if not exists)
INSERT INTO user_profiles (id, phone, created_at, updated_at)
VALUES (
  'test-referred-456',
  '+919876543211',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create referral code for referrer
INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings, is_active, created_at, updated_at)
VALUES (
  'test-referrer-123',
  'TEST123',
  0,
  0.00,
  true,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Create referral transaction
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
  'test-referral-txn-789',
  'test-referrer-123',
  'test-referred-456',
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
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create a test payment
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
  'test-payment-999',
  'test-referred-456',
  'pro',
  1.00,
  'INR',
  'verified',
  'test_razorpay_payment_123',
  'test_razorpay_order_456',
  'test_signature_789',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Create a test membership
SELECT '=== CREATING TEST MEMBERSHIP ===' as step;

INSERT INTO memberships (
  id,
  user_id,
  plan,
  start_date,
  end_date,
  status,
  created_at
)
VALUES (
  'test-membership-888',
  'test-referred-456',
  'pro',
  NOW(),
  NOW() + INTERVAL '1 year',
  'active',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Test commission processing
SELECT '=== TESTING COMMISSION PROCESSING ===' as step;

SELECT 
  'Commission Processing Result:' as test_type,
  *
FROM process_membership_commission(
  'test-referred-456'::UUID,
  'test-payment-999'::UUID,
  'pro',
  1.00
);

-- Step 5: Check results
SELECT '=== CHECKING RESULTS ===' as step;

-- Check referral transaction after processing
SELECT 
  'Referral Transaction After:' as table_name,
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
WHERE id = 'test-referral-txn-789';

-- Check if commission was created
SELECT 
  'Referral Commissions:' as table_name,
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
WHERE referred_id = 'test-referred-456';

-- Check referrer's earnings
SELECT 
  'Referrer Earnings:' as table_name,
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active,
  created_at,
  updated_at
FROM referral_codes 
WHERE user_id = 'test-referrer-123';

-- Step 6: Test referral stats functions
SELECT '=== TESTING REFERRAL STATS FUNCTIONS ===' as step;

-- Test get_comprehensive_referral_stats
SELECT 
  'Comprehensive Stats:' as function_name,
  *
FROM get_comprehensive_referral_stats('test-referrer-123');

-- Test get_referral_network_detailed
SELECT 
  'Network Detailed:' as function_name,
  *
FROM get_referral_network_detailed('test-referrer-123');

-- Test get_user_referral_stats
SELECT 
  'User Referral Stats:' as function_name,
  *
FROM get_user_referral_stats('test-referrer-123');

-- Step 7: Cleanup test data
SELECT '=== CLEANUP TEST DATA ===' as step;

-- Delete test data
DELETE FROM referral_commissions WHERE referred_id = 'test-referred-456';
DELETE FROM referral_transactions WHERE id = 'test-referral-txn-789';
DELETE FROM memberships WHERE id = 'test-membership-888';
DELETE FROM payments WHERE id = 'test-payment-999';
DELETE FROM referral_codes WHERE user_id = 'test-referrer-123';
DELETE FROM user_profiles WHERE id IN ('test-referrer-123', 'test-referred-456');

SELECT 'Test completed and cleaned up!' as result;
