-- Test the validate_and_apply_referral_code function
-- This will help verify that the type mismatch is fixed

-- Test with a valid referral code (replace with actual admin referral code)
SELECT * FROM validate_and_apply_referral_code(
  '2a17bb69-62ab-4efc-a421-009282b1ed21'::UUID, 
  'ADMIN001'
);

-- Test with invalid referral code
SELECT * FROM validate_and_apply_referral_code(
  '2a17bb69-62ab-4efc-a421-009282b1ed21'::UUID, 
  'INVALID123'
);

-- Test with user's own referral code (should fail)
SELECT * FROM validate_and_apply_referral_code(
  '2a17bb69-62ab-4efc-a421-009282b1ed21'::UUID, 
  'ADMIN001'
);
