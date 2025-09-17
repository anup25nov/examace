-- Manual fix for commissions
-- This will fix the referral status and process commissions

-- Step 1: Check current referral transaction status
SELECT '=== CURRENT REFERRAL STATUS ===' as step;
SELECT 
  status,
  COUNT(*) as count
FROM referral_transactions 
GROUP BY status;

-- Step 2: Update all referral transactions to pending status
SELECT '=== UPDATING REFERRAL STATUS ===' as step;
UPDATE referral_transactions 
SET status = 'pending'
WHERE status != 'pending';

-- Show how many were updated
SELECT 
  'Updated to pending:' as info,
  COUNT(*) as count
FROM referral_transactions 
WHERE status = 'pending';

-- Step 3: Process commissions for all users with payments
SELECT '=== PROCESSING COMMISSIONS ===' as step;

-- Process commissions for each user who has a payment
WITH users_with_payments AS (
  SELECT DISTINCT p.user_id, p.id as payment_id, p.plan, p.amount
  FROM payments p
  WHERE p.status IN ('verified', 'paid', 'completed')
)
SELECT 
  'Processing commission for user:' as info,
  uwp.user_id,
  uwp.payment_id,
  uwp.plan,
  uwp.amount,
  process_membership_commission(
    uwp.user_id,
    uwp.payment_id,
    uwp.plan,
    uwp.amount::DECIMAL(10,2)
  ) as commission_result
FROM users_with_payments uwp
ORDER BY uwp.user_id;

-- Step 4: Check results
SELECT '=== FINAL RESULTS ===' as step;

-- Check total commissions
SELECT 
  'Total Commissions:' as info,
  COUNT(*) as total_commissions,
  SUM(commission_amount) as total_amount
FROM referral_commissions;

-- Check referral stats
SELECT 
  'Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');
