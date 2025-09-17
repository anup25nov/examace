-- Fix referral transaction status to ensure commissions can be processed
-- This will update referral transactions to have the correct status

-- Step 1: Check current status of all referral transactions
SELECT '=== CURRENT REFERRAL TRANSACTION STATUS ===' as step;

SELECT 
  'Current Status Count:' as info,
  status,
  COUNT(*) as count
FROM referral_transactions 
GROUP BY status
ORDER BY status;

-- Step 2: Update referral transactions that should be pending
SELECT '=== UPDATING REFERRAL TRANSACTIONS ===' as step;

-- Update referral transactions that have membership_purchased = false to status = 'pending'
UPDATE referral_transactions 
SET 
  status = 'pending',
  updated_at = NOW()
WHERE membership_purchased = false 
AND status != 'pending';

-- Show how many were updated
SELECT 
  'Updated Referral Transactions:' as info,
  COUNT(*) as updated_count
FROM referral_transactions 
WHERE status = 'pending' 
AND membership_purchased = false;

-- Step 3: Check status after update
SELECT '=== STATUS AFTER UPDATE ===' as step;

SELECT 
  'Status After Update:' as info,
  status,
  COUNT(*) as count
FROM referral_transactions 
GROUP BY status
ORDER BY status;

-- Step 4: Test commission processing after fix
SELECT '=== TESTING COMMISSION PROCESSING AFTER FIX ===' as step;

-- Test commission processing for the most recent user with payment
WITH latest_user_with_payment AS (
  SELECT 
    p.user_id,
    p.id as payment_id,
    p.plan,
    p.amount
  FROM payments p
  WHERE p.status IN ('verified', 'paid', 'completed')
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT 
  'Commission Processing Test After Fix:' as info,
  *
FROM process_membership_commission(
  (SELECT user_id FROM latest_user_with_payment),
  (SELECT payment_id FROM latest_user_with_payment),
  (SELECT plan FROM latest_user_with_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_user_with_payment)
);

-- Step 5: Process all pending commissions
SELECT '=== PROCESSING ALL PENDING COMMISSIONS ===' as step;

-- Process commissions for all users who have payments but no commissions
SELECT 
  'Processing All Pending Commissions:' as info,
  *
FROM fix_all_pending_commissions();

-- Step 6: Check final results
SELECT '=== FINAL RESULTS ===' as step;

-- Check referral stats after processing
SELECT 
  'Final Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');
