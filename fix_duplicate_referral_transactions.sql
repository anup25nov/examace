-- Fix Duplicate Referral Transactions
-- The issue: Two referral transactions are created for the same signup
-- 1. validate_and_apply_referral_code function creates one with transaction_type='signup'
-- 2. create_referral_transaction_on_user_creation trigger creates another with transaction_type='referral_signup'

-- Solution: Disable the trigger since the manual function handles it properly

-- Drop the trigger that creates duplicate transactions
DROP TRIGGER IF EXISTS trigger_create_referral_transaction_on_user_creation ON public.user_profiles;

-- Optional: Drop the function too since it's no longer needed
-- DROP FUNCTION IF EXISTS public.create_referral_transaction_on_user_creation();

-- Verify the fix by checking current triggers on user_profiles
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles'
AND event_object_schema = 'public';

-- Clean up any existing duplicate transactions (optional)
-- This will keep only the 'signup' type transactions and remove 'referral_signup' duplicates
DELETE FROM referral_transactions 
WHERE transaction_type = 'referral_signup' 
AND id IN (
    SELECT rt2.id 
    FROM referral_transactions rt1
    JOIN referral_transactions rt2 ON (
        rt1.referrer_id = rt2.referrer_id 
        AND rt1.referred_id = rt2.referred_id 
        AND rt1.referral_code = rt2.referral_code
        AND rt1.transaction_type = 'signup'
        AND rt2.transaction_type = 'referral_signup'
        AND rt1.created_at = rt2.created_at
    )
);
