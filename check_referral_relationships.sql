-- Check the referral relationships
-- Run this in your Supabase SQL Editor

-- 1. Check who U1 referred (U1 is the referrer)
SELECT '=== U1 AS REFERRER ===' as step;
SELECT 
    rt.referrer_id,
    rt.referred_id,
    rt.referral_code,
    rt.status,
    rt.membership_purchased,
    rt.created_at
FROM referral_transactions rt
WHERE rt.referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY rt.created_at DESC;

-- 2. Check who referred U1 (U1 as referred user)
SELECT '=== U1 AS REFERRED USER ===' as step;
SELECT 
    rt.referrer_id,
    rt.referred_id,
    rt.referral_code,
    rt.status,
    rt.membership_purchased,
    rt.created_at
FROM referral_transactions rt
WHERE rt.referred_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY rt.created_at DESC;

-- 3. Test the function with U1's referred user (U2)
SELECT '=== TESTING WITH U2 (REFERRED USER) ===' as step;
SELECT * FROM process_referral_commission(
    2.00,  -- p_membership_amount
    'pro_plus',  -- p_membership_plan
    (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,  -- p_payment_id
    '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID  -- p_user_id (U2)
);

-- 4. Check U1's current earnings
SELECT '=== U1 CURRENT EARNINGS ===' as step;
SELECT 
    user_id,
    code,
    total_referrals,
    total_earnings,
    is_active
FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';
