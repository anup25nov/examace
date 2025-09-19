-- Debug withdrawal request issue
-- Run this in your Supabase SQL Editor

-- 1. Check if the withdrawal request exists
SELECT * FROM referral_payouts WHERE id = 'eed16359-afd1-4de5-94c7-33f57911ebae';

-- 2. Check all withdrawal requests for the user
SELECT * FROM referral_payouts WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';

-- 3. Check if there are any withdrawal requests at all
SELECT COUNT(*) as total_requests FROM referral_payouts;

-- 4. Check the table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'referral_payouts' ORDER BY ordinal_position;
