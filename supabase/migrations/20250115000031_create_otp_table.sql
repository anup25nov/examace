-- Create OTP table for storing OTPs with expiry
CREATE TABLE IF NOT EXISTS otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'custom',
  message_id VARCHAR(100),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_otps_phone_verified ON otps(phone, is_verified);

-- Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get active OTP for phone
CREATE OR REPLACE FUNCTION get_active_otp(phone_number VARCHAR)
RETURNS TABLE (
  id UUID,
  otp_code VARCHAR,
  provider VARCHAR,
  message_id VARCHAR,
  expires_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER,
  max_attempts INTEGER,
  is_verified BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.otp_code,
    o.provider,
    o.message_id,
    o.expires_at,
    o.attempts,
    o.max_attempts,
    o.is_verified,
    o.created_at
  FROM otps o
  WHERE o.phone = phone_number 
    AND o.expires_at > NOW() 
    AND o.is_verified = FALSE
  ORDER BY o.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment OTP attempts
CREATE OR REPLACE FUNCTION increment_otp_attempts(otp_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_attempts INTEGER;
BEGIN
  UPDATE otps 
  SET attempts = attempts + 1, updated_at = NOW()
  WHERE id = otp_id
  RETURNING attempts INTO current_attempts;
  
  RETURN current_attempts;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark OTP as verified
CREATE OR REPLACE FUNCTION mark_otp_verified(otp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE otps 
  SET is_verified = TRUE, updated_at = NOW()
  WHERE id = otp_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage OTPs" ON otps
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON otps TO service_role;
GRANT EXECUTE ON FUNCTION get_active_otp(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION increment_otp_attempts(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION mark_otp_verified(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO service_role;
