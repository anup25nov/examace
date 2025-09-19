-- Check the actual structure of referral_commissions table
-- Run this in your Supabase SQL Editor

-- 1. Check table structure
SELECT '=== REFERRAL_COMMISSIONS TABLE STRUCTURE ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'referral_commissions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if table exists and has data
SELECT '=== REFERRAL_COMMISSIONS DATA ===' as step;
SELECT * FROM referral_commissions 
WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY created_at DESC;

-- 3. Check all tables with 'commission' in the name
SELECT '=== ALL COMMISSION TABLES ===' as step;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%commission%' 
AND table_schema = 'public';
