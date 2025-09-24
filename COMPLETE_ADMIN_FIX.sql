-- Fix 1: Update get_pending_question_reports function to return all required fields
CREATE OR REPLACE FUNCTION "public"."get_pending_question_reports"() 
RETURNS TABLE(
    "id" "uuid", 
    "exam_id" character varying, 
    "question_id" character varying, 
    "question_number" integer,        
    "issue_type" character varying,   
    "issue_description" "text",       
    "user_id" "uuid", 
    "status" character varying, 
    "created_at" timestamp with time zone,
    "user_phone" character varying,
    "test_type" character varying,
    "test_id" character varying
)
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_reports') THEN
    RETURN QUERY
    SELECT 
      qr.id,
      qr.exam_id,
      qr.question_id,
      COALESCE(
        CASE 
          WHEN qr.test_id ~ '^[0-9]+$' THEN qr.test_id::integer
          ELSE 0
        END,
        0
      ) as question_number,
      qr.report_type as issue_type,
      qr.description as issue_description,
      qr.user_id,
      qr.status,
      qr.created_at,
      up.phone as user_phone,
      qr.test_type,
      qr.test_id
    FROM question_reports qr
    LEFT JOIN user_profiles up ON qr.user_id = up.id
    WHERE qr.status = 'pending'
    ORDER BY qr.created_at DESC;
  ELSE
    RETURN;
  END IF;
END;
$$;

-- Fix 2: Update send_question_report_status_message function to use 'content' instead of 'message'
CREATE OR REPLACE FUNCTION "public"."send_question_report_status_message"(
    "p_user_id" "uuid", 
    "p_report_id" "uuid", 
    "p_status" character varying, 
    "p_admin_notes" "text"
) RETURNS "boolean"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_exam_id VARCHAR(50);
  v_test_type VARCHAR(20);
  v_report_type VARCHAR(50);
  v_title TEXT;
  v_message TEXT;
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
  
  -- Insert the message using 'content' column instead of 'message'
  INSERT INTO user_messages (user_id, message_type, title, content, related_id)
  VALUES (p_user_id, 'question_report_' || p_status, v_title, v_message, p_report_id);
  
  RETURN true;
END;
$$;
