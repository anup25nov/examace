-- Fix RLS issue for question_reports table
-- This script disables RLS and grants necessary permissions

-- Disable RLS for question_reports table
ALTER TABLE "public"."question_reports" DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON TABLE "public"."question_reports" TO "anon";
GRANT ALL ON TABLE "public"."question_reports" TO "authenticated";

-- Optional: Add more permissive policies if disabling RLS is not desired
-- For example, to allow authenticated users to insert/select/update their own reports:

-- For question_reports
-- DROP POLICY IF EXISTS "Users can insert own question reports" ON "public"."question_reports";
-- CREATE POLICY "Users can insert own question reports" ON "public"."question_reports" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));
-- DROP POLICY IF EXISTS "Users can view own question reports" ON "public"."question_reports";
-- CREATE POLICY "Users can view own question reports" ON "public"."question_reports" FOR SELECT USING (("user_id" = "auth"."uid"()));
-- DROP POLICY IF EXISTS "Users can update own question reports" ON "public"."question_reports";
-- CREATE POLICY "Users can update own question reports" ON "public"."question_reports" FOR UPDATE USING (("user_id" = "auth"."uid"()));

-- Verify the changes
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'question_reports';
