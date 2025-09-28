-- Comprehensive RLS fix for all remaining tables that might have issues
-- This script disables RLS and grants necessary permissions for all tables used by the application

-- Fix question_reports table
ALTER TABLE "public"."question_reports" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."question_reports" TO "anon";
GRANT ALL ON TABLE "public"."question_reports" TO "authenticated";

-- Fix user_memberships table
ALTER TABLE "public"."user_memberships" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."user_memberships" TO "anon";
GRANT ALL ON TABLE "public"."user_memberships" TO "authenticated";

-- Fix membership_plans table
ALTER TABLE "public"."membership_plans" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."membership_plans" TO "anon";
GRANT ALL ON TABLE "public"."membership_plans" TO "authenticated";

-- Fix user_messages table
ALTER TABLE "public"."user_messages" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."user_messages" TO "anon";
GRANT ALL ON TABLE "public"."user_messages" TO "authenticated";

-- Fix user_profiles table (if not already fixed)
ALTER TABLE "public"."user_profiles" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";

-- Fix payments table (if not already fixed)
ALTER TABLE "public"."payments" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";

-- Fix test_attempts table (if not already fixed)
ALTER TABLE "public"."test_attempts" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."test_attempts" TO "anon";
GRANT ALL ON TABLE "public"."test_attempts" TO "authenticated";

-- Fix exam_stats table (if not already fixed)
ALTER TABLE "public"."exam_stats" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."exam_stats" TO "anon";
GRANT ALL ON TABLE "public"."exam_stats" TO "authenticated";

-- Fix test_completions table (if not already fixed)
ALTER TABLE "public"."test_completions" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."test_completions" TO "anon";
GRANT ALL ON TABLE "public"."test_completions" TO "authenticated";

-- Fix referral_codes table (if not already fixed)
ALTER TABLE "public"."referral_codes" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."referral_codes" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes" TO "authenticated";

-- Verify the changes
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN (
    'question_reports',
    'user_memberships', 
    'membership_plans',
    'user_messages',
    'user_profiles',
    'payments',
    'test_attempts',
    'exam_stats',
    'test_completions',
    'referral_codes'
)
ORDER BY tablename;
