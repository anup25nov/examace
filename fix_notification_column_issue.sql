-- Fix the send_question_report_status_message function to use correct column name
-- The table uses 'content' column, not 'message' column

CREATE OR REPLACE FUNCTION send_question_report_status_message(
    p_user_id uuid, 
    p_report_id uuid, 
    p_status character varying, 
    p_admin_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title VARCHAR(200);
  v_message TEXT;
  v_exam_id VARCHAR(50);
  v_test_type VARCHAR(50);
  v_report_type VARCHAR(50);
  v_question_id VARCHAR(100);
  v_test_id VARCHAR(100);
BEGIN
  -- Get report details
  SELECT exam_id, test_type, report_type, question_id, test_id 
  INTO v_exam_id, v_test_type, v_report_type, v_question_id, v_test_id
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
        'Your report for ', UPPER(v_exam_id), ' ', v_test_type, 
        ' Test ', v_test_id, ' Question ', v_question_id,
        ' (', v_report_type, ') has been resolved. '
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || 'Note: ' || p_admin_notes;
      ELSE
        v_message := v_message || 'Thank you for helping improve our content.';
      END IF;
    WHEN 'rejected' THEN
      v_title := 'Question Report Rejected';
      v_message := CONCAT(
        'Your report for ', UPPER(v_exam_id), ' ', v_test_type, 
        ' Test ', v_test_id, ' Question ', v_question_id,
        ' (', v_report_type, ') was not accepted. '
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || 'Reason: ' || p_admin_notes;
      ELSE
        v_message := v_message || 'Contact support if you believe this is an error.';
      END IF;
    ELSE
      RETURN false;
  END CASE;
  
  -- Insert the message using 'content' column (not 'message')
  INSERT INTO user_messages (user_id, message_type, title, content)
  VALUES (p_user_id, 'question_report_' || p_status, v_title, v_message);
  
  RETURN true;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_question_report_status_message(uuid, uuid, character varying, text) TO authenticated;
GRANT EXECUTE ON FUNCTION send_question_report_status_message(uuid, uuid, character varying, text) TO anon;

-- Test the function
-- SELECT send_question_report_status_message(
--     'aea4b9df-d1d6-4701-b33c-480a5d17ec87'::uuid,
--     'some-report-id'::uuid,
--     'resolved',
--     'Test message'
-- );
