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
