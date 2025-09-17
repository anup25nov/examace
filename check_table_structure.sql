-- Check table structure to understand what columns exist
-- This will help us avoid column errors

-- Check memberships table structure
SELECT '=== MEMBERSHIPS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check payments table structure
SELECT '=== PAYMENTS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check referral_transactions table structure
SELECT '=== REFERRAL_TRANSACTIONS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'referral_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check referral_commissions table structure
SELECT '=== REFERRAL_COMMISSIONS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'referral_commissions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check referral_codes table structure
SELECT '=== REFERRAL_CODES TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'referral_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;
