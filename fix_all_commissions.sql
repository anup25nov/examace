-- Fix all commissions for users who have payments but no commissions
-- This will process commissions for all eligible users

-- Step 1: Find all users with payments but no commissions
SELECT '=== FINDING USERS WITH PAYMENTS BUT NO COMMISSIONS ===' as step;

WITH users_with_payments_no_commissions AS (
  SELECT DISTINCT p.user_id
  FROM payments p
  WHERE p.status IN ('verified', 'paid', 'completed')
  AND NOT EXISTS (
    SELECT 1 FROM referral_commissions rc 
    WHERE rc.referred_id = p.user_id
  )
  AND EXISTS (
    SELECT 1 FROM referral_transactions rt 
    WHERE rt.referred_id = p.user_id 
    AND rt.status = 'pending'
  )
)
SELECT 
  'Users needing commission processing:' as info,
  COUNT(*) as user_count
FROM users_with_payments_no_commissions;

-- Step 2: Process commissions for all eligible users
SELECT '=== PROCESSING COMMISSIONS FOR ALL ELIGIBLE USERS ===' as step;

-- This will process commissions for all users who have payments but no commissions
SELECT 
  'Commission Processing Results:' as info,
  *
FROM fix_all_pending_commissions();

-- Step 3: Check results after processing
SELECT '=== RESULTS AFTER PROCESSING ===' as step;

-- Check how many commissions were created
SELECT 
  'Total Commissions After Processing:' as info,
  COUNT(*) as total_commissions,
  SUM(commission_amount) as total_commission_amount
FROM referral_commissions;

-- Check referral stats for the referrer
SELECT 
  'Updated Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');
