-- Secure OTP verification functions
-- These functions handle OTP verification server-side only

-- Function to get active OTP for a phone number
CREATE OR REPLACE FUNCTION get_active_otp(p_phone_number TEXT)
RETURNS TABLE (
  id UUID,
  phone_number TEXT,
  otp_code TEXT,
  expires_at TIMESTAMPTZ,
  attempts INTEGER,
  max_attempts INTEGER,
  verified BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    otp.id,
    otp.phone_number,
    otp.otp_code,
    otp.expires_at,
    otp.attempts,
    otp.max_attempts,
    otp.verified
  FROM otp_codes otp
  WHERE otp.phone_number = p_phone_number
    AND otp.verified = false
    AND otp.expires_at > NOW()
  ORDER BY otp.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to increment OTP attempts
CREATE OR REPLACE FUNCTION increment_otp_attempts(otp_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_attempts INTEGER;
BEGIN
  UPDATE otp_codes 
  SET attempts = attempts + 1,
      updated_at = NOW()
  WHERE id = otp_id
  RETURNING attempts INTO new_attempts;
  
  RETURN COALESCE(new_attempts, 0);
END;
$$;

-- Function to mark OTP as verified
CREATE OR REPLACE FUNCTION mark_otp_verified(otp_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE otp_codes 
  SET verified = true,
      updated_at = NOW()
  WHERE id = otp_id;
  
  RETURN FOUND;
END;
$$;

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_active_otp(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_otp_attempts(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_otp_verified(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO anon, authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_verified_expires 
ON otp_codes(phone_number, verified, expires_at);

-- Create index for cleanup
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires 
ON otp_codes(expires_at);
