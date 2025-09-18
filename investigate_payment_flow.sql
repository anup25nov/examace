-- Investigate payment flow and identify issues
-- Run this in your Supabase SQL Editor

-- 1. Check recent payments
SELECT '=== RECENT PAYMENTS ===' as step;
SELECT 
  p.*,
  u.email as user_email
FROM payments p
LEFT JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 2. Check if verify_razorpay_payment function is being called
SELECT '=== CHECKING EDGE FUNCTION LOGS ===' as step;
-- This will show if the function is being invoked
SELECT 'Check Supabase Edge Function logs for verify_razorpay_payment function' as note;

-- 3. Check referral_transactions for U2
SELECT '=== U2 REFERRAL TRANSACTIONS ===' as step;
SELECT 
  rt.*,
  u1.email as referrer_email,
  u2.email as referred_email
FROM referral_transactions rt
LEFT JOIN auth.users u1 ON rt.referrer_id = u1.id
LEFT JOIN auth.users u2 ON rt.referred_id = u2.id
WHERE rt.referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY rt.created_at DESC;

-- 4. Check if membership was activated for U2
SELECT '=== U2 MEMBERSHIP STATUS ===' as step;
SELECT 
  um.*,
  mp.name as plan_name,
  u.email as user_email
FROM user_memberships um
LEFT JOIN membership_plans mp ON um.plan_id = mp.id
LEFT JOIN auth.users u ON um.user_id = u.id
WHERE um.user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY um.created_at DESC;

-- 5. Check if referral code was applied during signup
SELECT '=== REFERRAL CODE APPLICATION ===' as step;
SELECT 
  rt.*,
  CASE 
    WHEN rt.membership_purchased = true THEN 'Membership Purchased'
    WHEN rt.membership_purchased = false THEN 'No Membership Yet'
    ELSE 'Unknown Status'
  END as status_description
FROM referral_transactions rt
WHERE rt.referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY rt.created_at DESC;

-- 6. Check if commission was processed
SELECT '=== COMMISSION PROCESSING STATUS ===' as step;
SELECT 
  rc.*,
  u1.email as referrer_email,
  u2.email as referred_email
FROM referral_commissions rc
LEFT JOIN auth.users u1 ON rc.referrer_id = u1.id
LEFT JOIN auth.users u2 ON rc.referred_id = u2.id
WHERE rc.referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY rc.created_at DESC;

-- 7. Check U1's current earnings
SELECT '=== U1 CURRENT EARNINGS ===' as step;
SELECT 
  rc.*,
  'Total Referrals: ' || rc.total_referrals as referrals_info,
  'Total Earnings: ₹' || rc.total_earnings as earnings_info
FROM referral_codes rc
WHERE rc.user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';

-- 8. Test the activate_or_upgrade_membership function
SELECT '=== TESTING ACTIVATE_MEMBERSHIP ===' as step;
SELECT * FROM activate_or_upgrade_membership(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  'pro_plus',
  NOW()
);

-- 9. Check if there are any errors in the system
SELECT '=== CHECKING FOR ERRORS ===' as step;
SELECT 'Check the following for potential issues:' as note
UNION ALL
SELECT '1. Is verify_razorpay_payment function being called with referral_code?' as note
UNION ALL
SELECT '2. Are there any errors in Edge Function logs?' as note
UNION ALL
SELECT '3. Is the referral code being passed from frontend?' as note
UNION ALL
SELECT '4. Is the commission processing happening in the function?' as note;

SELECT 'Investigation complete! Check results above.' as status;
