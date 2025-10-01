-- Debug Apply Referral Code Function
-- Run this in Supabase SQL Editor

-- Test the apply_referral_code function directly
SELECT 'TESTING apply_referral_code function:' as info;

-- Test with a specific user and referral code
SELECT * FROM public.apply_referral_code(
    'fa55b327-1200-47a8-aa33-9f8a56df50ec'::uuid, 
    'TEST123'::text
);

-- Check if user already has referrals
SELECT 'CHECKING EXISTING REFERRALS:' as info;
SELECT 
    id,
    referrer_id,
    referred_id,
    referral_code,
    transaction_type,
    status,
    created_at
FROM public.referral_transactions 
WHERE referred_id = 'fa55b327-1200-47a8-aa33-9f8a56df50ec'
ORDER BY created_at DESC;

-- Check if referral code exists and is active
SELECT 'CHECKING REFERRAL CODE:' as info;
SELECT 
    user_id,
    code,
    is_active,
    total_referrals,
    total_earnings
FROM public.referral_codes 
WHERE code = 'TEST123';

-- Check user profile
SELECT 'CHECKING USER PROFILE:' as info;
SELECT 
    id,
    referred_by,
    referral_code_applied,
    referral_code_used,
    referral_applied_at
FROM public.user_profiles 
WHERE id = 'fa55b327-1200-47a8-aa33-9f8a56df50ec';
