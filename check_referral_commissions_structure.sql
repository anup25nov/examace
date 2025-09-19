-- Check the structure of referral_commissions table
-- Run this in your Supabase SQL Editor

-- Check referral_commissions table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'referral_commissions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check referral_transactions table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'referral_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user_memberships table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_memberships' 
AND table_schema = 'public'
ORDER BY ordinal_position;
