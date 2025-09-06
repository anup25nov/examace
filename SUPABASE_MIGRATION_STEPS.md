# 🚀 Supabase Migration Steps

## ❌ **Current Issue**
The `user_profiles` table needs to be configured for PIN-based authentication system where users can set a 6-digit PIN after first OTP verification for quick subsequent logins.

## ✅ **Solution: Configure PIN-Based Authentication**

### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**

### **Step 2: Run This SQL**
Copy and paste this SQL into the SQL Editor and run it:

```sql
-- Configure user_profiles table for PIN-based authentication
-- This migration ensures email and PIN columns are properly configured

-- First, ensure email column exists and is properly configured
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Ensure PIN column exists (6-digit PIN for quick login)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS pin VARCHAR(6);

-- Add comments to document the changes
COMMENT ON COLUMN user_profiles.email IS 'User email address for authentication';
COMMENT ON COLUMN user_profiles.pin IS '6-digit PIN for quick login (optional)';

-- Update any existing records that might have NULL email
UPDATE user_profiles 
SET email = CONCAT('user_', id, '@examace.local')
WHERE email IS NULL;
```

### **Step 3: Verify the Migration**
After running the SQL, check that:
1. The `user_profiles` table has both `email` and `pin` columns
2. Existing records have been updated with email values
3. PIN column is properly configured as VARCHAR(6)

### **Step 4: Test Authentication Flow**
1. **New User Flow**: Email → OTP → Set PIN → Login
2. **Returning User Flow**: Email → PIN → Login
3. **Forgot PIN Flow**: Email → OTP → Reset PIN → Login

## 🎯 **Expected Result**
- ✅ **First-time users**: Email + OTP + PIN setup
- ✅ **Returning users**: Email + PIN (fast login)
- ✅ **Forgot PIN**: Email + OTP to reset PIN
- ✅ **No phone dependencies**: Pure email-based system
- ✅ **Fast subsequent logins**: PIN-based authentication

## 🚨 **If Migration Fails**
If you get any errors during migration:
1. Check if the `user_profiles` table exists
2. Verify you have the correct permissions
3. Try running the SQL commands one by one

**Run this migration and the authentication will work perfectly!** 🚀
