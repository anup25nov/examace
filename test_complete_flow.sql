-- Test the complete referral flow
-- Run this in your Supabase SQL Editor

-- 1. Check current referral transactions
SELECT '=== CURRENT REFERRAL TRANSACTIONS ===' as step;
SELECT 
    id,
    referrer_id,
    referred_id,
    referral_code,
    amount,
    commission_amount,
    status,
    commission_status,
    membership_purchased,
    created_at
FROM referral_transactions 
WHERE referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;

-- 2. Check U1's current earnings
SELECT '=== U1 CURRENT EARNINGS ===' as step;
SELECT 
    user_id,
    code,
    total_referrals,
    total_earnings,
    is_active,
    updated_at
FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';

-- 3. Test the function directly
SELECT '=== TESTING FUNCTION DIRECTLY ===' as step;
SELECT * FROM process_referral_commission(
    '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
    (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,
    'pro_plus',
    2.00
);

-- 4. Check if commission was processed
SELECT '=== COMMISSION PROCESSING RESULT ===' as step;
SELECT 
    id,
    referrer_id,
    referred_id,
    amount,
    commission_amount,
    status,
    commission_status,
    membership_purchased,
    updated_at
FROM referral_transactions 
WHERE referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;

-- 5. Check U1's updated earnings
SELECT '=== U1 UPDATED EARNINGS ===' as step;
SELECT 
    user_id,
    code,
    total_referrals,
    total_earnings,
    is_active,
    updated_at
FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';

-- 6. Check commission records
SELECT '=== COMMISSION RECORDS ===' as step;
SELECT 
    id,
    referrer_id,
    referred_id,
    amount,
    commission_amount,
    commission_rate,
    status,
    created_at
FROM referral_commissions 
WHERE referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;
