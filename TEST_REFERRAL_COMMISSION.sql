-- Test script to verify referral commission system is working
-- Run this after applying FIX_REFERRAL_COMMISSION_WEBHOOK.sql

-- 1. Check if all required columns exist
SELECT 
  'referral_transactions' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'referral_transactions' 
AND table_schema = 'public'
AND column_name IN ('referral_code', 'commission_amount', 'commission_status', 'first_membership_only', 'membership_purchased')
ORDER BY column_name;

-- 2. Check recent membership transactions without commissions
SELECT 
  mt.user_id,
  mt.amount,
  mt.created_at,
  CASE 
    WHEN EXISTS(SELECT 1 FROM referral_transactions rt WHERE rt.referred_id = mt.user_id AND rt.status = 'pending') 
    THEN 'Has pending referral'
    ELSE 'No pending referral'
  END as referral_status,
  CASE 
    WHEN EXISTS(SELECT 1 FROM referral_commissions rc WHERE rc.referred_id = mt.user_id) 
    THEN 'Has commission'
    ELSE 'No commission'
  END as commission_status
FROM membership_transactions mt
WHERE mt.status = 'completed'
AND mt.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY mt.created_at DESC
LIMIT 10;

-- 3. Check referral_codes table for recent earnings updates
SELECT 
  rc.user_id,
  rc.code,
  rc.total_referrals,
  rc.total_earnings,
  rc.updated_at
FROM referral_codes rc
WHERE rc.updated_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY rc.updated_at DESC
LIMIT 10;

-- 4. Test the debug function with a specific user (replace with actual user ID)
-- SELECT * FROM debug_commission_status('user-uuid-here');

-- 5. Check if process_missing_commissions function works
-- SELECT * FROM process_missing_commissions();

-- 6. Verify the updated process_payment_and_membership function
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'process_payment_and_membership'
AND routine_schema = 'public';
