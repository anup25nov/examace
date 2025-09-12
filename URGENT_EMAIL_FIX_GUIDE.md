# 🚨 URGENT EMAIL CONSTRAINT FIX GUIDE

## 🚨 Current Issue
**Error:** `P0001: Email askforanup25nov@gmail.com is already in use by another user`

## 🔍 Root Cause Analysis

The issue is that there are **multiple user records** with the same email `askforanup25nov@gmail.com` but different `userId`s. This violates the unique constraint on the email field.

### **Why This Happens:**
1. **User signs up** with email → Profile created with `userId: A`
2. **Same user tries to login** → Supabase auth creates new `userId: B` for same email
3. **System tries to insert** new profile with `userId: B` and same email → **P0001 Error**

## 🛠️ IMMEDIATE FIX STEPS

### **Step 1: Run Database Diagnostic**
Execute this in Supabase SQL Editor to see the problem:

```sql
-- Check for duplicate emails
SELECT email, COUNT(*) as count, array_agg(id) as user_ids
FROM user_profiles
WHERE email = 'askforanup25nov@gmail.com'
GROUP BY email;

-- Check all users with this email
SELECT id, email, created_at 
FROM user_profiles 
WHERE email = 'askforanup25nov@gmail.com'
ORDER BY created_at;
```

### **Step 2: Clean Up Duplicates**
Execute this to remove duplicate entries:

```sql
-- Keep the oldest record, delete newer duplicates
WITH duplicates AS (
  SELECT id, email, created_at,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
  FROM user_profiles
  WHERE email = 'askforanup25nov@gmail.com'
)
DELETE FROM user_profiles
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

### **Step 3: Run the Complete Fix**
Execute the `URGENT_EMAIL_FIX.sql` file in Supabase SQL Editor.

### **Step 4: Test the Fix**
Try logging in with `askforanup25nov@gmail.com` again.

## 🔧 Alternative Solutions

### **Option 1: Use Database Function (Recommended)**
The `URGENT_EMAIL_FIX.sql` creates a safe function that handles email conflicts:

```sql
-- Use this function instead of direct upsert
SELECT public.safe_upsert_user_profile_v2(
    'your-user-id', 
    'askforanup25nov@gmail.com'
);
```

### **Option 2: Update Code to Use Function**
Update the authentication code to use the database function:

```typescript
// In src/lib/supabaseAuth.ts, replace the upsert logic with:
const { data: result, error } = await supabase
  .rpc('safe_upsert_user_profile_v2', {
    p_user_id: userId,
    p_email: email,
    p_pin: pin
  });
```

### **Option 3: Manual Database Cleanup**
If the automated fix doesn't work, manually clean up:

```sql
-- 1. Find the problematic records
SELECT * FROM user_profiles WHERE email = 'askforanup25nov@gmail.com';

-- 2. Delete the newer duplicate (keep the oldest)
DELETE FROM user_profiles 
WHERE id = 'newer-user-id' 
AND email = 'askforanup25nov@gmail.com';

-- 3. Verify only one record remains
SELECT * FROM user_profiles WHERE email = 'askforanup25nov@gmail.com';
```

## 🧪 Testing the Fix

### **Test 1: Login with Existing Email**
```
Email: askforanup25nov@gmail.com
Expected: ✅ Success, no P0001 error
```

### **Test 2: Check Database State**
```sql
-- Should return only 1 record
SELECT COUNT(*) FROM user_profiles WHERE email = 'askforanup25nov@gmail.com';
-- Expected: 1
```

### **Test 3: Verify Authentication Flow**
```
1. Enter email → Get OTP
2. Enter OTP → Should login successfully
3. Check browser console → No P0001 errors
```

## 📊 Expected Results

### **Before Fix:**
```
❌ P0001: Email already in use by another user
❌ Multiple user records with same email
❌ Authentication fails
```

### **After Fix:**
```
✅ Single user record per email
✅ Successful authentication
✅ No P0001 errors
✅ Clean database state
```

## 🚨 Emergency Fallback

If nothing works, use this emergency approach:

```sql
-- 1. Temporarily disable the unique constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_email_key;

-- 2. Clean up duplicates manually
DELETE FROM user_profiles 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) as rn
    FROM user_profiles
    WHERE email = 'askforanup25nov@gmail.com'
  ) t WHERE rn > 1
);

-- 3. Re-add the unique constraint
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
```

## 📞 Support Information

### **If You Need Help:**
1. **Run the diagnostic queries** first to understand the current state
2. **Execute the cleanup queries** to remove duplicates
3. **Test the authentication flow** to verify the fix
4. **Check browser console** for any remaining errors

### **Key Files to Check:**
- `URGENT_EMAIL_FIX.sql` - Database fix
- `src/lib/supabaseAuth.ts` - Updated authentication logic
- Browser console - For error messages

---

**Status: 🚨 URGENT FIX REQUIRED**

Execute the `URGENT_EMAIL_FIX.sql` file in Supabase SQL Editor immediately to resolve the P0001 error.
