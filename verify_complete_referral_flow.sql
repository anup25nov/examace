-- Complete verification of referral commission flow
-- Run this in your Supabase SQL Editor

-- 1. Check U1's referral code details
SELECT '=== U1 REFERRAL CODE DETAILS ===' as step;
SELECT * FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';

-- 2. Check all referral transactions for U1
SELECT '=== ALL REFERRAL TRANSACTIONS FOR U1 ===' as step;
SELECT 
  rt.*,
  u1.email as referrer_email,
  u2.email as referred_email
FROM referral_transactions rt
LEFT JOIN auth.users u1 ON rt.referrer_id = u1.id
LEFT JOIN auth.users u2 ON rt.referred_id = u2.id
WHERE rt.referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY rt.created_at DESC;

-- 3. Check all referral commissions for U1
SELECT '=== ALL REFERRAL COMMISSIONS FOR U1 ===' as step;
SELECT 
  rc.*,
  u1.email as referrer_email,
  u2.email as referred_email
FROM referral_commissions rc
LEFT JOIN auth.users u1 ON rc.referrer_id = u1.id
LEFT JOIN auth.users u2 ON rc.referred_id = u2.id
WHERE rc.referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY rc.created_at DESC;

-- 4. Check U2's payment details
SELECT '=== U2 PAYMENT DETAILS ===' as step;
SELECT 
  p.*,
  u.email as user_email
FROM payments p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY p.created_at DESC;

-- 5. Check U2's membership details
SELECT '=== U2 MEMBERSHIP DETAILS ===' as step;
SELECT 
  um.*,
  mp.name as plan_name,
  u.email as user_email
FROM user_memberships um
LEFT JOIN membership_plans mp ON um.plan_id = mp.id
LEFT JOIN auth.users u ON um.user_id = u.id
WHERE um.user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY um.created_at DESC;

-- 6. Calculate commission breakdown
SELECT '=== COMMISSION BREAKDOWN ===' as step;
SELECT 
  'Total Referrals' as metric,
  COUNT(*) as count,
  SUM(rt.amount) as total_amount,
  SUM(rt.commission_amount) as total_commission
FROM referral_transactions rt
WHERE rt.referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
AND rt.membership_purchased = true

UNION ALL

SELECT 
  'Pending Commissions' as metric,
  COUNT(*) as count,
  SUM(rc.amount) as total_amount,
  SUM(rc.commission_amount) as total_commission
FROM referral_commissions rc
WHERE rc.referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
AND rc.status = 'pending';

-- 7. Test the complete flow manually
SELECT '=== TESTING COMPLETE FLOW ===' as step;

-- Test process_referral_commission function
SELECT * FROM process_referral_commission(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  '9e508576-f73c-4d53-9c8d-9119b2d6224c'::UUID,
  'pro_plus',
  2.00
);

SELECT 'Verification complete! Check the results above.' as status;
