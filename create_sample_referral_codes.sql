-- Create sample referral codes for testing
-- Run this script in your Supabase SQL Editor

-- 1. Check if we have any users to create referral codes for
SELECT '=== CHECKING USERS ===' as test;

SELECT id, email, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Create a sample referral code for testing (replace with actual user ID)
-- First, let's see what users exist
SELECT '=== AVAILABLE USERS FOR REFERRAL CODES ===' as test;

-- 3. Create a test referral code (uncomment and replace user_id with actual user ID)
/*
INSERT INTO referral_codes (
  user_id,
  code,
  is_active,
  total_referrals,
  total_earnings,
  created_at,
  updated_at
) VALUES (
  'your-user-id-here'::UUID,  -- Replace with actual user ID
  'TEST123',
  true,
  0,
  0.00,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;
*/

-- 4. Check existing referral codes
SELECT '=== EXISTING REFERRAL CODES ===' as test;

SELECT code, is_active, total_referrals, total_earnings, created_at
FROM referral_codes
ORDER BY created_at DESC;

SELECT '=== SAMPLE REFERRAL CODES SCRIPT COMPLETED ===' as test;
