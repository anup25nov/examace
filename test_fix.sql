-- Test the fix
-- Run this in your Supabase SQL Editor

-- 1. Test commission processing with correct payment ID
SELECT * FROM process_referral_commission(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  'c6eb8982-d67c-482b-89d0-5aeb838eb022'::UUID,
  'pro_plus',
  2.00
);

-- 2. Check results
SELECT 'U1 earnings:' as metric, total_earnings FROM referral_codes WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';
