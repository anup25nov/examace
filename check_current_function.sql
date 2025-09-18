-- Check current function signature after cleanup
-- Run this in your Supabase SQL Editor

-- 1. Check current function signature
SELECT '=== CURRENT FUNCTION SIGNATURE ===' as step;
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

-- 2. Test with the parameters we're using
SELECT '=== TESTING WITH EDGE FUNCTION PARAMETERS ===' as step;
SELECT * FROM process_referral_commission(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,  -- p_user_id
  (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,  -- p_payment_id
  'pro_plus',  -- p_membership_plan
  2.00  -- p_membership_amount
);
