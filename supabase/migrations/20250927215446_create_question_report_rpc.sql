-- Create RPC function for question reports to bypass RLS
CREATE OR REPLACE FUNCTION "public"."submit_question_report"(
    "p_user_id" "uuid",
    "p_exam_id" character varying,
    "p_test_type" character varying,
    "p_test_id" character varying,
    "p_question_id" character varying,
    "p_report_type" character varying,
    "p_description" text DEFAULT NULL
)
RETURNS TABLE("id" "uuid")
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    v_report_id uuid;
BEGIN
    -- Validate that user exists in user_profiles
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;
    
    -- Insert the question report
    INSERT INTO question_reports (
        user_id,
        exam_id,
        test_type,
        test_id,
        question_id,
        report_type,
        description,
        status
    ) VALUES (
        p_user_id,
        p_exam_id,
        p_test_type,
        p_test_id,
        p_question_id,
        p_report_type,
        p_description,
        'pending'
    ) RETURNING id INTO v_report_id;
    
    -- Return the report ID
    RETURN QUERY SELECT v_report_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION "public"."submit_question_report" TO "anon";
GRANT EXECUTE ON FUNCTION "public"."submit_question_report" TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."submit_question_report" TO "service_role";

-- Also create a function to check existing reports
CREATE OR REPLACE FUNCTION "public"."check_existing_question_report"(
    "p_user_id" "uuid",
    "p_exam_id" character varying,
    "p_test_type" character varying,
    "p_test_id" character varying,
    "p_question_id" character varying
)
RETURNS TABLE("has_pending_report" boolean)
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT EXISTS(
        SELECT 1 FROM question_reports 
        WHERE user_id = p_user_id
          AND exam_id = p_exam_id
          AND test_type = p_test_type
          AND test_id = p_test_id
          AND question_id = p_question_id
          AND status = 'pending'
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION "public"."check_existing_question_report" TO "anon";
GRANT EXECUTE ON FUNCTION "public"."check_existing_question_report" TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."check_existing_question_report" TO "service_role";
