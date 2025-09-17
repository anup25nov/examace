-- Complete system test for referral commission flow
-- This will test the entire system end-to-end

-- Step 1: Check current state of the specific user
SELECT '=== CURRENT STATE CHECK ===' as step;

-- Check commission status for the specific user
SELECT 
  'Commission Status:' as info,
  *
FROM check_commission_status('b2975c5b-c04b-4929-b8ac-9f3da1b155b8');

-- Step 2: Process commission for the specific user
SELECT '=== PROCESSING COMMISSION ===' as step;

-- Process commission for the specific user
SELECT 
  'Commission Processing Result:' as info,
  *
FROM process_existing_user_commission('b2975c5b-c04b-4929-b8ac-9f3da1b155b8');

-- Step 3: Check state after processing
SELECT '=== STATE AFTER PROCESSING ===' as step;

-- Check commission status again
SELECT 
  'Commission Status After:' as info,
  *
FROM check_commission_status('b2975c5b-c04b-4929-b8ac-9f3da1b155b8');

-- Check referral transaction
SELECT 
  'Referral Transaction:' as info,
  id,
  referrer_id,
  referred_id,
  referral_code,
  amount,
  transaction_type,
  status,
  commission_amount,
  commission_status,
  membership_purchased,
  first_membership_only
FROM referral_transactions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Check commission records
SELECT 
  'Commission Records:' as info,
  id,
  referrer_id,
  referred_id,
  payment_id,
  commission_amount,
  commission_percentage,
  membership_plan,
  membership_amount,
  status,
  is_first_membership,
  created_at
FROM referral_commissions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Check referrer's earnings
SELECT 
  'Referrer Earnings:' as info,
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active,
  created_at,
  updated_at
FROM referral_codes 
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 4: Test referral stats functions
SELECT '=== TESTING REFERRAL STATS FUNCTIONS ===' as step;

-- Test get_comprehensive_referral_stats
SELECT 
  'Comprehensive Stats:' as function_name,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Test get_referral_network_detailed
SELECT 
  'Network Detailed:' as function_name,
  *
FROM get_referral_network_detailed('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Test get_user_referral_stats
SELECT 
  'User Referral Stats:' as function_name,
  *
FROM get_user_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 5: Fix all pending commissions
SELECT '=== FIXING ALL PENDING COMMISSIONS ===' as step;

-- Fix all pending commissions
SELECT 
  'Fix All Commissions Result:' as info,
  *
FROM fix_all_pending_commissions();

-- Step 6: Final verification
SELECT '=== FINAL VERIFICATION ===' as step;

-- Check final state
SELECT 
  'Final Commission Status:' as info,
  *
FROM check_commission_status('b2975c5b-c04b-4929-b8ac-9f3da1b155b8');

-- Check final referral stats
SELECT 
  'Final Comprehensive Stats:' as function_name,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');
