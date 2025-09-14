-- Add messaging functionality for question report resolution

-- 1. Create function to send question report status message
CREATE OR REPLACE FUNCTION send_question_report_status_message(
  p_user_id UUID,
  p_report_id UUID,
  p_status VARCHAR(20), -- 'resolved' or 'rejected'
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_title VARCHAR(200);
  v_message TEXT;
  v_exam_id VARCHAR(50);
  v_test_type VARCHAR(50);
  v_report_type VARCHAR(50);
BEGIN
  -- Get report details
  SELECT exam_id, test_type, report_type INTO v_exam_id, v_test_type, v_report_type
  FROM question_reports
  WHERE id = p_report_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Create appropriate message based on status
  CASE p_status
    WHEN 'resolved' THEN
      v_title := 'Question Report Resolved';
      v_message := CONCAT(
        'Your question report for ', v_exam_id, ' - ', v_test_type, 
        ' (Issue: ', v_report_type, ') has been reviewed and resolved. '
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || 'Admin notes: ' || p_admin_notes;
      ELSE
        v_message := v_message || 'Thank you for helping us improve our content quality.';
      END IF;
    WHEN 'rejected' THEN
      v_title := 'Question Report Rejected';
      v_message := CONCAT(
        'Your question report for ', v_exam_id, ' - ', v_test_type, 
        ' (Issue: ', v_report_type, ') has been reviewed but was not accepted. '
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || 'Reason: ' || p_admin_notes;
      ELSE
        v_message := v_message || 'Please contact support if you believe this is an error.';
      END IF;
    ELSE
      RETURN false;
  END CASE;
  
  -- Insert the message
  INSERT INTO user_messages (user_id, message_type, title, message, related_id)
  VALUES (p_user_id, 'question_report_' || p_status, v_title, v_message, p_report_id);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update resolve_question_report function to send messages
CREATE OR REPLACE FUNCTION resolve_question_report(
  report_id UUID,
  admin_user_id UUID,
  resolution VARCHAR(20), -- 'resolved' or 'rejected'
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_success BOOLEAN;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_user_id) THEN
    RETURN false;
  END IF;
  
  -- Get user_id from question report
  SELECT user_id INTO v_user_id
  FROM question_reports
  WHERE id = report_id AND status = 'pending';
  
  IF NOT FOUND THEN
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
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Send status message to user
  v_success := send_question_report_status_message(v_user_id, report_id, resolution, admin_notes);
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION send_question_report_status_message(UUID, UUID, VARCHAR(20), TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_question_report(UUID, UUID, VARCHAR(20), TEXT) TO authenticated;
