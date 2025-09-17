-- Test script to check referral code creation for new users
-- Run this after a new user signs up to verify referral code was created

-- 1. Check if user profile exists
SELECT 
  id, 
  phone, 
  created_at,
  referral_code_applied,
  referral_code_used
FROM user_profiles 
WHERE phone = '+919999999999'  -- Replace with test phone number
ORDER BY created_at DESC;

-- 2. Check if referral code was created for the user
SELECT 
  rc.id,
  rc.user_id,
  rc.code,
  rc.total_referrals,
  rc.total_earnings,
  rc.is_active,
  rc.created_at,
  up.phone
FROM referral_codes rc
JOIN user_profiles up ON rc.user_id = up.id
WHERE up.phone = '+919999999999'  -- Replace with test phone number
ORDER BY rc.created_at DESC;

-- 3. Check if exam stats were created
SELECT 
  es.id,
  es.user_id,
  es.exam_type,
  es.created_at,
  up.phone
FROM exam_stats es
JOIN user_profiles up ON es.user_id = up.id
WHERE up.phone = '+919999999999'  -- Replace with test phone number
ORDER BY es.created_at DESC;

-- 4. Check recent user activity
SELECT 
  'user_profiles' as table_name,
  id,
  phone,
  created_at
FROM user_profiles 
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
  'referral_codes' as table_name,
  user_id as id,
  code as phone,
  created_at
FROM referral_codes 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
