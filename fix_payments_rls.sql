-- =====================================================
-- FIX PAYMENTS TABLE RLS POLICIES
-- =====================================================
-- This file fixes the duplicate RLS policies on the payments table
-- that are causing the "new row violates row-level security policy" error

-- Drop all existing policies on payments table
DROP POLICY IF EXISTS "Users can insert own payments" ON "public"."payments";
DROP POLICY IF EXISTS "Users can update own payments" ON "public"."payments";
DROP POLICY IF EXISTS "Users can view own payments" ON "public"."payments";
DROP POLICY IF EXISTS "payments_owner" ON "public"."payments";
DROP POLICY IF EXISTS "payments_owner_insert" ON "public"."payments";
DROP POLICY IF EXISTS "payments_owner_select" ON "public"."payments";
DROP POLICY IF EXISTS "payments_owner_update" ON "public"."payments";

-- Create clean, non-conflicting policies
CREATE POLICY "payments_select_own" ON "public"."payments" 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "payments_insert_own" ON "public"."payments" 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments_update_own" ON "public"."payments" 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all payments (for backend operations)
CREATE POLICY "payments_service_role_all" ON "public"."payments" 
    FOR ALL 
    TO service_role 
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to insert payments (for payment processing)
CREATE POLICY "payments_authenticated_insert" ON "public"."payments" 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "service_role";

-- Verify policies were created
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
WHERE tablename = 'payments' 
ORDER BY policyname;
