-- Fix RLS policies for referral_codes table
-- This addresses the issue where custom authentication doesn't work with auth.uid() policies

-- Option 1: Disable RLS for referral_codes table (Recommended for custom auth)
-- This allows the anon key to access referral_codes when using custom authentication
ALTER TABLE "public"."referral_codes" DISABLE ROW LEVEL SECURITY;

-- Alternative Option 2: Create custom policies that work with custom authentication
-- Uncomment these if you prefer to keep RLS enabled but with custom policies

-- DROP POLICY IF EXISTS "Users can insert own referral codes" ON "public"."referral_codes";
-- DROP POLICY IF EXISTS "Users can update own referral codes" ON "public"."referral_codes";
-- DROP POLICY IF EXISTS "Users can view own referral codes" ON "public"."referral_codes";

-- Create new policies that allow anon access for custom authentication
-- CREATE POLICY "Allow anon access for referral codes" ON "public"."referral_codes"
--     FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON TABLE "public"."referral_codes" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes" TO "authenticated";

-- Add a comment explaining the change
COMMENT ON TABLE "public"."referral_codes" IS 'Referral codes table - RLS disabled for custom authentication compatibility';

-- Verify the changes
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'referral_codes';

-- Show current policies (should be empty after disabling RLS)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'referral_codes';
