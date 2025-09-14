-- Question Reports and Withdrawal System

-- 1. Create question_reports table
CREATE TABLE IF NOT EXISTS question_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL,
  test_id VARCHAR(100) NOT NULL,
  question_id VARCHAR(100) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'wrong_question', 'wrong_answer', 'wrong_option', 'wrong_explanation'
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'resolved', 'rejected'
  admin_notes TEXT,
  resolved_by UUID REFERENCES user_profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'bank_transfer', 'upi', 'paytm', etc.
  payment_details JSONB NOT NULL, -- Bank details, UPI ID, etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
  admin_notes TEXT,
  processed_by UUID REFERENCES user_profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create admin_users table for whitelisted admins
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'super_admin'
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create question_images table for image support
CREATE TABLE IF NOT EXISTS question_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id VARCHAR(100) NOT NULL,
  image_type VARCHAR(20) NOT NULL, -- 'question', 'option', 'explanation'
  image_url TEXT NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_reports_user_id ON question_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_exam_test ON question_reports(exam_id, test_type, test_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_question_images_question_id ON question_images(question_id);

-- 6. Create functions for admin operations

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = user_uuid AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get all pending question reports
CREATE OR REPLACE FUNCTION get_pending_question_reports()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_phone TEXT,
  exam_id VARCHAR(50),
  test_type VARCHAR(20),
  test_id VARCHAR(100),
  question_id VARCHAR(100),
  report_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qr.id,
    qr.user_id,
    up.phone,
    qr.exam_id,
    qr.test_type,
    qr.test_id,
    qr.question_id,
    qr.report_type,
    qr.description,
    qr.created_at
  FROM question_reports qr
  LEFT JOIN user_profiles up ON qr.user_id = up.id
  WHERE qr.status = 'pending'
  ORDER BY qr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get all pending withdrawal requests
CREATE OR REPLACE FUNCTION get_pending_withdrawal_requests()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_phone TEXT,
  amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wr.id,
    wr.user_id,
    up.phone,
    wr.amount,
    wr.payment_method,
    wr.payment_details,
    wr.created_at
  FROM withdrawal_requests wr
  LEFT JOIN user_profiles up ON wr.user_id = up.id
  WHERE wr.status = 'pending'
  ORDER BY wr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to resolve question report
CREATE OR REPLACE FUNCTION resolve_question_report(
  report_id UUID,
  admin_user_id UUID,
  resolution VARCHAR(20), -- 'resolved' or 'rejected'
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_user_id) THEN
    RETURN false;
  END IF;
  
  -- Update the report
  UPDATE question_reports
  SET 
    status = resolution,
    admin_notes = admin_notes,
    resolved_by = admin_user_id,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = report_id AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to process withdrawal request
CREATE OR REPLACE FUNCTION process_withdrawal_request(
  request_id UUID,
  admin_user_id UUID,
  action VARCHAR(20), -- 'approved' or 'rejected'
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_user_id) THEN
    RETURN false;
  END IF;
  
  -- Update the withdrawal request
  UPDATE withdrawal_requests
  SET 
    status = action,
    admin_notes = admin_notes,
    processed_by = admin_user_id,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user can make withdrawal request
CREATE OR REPLACE FUNCTION can_make_withdrawal_request(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has any pending withdrawal request
  RETURN NOT EXISTS (
    SELECT 1 FROM withdrawal_requests 
    WHERE user_id = user_uuid AND status IN ('pending', 'approved')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Enable RLS
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_images ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies

-- Question reports policies
CREATE POLICY "Users can view own question reports" ON question_reports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own question reports" ON question_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Withdrawal requests policies
CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own withdrawal requests" ON withdrawal_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin users policies (admin only)
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (is_admin(auth.uid()));

-- Question images policies (public read)
CREATE POLICY "Anyone can view question images" ON question_images
  FOR SELECT USING (true);

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_question_reports() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_withdrawal_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_question_report(UUID, UUID, VARCHAR(20), TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_withdrawal_request(UUID, UUID, VARCHAR(20), TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_make_withdrawal_request(UUID) TO authenticated;
