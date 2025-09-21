-- Database Verification Script
-- Run this script to verify database setup

-- 1. Check membership plans
SELECT '=== MEMBERSHIP PLANS ===' as section;
SELECT id, name, price, mock_tests, duration_days, is_active, display_order 
FROM membership_plans 
ORDER BY display_order;

-- 2. Check table structure
SELECT '=== TABLE STRUCTURE ===' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_memberships', 'test_completions', 'payments', 'referral_codes')
ORDER BY table_name, ordinal_position;

-- 3. Check constraints
SELECT '=== CONSTRAINTS ===' as section;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name IN ('user_profiles', 'user_memberships', 'test_completions', 'payments', 'referral_codes')
ORDER BY tc.table_name, tc.constraint_type;

-- 4. Check indexes
SELECT '=== INDEXES ===' as section;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_memberships', 'test_completions', 'payments', 'referral_codes')
ORDER BY tablename, indexname;

-- 5. Check functions
SELECT '=== FUNCTIONS ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%test%' OR routine_name LIKE '%referral%' OR routine_name LIKE '%membership%'
ORDER BY routine_name;

-- 6. Check views
SELECT '=== VIEWS ===' as section;
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 7. Check RLS policies
SELECT '=== RLS POLICIES ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_memberships', 'test_completions', 'payments', 'referral_codes')
ORDER BY tablename, policyname;
