# 🚀 Supabase Migration Steps

## ❌ **Current Issue**
The `user_profiles` table doesn't have an `email` column, causing authentication to fail.

## ✅ **Solution: Add Email Column**

### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**

### **Step 2: Run This SQL**
Copy and paste this SQL into the SQL Editor and run it:

```sql
-- Add email column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Update existing records to use phone as email (temporary migration)
UPDATE user_profiles 
SET email = CONCAT(phone, '@examace.local')
WHERE email IS NULL AND phone IS NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN user_profiles.email IS 'User email address for authentication';
```

### **Step 3: Verify the Migration**
After running the SQL, check that:
1. The `user_profiles` table now has an `email` column
2. Existing records have been updated with email values

### **Step 4: Test Authentication**
1. Try the email authentication flow
2. Check that user profiles are created successfully
3. Verify that authentication completes without errors

## 🎯 **Expected Result**
- ✅ Email column added to user_profiles table
- ✅ Authentication works with email only
- ✅ No more phone-related errors
- ✅ User profiles created successfully
- ✅ Authentication completes successfully

## 🚨 **If Migration Fails**
If you get any errors during migration:
1. Check if the `user_profiles` table exists
2. Verify you have the correct permissions
3. Try running the SQL commands one by one

**Run this migration and the authentication will work perfectly!** 🚀
