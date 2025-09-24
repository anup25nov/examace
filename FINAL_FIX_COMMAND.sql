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
    "created_at" timestamp with time zone
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
      qr.test_id::integer,
      qr.report_type,
      qr.description,
      qr.user_id,
      qr.status,
      qr.created_at
    FROM question_reports qr
    WHERE qr.status = 'pending'
    ORDER BY qr.created_at DESC;
  ELSE
    RETURN;
  END IF;
END;
$$;
