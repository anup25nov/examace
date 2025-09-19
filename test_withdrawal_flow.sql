-- Test the complete withdrawal flow
-- Run this in your Supabase SQL Editor

-- 1. First, let's check if referral_payouts table exists and has data
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'referral_payouts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if there are any existing withdrawal requests
SELECT * FROM referral_payouts LIMIT 5;

-- 3. Create a test withdrawal request for U1 (referrer)
INSERT INTO referral_payouts (
  user_id,
  amount,
  payment_method,
  account_details,
  status,
  created_at,
  updated_at
) VALUES (
  'fbc97816-07ed-4e21-bc45-219dbfdc4cec', -- U1's ID
  0.30, -- Available commission amount
  'bank_transfer',
  'Test Bank Account: 1234567890',
  'pending',
  NOW(),
  NOW()
) RETURNING id, user_id, amount, status;

-- 4. Test the withdrawal processing function with the created request
-- (Replace the UUID below with the actual ID returned from step 3)
SELECT * FROM process_withdrawal_request_with_message(
  (SELECT id FROM referral_payouts WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec' ORDER BY created_at DESC LIMIT 1),
  'fbc97816-07ed-4e21-bc45-219dbfdc4cec', -- Admin user ID (same as U1 for testing)
  'approved',
  'Test approval by admin'
);

-- 5. Check the updated withdrawal request
SELECT * FROM referral_payouts WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';

-- 6. Check U1's updated earnings
SELECT * FROM referral_codes WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';
