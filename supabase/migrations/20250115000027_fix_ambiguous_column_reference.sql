-- Fix ambiguous column reference in resolve_question_report function

-- Drop and recreate the function with proper column qualification
DROP FUNCTION IF EXISTS resolve_question_report(UUID, UUID, VARCHAR(20), TEXT);

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
  
  -- Update the report with proper column qualification
  UPDATE question_reports
  SET 
    status = resolution,
    admin_notes = resolve_question_report.admin_notes, -- Use function parameter
    resolved_by = admin_user_id,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = report_id AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION resolve_question_report(UUID, UUID, VARCHAR(20), TEXT) TO authenticated;
