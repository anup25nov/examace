-- Test Profile Migration
-- Run this after running PROFILE_DATABASE_MIGRATION.sql to verify everything works

-- 1. Test adding new columns to user_profiles
SELECT 
    'Testing user_profiles columns' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_profiles' 
            AND column_name = 'name'
        ) THEN 'PASS: name column exists'
        ELSE 'FAIL: name column missing'
    END as result;

-- 2. Test new tables exist
SELECT 
    'Testing new tables' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phone_verifications')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_visits')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_transactions')
        THEN 'PASS: All new tables created'
        ELSE 'FAIL: Some tables missing'
    END as result;

-- 3. Test constraints
SELECT 
    'Testing constraints' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.check_constraints 
            WHERE constraint_name = 'valid_phone_check'
        ) THEN 'PASS: Phone constraint exists'
        ELSE 'FAIL: Phone constraint missing'
    END as result;

-- 4. Test indexes
SELECT 
    'Testing indexes' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_phone_verifications_phone'
        ) THEN 'PASS: Phone verification index exists'
        ELSE 'FAIL: Phone verification index missing'
    END as result;

-- 5. Test RLS policies
SELECT 
    'Testing RLS policies' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'phone_verifications'
        ) THEN 'PASS: RLS policies exist'
        ELSE 'FAIL: RLS policies missing'
    END as result;

-- 6. Test functions
SELECT 
    'Testing functions' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'cleanup_expired_otps'
        ) THEN 'PASS: Functions created'
        ELSE 'FAIL: Functions missing'
    END as result;

-- 7. Test views
SELECT 
    'Testing views' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_name = 'user_profile_summary'
        ) THEN 'PASS: Views created'
        ELSE 'FAIL: Views missing'
    END as result;

-- 8. Sample data test (optional)
-- Uncomment to test with sample data
/*
INSERT INTO public.user_profiles (id, name, phone, phone_verified, referral_earnings, total_referrals)
VALUES ('test-user-id', 'Test User', '9876543210', true, 100.00, 2)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    phone_verified = EXCLUDED.phone_verified,
    referral_earnings = EXCLUDED.referral_earnings,
    total_referrals = EXCLUDED.total_referrals;

SELECT 'Sample data test' as test_name, 'PASS: Sample data inserted' as result;
*/
