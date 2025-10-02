-- Fix all notification issues and add withdrawal notifications

-- 1. Fix the send_question_report_status_message function to use correct column
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

-- 2. Create withdrawal notification function
CREATE OR REPLACE FUNCTION send_withdrawal_status_message(
    p_user_id uuid,
    p_withdrawal_id uuid,
    p_status character varying,
    p_amount numeric,
    p_admin_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title VARCHAR(200);
  v_message TEXT;
BEGIN
  -- Create appropriate message based on status
  CASE p_status
    WHEN 'approved' THEN
      v_title := 'Withdrawal Request Approved';
      v_message := CONCAT(
        'Your withdrawal request of ₹', p_amount, ' has been approved and will be processed within 2-3 business days.'
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || ' Admin Notes: ' || p_admin_notes;
      END IF;
    WHEN 'rejected' THEN
      v_title := 'Withdrawal Request Rejected';
      v_message := CONCAT(
        'Your withdrawal request of ₹', p_amount, ' has been rejected.'
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || ' Reason: ' || p_admin_notes;
      ELSE
        v_message := v_message || ' Please contact support for more information.';
      END IF;
    ELSE
      RETURN false;
  END CASE;
  
  -- Insert the message using 'content' column
  INSERT INTO user_messages (user_id, message_type, title, content)
  VALUES (p_user_id, 'withdrawal_' || p_status, v_title, v_message);
  
  RETURN true;
END;
$$;

-- 3. Update process_withdrawal_request_with_message to send notifications
CREATE OR REPLACE FUNCTION process_withdrawal_request_with_message(
    request_id uuid, 
    admin_user_id uuid, 
    action text, 
    admin_notes text DEFAULT NULL
)
RETURNS TABLE(
    success boolean, 
    message text, 
    withdrawal_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    withdrawal_record RECORD;
    v_admin_notes TEXT := admin_notes;
    notification_sent boolean := false;
BEGIN
    -- Get the withdrawal request from withdrawal_requests table
    SELECT * INTO withdrawal_record
    FROM withdrawal_requests
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Withdrawal request not found', NULL::uuid;
        RETURN;
    END IF;
    
    -- Check if already processed
    IF withdrawal_record.status IN ('approved', 'rejected', 'completed') THEN
        RETURN QUERY SELECT false, 'Withdrawal request already processed', NULL::uuid;
        RETURN;
    END IF;
    
    -- Process based on action
    IF action = 'approved' THEN
        -- Update withdrawal status
        UPDATE withdrawal_requests
        SET 
            status = 'approved',
            admin_notes = COALESCE(v_admin_notes, 'Approved by admin'),
            processed_by = admin_user_id,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = request_id;
        
        -- Send notification to user
        SELECT send_withdrawal_status_message(
            withdrawal_record.user_id,
            request_id,
            'approved',
            withdrawal_record.amount,
            v_admin_notes
        ) INTO notification_sent;
        
        RETURN QUERY SELECT true, 'Withdrawal request approved successfully', request_id;
        RETURN;
        
    ELSIF action = 'rejected' THEN
        -- Update withdrawal status
        UPDATE withdrawal_requests
        SET 
            status = 'rejected',
            admin_notes = COALESCE(v_admin_notes, 'Rejected by admin'),
            processed_by = admin_user_id,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = request_id;
        
        -- Send notification to user
        SELECT send_withdrawal_status_message(
            withdrawal_record.user_id,
            request_id,
            'rejected',
            withdrawal_record.amount,
            v_admin_notes
        ) INTO notification_sent;
        
        RETURN QUERY SELECT true, 'Withdrawal request rejected successfully', request_id;
        RETURN;
        
    ELSE
        RETURN QUERY SELECT false, 'Invalid action. Use "approved" or "rejected"', NULL::uuid;
        RETURN;
    END IF;
    
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_question_report_status_message(uuid, uuid, character varying, text) TO authenticated;
GRANT EXECUTE ON FUNCTION send_withdrawal_status_message(uuid, uuid, character varying, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION process_withdrawal_request_with_message(uuid, uuid, text, text) TO authenticated;

GRANT EXECUTE ON FUNCTION send_question_report_status_message(uuid, uuid, character varying, text) TO anon;
GRANT EXECUTE ON FUNCTION send_withdrawal_status_message(uuid, uuid, character varying, numeric, text) TO anon;
GRANT EXECUTE ON FUNCTION process_withdrawal_request_with_message(uuid, uuid, text, text) TO anon;
