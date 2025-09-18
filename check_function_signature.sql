-- Check the actual function signature
-- Run this in your Supabase SQL Editor

-- 1. Check function signature
SELECT '=== FUNCTION SIGNATURE ===' as step;
SELECT 
  p.parameter_name,
  p.parameter_mode,
  p.data_type,
  p.ordinal_position
FROM information_schema.parameters p
WHERE p.specific_name IN (
  SELECT r.specific_name 
  FROM information_schema.routines r
  WHERE r.routine_name = 'process_referral_commission' 
  AND r.routine_schema = 'public'
)
ORDER BY p.ordinal_position;

-- 2. Check all functions with this name
SELECT '=== ALL FUNCTIONS WITH THIS NAME ===' as step;
SELECT 
  routine_name,
  specific_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'process_referral_commission' 
AND routine_schema = 'public';

-- 3. Test with correct parameters
SELECT '=== TESTING WITH CORRECT PARAMETERS ===' as step;
SELECT * FROM process_referral_commission(
  '9044683e-a0c1-40fe-9b3a-47fea186bbd2'::UUID,
  (SELECT id FROM payments WHERE user_id = '9044683e-a0c1-40fe-9b3a-47fea186bbd2' ORDER BY created_at DESC LIMIT 1)::UUID,
  'pro_plus',
  2.00
);
