-- Function to update referrer earnings
CREATE OR REPLACE FUNCTION update_referrer_earnings(
  p_user_id UUID,
  p_commission_amount NUMERIC
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update the referrer's total earnings
  UPDATE user_profiles 
  SET 
    total_referral_earnings = COALESCE(total_referral_earnings, 0) + p_commission_amount,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Return true if update was successful
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_referrer_earnings(UUID, NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION update_referrer_earnings(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION update_referrer_earnings(UUID, NUMERIC) TO service_role;
