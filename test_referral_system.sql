-- Test script to verify referral system is working
-- This script creates test data to verify the referral commission system

-- 1. Create a test referrer user
INSERT INTO auth.users (id, phone, email_confirmed_at, phone_confirmed_at, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '+919876543210',
  NOW(),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Create user profile for referrer
INSERT INTO user_profiles (id, phone, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '+919876543210',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Create referral code for referrer
INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'TESTREF1',
  0,
  0.00,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 4. Create a test referred user
INSERT INTO auth.users (id, phone, email_confirmed_at, phone_confirmed_at, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '+919876543211',
  NOW(),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Create user profile for referred user
INSERT INTO user_profiles (id, phone, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '+919876543211',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. Apply referral code
SELECT * FROM validate_and_apply_referral_code(
  '22222222-2222-2222-2222-222222222222',
  'TESTREF1'
);

-- 7. Create a test payment for the referred user
INSERT INTO payments (user_id, plan, amount, currency, razorpay_order_id, status, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'pro',
  1,
  'INR',
  'order_test123',
  'completed',
  NOW(),
  NOW()
) ON CONFLICT (razorpay_order_id) DO NOTHING;

-- 8. Create membership for the referred user
INSERT INTO memberships (user_id, plan, start_date, end_date, mocks_used, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'pro',
  NOW(),
  NOW() + INTERVAL '1 year',
  0,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 9. Process commission
SELECT * FROM process_membership_commission(
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM payments WHERE razorpay_order_id = 'order_test123'),
  'pro',
  1.00
);

-- 10. Check results
SELECT 'Referral Stats:' as info;
SELECT * FROM get_comprehensive_referral_stats('11111111-1111-1111-1111-111111111111');

SELECT 'Referral Network:' as info;
SELECT * FROM get_referral_network_detailed('11111111-1111-1111-1111-111111111111');

SELECT 'Referral Commissions:' as info;
SELECT * FROM referral_commissions WHERE referrer_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Referral Transactions:' as info;
SELECT * FROM referral_transactions WHERE referrer_id = '11111111-1111-1111-1111-111111111111';
