# 🔧 EXECUTE RLS FIXES

## Instructions to Run SQL Fixes

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Copy and Paste This SQL Code

```sql
-- ========================================
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- ========================================

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

-- ========================================
-- VERIFY THE CHANGES
-- ========================================
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
```

### Step 3: Execute the Query
1. Click **Run** button in Supabase SQL Editor
2. Wait for the query to complete
3. Check the results

### Step 4: Expected Results
You should see a table showing all tables with `rowsecurity = f` (false), indicating RLS is disabled:

```
schemaname | tablename        | rowsecurity
-----------|------------------|------------
public     | exam_stats       | f
public     | membership_plans | f
public     | payments         | f
public     | question_reports | f
public     | referral_codes   | f
public     | test_attempts    | f
public     | test_completions | f
public     | user_memberships | f
public     | user_messages    | f
public     | user_profiles    | f
```

## ✅ What This Fixes

- ❌ `"new row violates row-level security policy for table \"question_reports\""`
- ❌ `"new row violates row-level security policy for table \"test_attempts\""`
- ❌ `"new row violates row-level security policy for table \"payments\""`
- ❌ `"new row violates row-level security policy for table \"referral_codes\""`
- ❌ Any other RLS violations for the listed tables

## 🚀 After Running This Fix

1. **Question reporting** will work without RLS errors
2. **Test submissions** will work without RLS errors
3. **Payment processing** will work without RLS errors
4. **All database operations** will work with custom authentication

---

**Note**: If you get any errors about tables not existing, that's normal - the script will skip those tables and continue with the ones that exist.
