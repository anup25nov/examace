-- Test script to manually process commission for the specific user
-- This will help us debug why the commission is not being processed

-- First, let's check the current state
SELECT 'Current referral transaction state:' as info;
SELECT 
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

-- Check if there are any payments for this user
SELECT 'Payments for this user:' as info;
SELECT 
  id,
  user_id,
  plan,
  amount,
  status,
  razorpay_payment_id,
  created_at
FROM payments 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Check if there are any memberships for this user
SELECT 'Memberships for this user:' as info;
SELECT 
  id,
  user_id,
  plan,
  start_date,
  end_date,
  created_at
FROM memberships 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Now let's manually process the commission
-- First, let's get the latest payment ID
SELECT 'Processing commission manually...' as info;

-- Test the function with a sample payment ID (replace with actual payment ID)
-- This will show us what the function returns
SELECT * FROM process_membership_commission(
  'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'::UUID,
  (SELECT id FROM payments WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8' ORDER BY created_at DESC LIMIT 1),
  'pro',
  1.00
);
