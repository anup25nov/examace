-- Fix type mismatches in admin functions by dropping and recreating

-- 1. Drop existing functions
DROP FUNCTION IF EXISTS get_pending_question_reports();
DROP FUNCTION IF EXISTS get_pending_withdrawal_requests();

-- 2. Recreate get_pending_question_reports function with correct types
CREATE OR REPLACE FUNCTION get_pending_question_reports()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_phone TEXT,
  exam_id TEXT,
  test_type TEXT,
  test_id TEXT,
  question_id TEXT,
  report_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qr.id,
    qr.user_id,
    up.phone::TEXT as user_phone,
    qr.exam_id::TEXT as exam_id,
    qr.test_type::TEXT as test_type,
    qr.test_id::TEXT as test_id,
    qr.question_id::TEXT as question_id,
    qr.report_type::TEXT as report_type,
    qr.description::TEXT as description,
    qr.created_at
  FROM question_reports qr
  LEFT JOIN user_profiles up ON qr.user_id = up.id
  WHERE qr.status = 'pending'
  ORDER BY qr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recreate get_pending_withdrawal_requests function with correct types
CREATE OR REPLACE FUNCTION get_pending_withdrawal_requests()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_phone TEXT,
  amount DECIMAL(10,2),
  payment_method TEXT,
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wr.id,
    wr.user_id,
    up.phone::TEXT as user_phone,
    wr.amount,
    wr.payment_method::TEXT as payment_method,
    wr.payment_details,
    wr.created_at
  FROM withdrawal_requests wr
  LEFT JOIN user_profiles up ON wr.user_id = up.id
  WHERE wr.status = 'pending'
  ORDER BY wr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_pending_question_reports() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_withdrawal_requests() TO authenticated;
