-- Database Analysis Script
-- This script will help identify unused tables, data inconsistencies, and membership issues

-- 1. List all tables and their row counts
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;

-- 2. Check exam_stats table for unnecessary exam records
SELECT 
    exam_id,
    COUNT(*) as record_count,
    COUNT(DISTINCT user_id) as unique_users
FROM user_exam_stats 
GROUP BY exam_id 
ORDER BY record_count DESC;

-- 3. Check which users have records for multiple exams
SELECT 
    user_id,
    COUNT(DISTINCT exam_id) as exam_count,
    STRING_AGG(DISTINCT exam_id, ', ') as exams
FROM user_exam_stats 
GROUP BY user_id 
HAVING COUNT(DISTINCT exam_id) > 1
ORDER BY exam_count DESC;

-- 4. Check membership data consistency
SELECT 
    up.id,
    up.phone,
    up.membership_status,
    up.membership_plan,
    up.membership_expiry,
    um.plan_id as actual_plan,
    um.status as actual_status,
    um.end_date as actual_expiry
FROM user_profiles up
LEFT JOIN user_memberships um ON up.id = um.user_id
WHERE up.membership_status != 'free' OR um.plan_id IS NOT NULL
ORDER BY up.created_at DESC
LIMIT 20;

-- 5. Check for orphaned records
SELECT 'user_exam_stats without user_profiles' as issue, COUNT(*) as count
FROM user_exam_stats ues
LEFT JOIN user_profiles up ON ues.user_id = up.id
WHERE up.id IS NULL

UNION ALL

SELECT 'user_memberships without user_profiles' as issue, COUNT(*) as count
FROM user_memberships um
LEFT JOIN user_profiles up ON um.user_id = up.id
WHERE up.id IS NULL

UNION ALL

SELECT 'test_completions without user_profiles' as issue, COUNT(*) as count
FROM test_completions tc
LEFT JOIN user_profiles up ON tc.user_id = up.id
WHERE up.id IS NULL;

-- 6. Check for unused tables (tables with 0 or very few records)
SELECT 
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables 
WHERE n_live_tup < 5
ORDER BY n_live_tup;

-- 7. Check referral system tables usage
SELECT 
    'referral_codes' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records
FROM referral_codes

UNION ALL

SELECT 
    'referral_commissions' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_records
FROM referral_commissions

UNION ALL

SELECT 
    'referral_payouts' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_records
FROM referral_payouts;

-- 8. Check payment table usage
SELECT 
    plan_id,
    COUNT(*) as payment_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments
FROM payments
GROUP BY plan_id
ORDER BY payment_count DESC;
