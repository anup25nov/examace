-- Check existing withdrawal requests and create a test one
-- Run this in your Supabase SQL Editor

-- 1. Check if there are any withdrawal requests at all
SELECT COUNT(*) as total_requests FROM referral_payouts;

-- 2. Check all withdrawal requests
SELECT * FROM referral_payouts ORDER BY created_at DESC;

-- 3. Check withdrawal requests for the specific user
SELECT * FROM referral_payouts WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 4. Create a test withdrawal request with the specific ID you're trying to use
INSERT INTO referral_payouts (
  id,
  user_id,
  amount,
  payment_method,
  account_details,
  status,
  created_at,
  updated_at
) VALUES (
  'eed16359-afd1-4de5-94c7-33f57911ebae'::UUID,
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  0.30,
  'bank_transfer',
  'Test Bank Account: 1234567890',
  'pending',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING
RETURNING id, user_id, amount, status;

-- 5. Now test the function with the created request
SELECT * FROM process_withdrawal_request_with_message(
  'eed16359-afd1-4de5-94c7-33f57911ebae'::UUID,
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  'rejected',
  'Test rejection'
);

-- 6. Check the updated request
SELECT * FROM referral_payouts WHERE id = 'eed16359-afd1-4de5-94c7-33f57911ebae';
