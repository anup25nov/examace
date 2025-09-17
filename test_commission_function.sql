-- Test the commission function with sample data
-- This will help us verify the function works correctly

-- Test 1: Check if the function exists and what parameters it expects
SELECT 
  routine_name,
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters 
WHERE specific_name = (
  SELECT specific_name 
  FROM information_schema.routines 
  WHERE routine_name = 'process_membership_commission'
  AND routine_type = 'FUNCTION'
)
ORDER BY ordinal_position;

-- Test 2: Check if there are any referral transactions for the user
SELECT 'Referral transactions for user:' as info;
SELECT 
  id,
  referrer_id,
  referred_id,
  referral_code,
  status,
  membership_purchased,
  first_membership_only
FROM referral_transactions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Test 3: Check if there are any payments for the user
SELECT 'Payments for user:' as info;
SELECT 
  id,
  user_id,
  plan,
  amount,
  status,
  created_at
FROM payments 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Test 4: Try to process commission with a dummy payment ID first
-- (This will help us see if the function works at all)
SELECT 'Testing commission function with dummy data:' as info;
SELECT * FROM process_membership_commission(
  'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'::UUID,
  '00000000-0000-0000-0000-000000000000'::UUID,
  'pro',
  1.00
);
