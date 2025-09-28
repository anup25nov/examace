-- Alternative fix for referral_codes RLS policies
-- This keeps RLS enabled but creates more permissive policies for custom authentication

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own referral codes" ON "public"."referral_codes";
DROP POLICY IF EXISTS "Users can update own referral codes" ON "public"."referral_codes";
DROP POLICY IF EXISTS "Users can view own referral codes" ON "public"."referral_codes";

-- Create new permissive policies for custom authentication
CREATE POLICY "Allow all operations on referral_codes" ON "public"."referral_codes"
    FOR ALL USING (true) WITH CHECK (true);

-- Alternative: More restrictive but still compatible with custom auth
-- CREATE POLICY "Allow authenticated users to manage referral codes" ON "public"."referral_codes"
--     FOR ALL USING (
--         -- Allow if user exists in user_profiles (for custom auth)
--         EXISTS (
--             SELECT 1 FROM user_profiles 
--             WHERE user_profiles.id = referral_codes.user_id
--         )
--         OR 
--         -- Allow if using Supabase auth
--         (auth.uid() IS NOT NULL AND auth.uid() = referral_codes.user_id)
--     );

-- Grant necessary permissions
GRANT ALL ON TABLE "public"."referral_codes" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes" TO "authenticated";

-- Add a comment explaining the change
COMMENT ON TABLE "public"."referral_codes" IS 'Referral codes table - RLS enabled with permissive policies for custom authentication';

-- Verify the changes
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'referral_codes';

-- Show current policies
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
