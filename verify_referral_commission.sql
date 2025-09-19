-- Comprehensive Referral Commission Verification Script
-- Run this after testing the payment flow to verify everything worked

-- 1. Check the payment record
SELECT '=== PAYMENT RECORD ===' as step;
SELECT 
    id,
    user_id,
    plan,
    amount,
    status,
    razorpay_payment_id,
    razorpay_order_id,
    created_at,
    paid_at
FROM payments 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Check user membership
SELECT '=== USER MEMBERSHIP ===' as step;
SELECT 
    user_id,
    plan,
    status,
    start_date,
    end_date,
    created_at
FROM user_memberships 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' 
ORDER BY created_at DESC 
LIMIT 1;

-- 3. Check referral transaction
SELECT '=== REFERRAL TRANSACTION ===' as step;
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
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Check commission record
SELECT '=== COMMISSION RECORD ===' as step;
SELECT 
    id,
    referrer_id,
    referred_id,
    payment_id,
    membership_plan,
    membership_amount,
    commission_rate,
    commission_amount,
    status,
    created_at
FROM referral_commissions 
WHERE referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' 
ORDER BY created_at DESC 
LIMIT 1;

-- 5. Check referrer's updated earnings
SELECT '=== REFERRER EARNINGS ===' as step;
SELECT 
    user_id,
    code,
    total_referrals,
    total_earnings,
    is_active,
    updated_at
FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';

-- 6. Check all referral transactions for the referrer
SELECT '=== ALL REFERRAL TRANSACTIONS FOR REFERRER ===' as step;
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
WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec' 
ORDER BY created_at DESC;

-- 7. Check all commissions for the referrer
SELECT '=== ALL COMMISSIONS FOR REFERRER ===' as step;
SELECT 
    id,
    referrer_id,
    referred_id,
    payment_id,
    membership_plan,
    membership_amount,
    commission_rate,
    commission_amount,
    status,
    created_at
FROM referral_commissions 
WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec' 
ORDER BY created_at DESC;

-- 8. Summary check
SELECT '=== SUMMARY ===' as step;
SELECT 
    'Payment Status' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' AND status = 'completed') 
        THEN '✅ Payment Completed' 
        ELSE '❌ Payment Not Found' 
    END as status
UNION ALL
SELECT 
    'Membership Status' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM user_memberships WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' AND status = 'active') 
        THEN '✅ Membership Active' 
        ELSE '❌ Membership Not Active' 
    END as status
UNION ALL
SELECT 
    'Referral Transaction' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM referral_transactions WHERE referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' AND membership_purchased = true) 
        THEN '✅ Referral Transaction Created' 
        ELSE '❌ No Referral Transaction' 
    END as status
UNION ALL
SELECT 
    'Commission Record' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM referral_commissions WHERE referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870') 
        THEN '✅ Commission Record Created' 
        ELSE '❌ No Commission Record' 
    END as status
UNION ALL
SELECT 
    'Referrer Earnings Updated' as check_type,
    CASE 
        WHEN (SELECT total_earnings FROM referral_codes WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec') > 0
        THEN '✅ Referrer Earnings Updated' 
        ELSE '❌ Referrer Earnings Not Updated' 
    END as status;
