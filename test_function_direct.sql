-- Test the function directly to make sure it works
-- Run this in your Supabase SQL Editor

-- 1. Test with a real payment ID
SELECT '=== TESTING WITH REAL PAYMENT ID ===' as step;
SELECT * FROM process_referral_commission(
    2.00,  -- p_membership_amount
    'pro_plus',  -- p_membership_plan
    (SELECT id FROM payments WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec' ORDER BY created_at DESC LIMIT 1)::UUID,  -- p_payment_id
    'fbc97816-07ed-4e21-bc45-219dbfdc4cec'::UUID  -- p_user_id
);

-- 2. Check if there are any referral transactions for this user
SELECT '=== CHECKING REFERRAL TRANSACTIONS ===' as step;
SELECT * FROM referral_transactions 
WHERE referred_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY created_at DESC;

-- 3. Check if there are any commissions created
SELECT '=== CHECKING COMMISSIONS ===' as step;
SELECT * FROM referral_commissions 
WHERE referred_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY created_at DESC;
