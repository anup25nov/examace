-- Check withdrawal requests and create test data
-- Run this in your Supabase SQL Editor

-- 1. Check all withdrawal requests
SELECT 
  id,
  user_id,
  amount,
  status,
  created_at
FROM referral_payouts 
ORDER BY created_at DESC;

-- 2. Check if the specific request exists
SELECT * FROM referral_payouts 
WHERE id = 'f05538bf-efd1-4dbf-83ff-b4e0935a7010';

-- 3. Create a test withdrawal request with the specific ID
INSERT INTO referral_payouts (
  id,
  user_id,
  amount,
  payment_method,
  account_details,
  status
) VALUES (
  'f05538bf-efd1-4dbf-83ff-b4e0935a7010'::UUID,
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  0.30,
  'bank_transfer',
  'Test Bank Account: 1234567890',
  'pending'
) ON CONFLICT (id) DO NOTHING
RETURNING id, user_id, amount, status;

-- 4. Test the function with the created request
SELECT * FROM process_withdrawal_request_with_message(
  'f05538bf-efd1-4dbf-83ff-b4e0935a7010'::UUID,
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  'rejected',
  'Test rejection'
);
