# Phone Conflict Fix - User Profiles

## Problem
Getting error when trying to create/update user profiles:
```
{
    "code": "23505",
    "details": null,
    "hint": null,
    "message": "duplicate key value violates unique constraint \"user_profiles_phone_unique\""
}
```

## Root Cause
The `user_profiles` table has a unique constraint on the `phone` column (`user_profiles_phone_unique`), but the upsert logic was only handling conflicts on the `id` column. When a user tries to log in with a phone number that already exists but with a different user ID, it causes a phone constraint violation.

## Database Schema
```sql
-- Unique constraint on phone column
ALTER TABLE "public"."user_profiles" 
ADD CONSTRAINT "user_profiles_phone_unique" UNIQUE ("phone");
```

## The Issue
1. User A registers with phone `+917050959444` and gets user ID `uuid-1`
2. User B tries to log in with the same phone `+917050959444` but gets a different user ID `uuid-2`
3. The system tries to create a new profile with `uuid-2` and phone `+917050959444`
4. This violates the unique constraint on the phone column

## Solution Applied

### 1. Enhanced Conflict Detection
Before creating/updating a user profile, the system now:
1. Checks if the phone number already exists with a different user ID
2. If conflict found, returns a clear error message
3. If no conflict, proceeds with normal upsert logic

### 2. Updated Authentication Files
- `src/lib/supabaseAuth.ts`: Added phone conflict detection
- `src/lib/supabaseAuthSimple.ts`: Same improvements applied

### 3. Better Error Handling
- Clear error messages for phone conflicts
- Graceful handling of constraint violations
- Proper logging for debugging

## Code Changes

### Before (Problematic)
```typescript
// Only checked for ID conflicts
const { data, error } = await supabase
  .from('user_profiles')
  .upsert(profileData, { 
    onConflict: 'id',  // Only handled ID conflicts
    ignoreDuplicates: false 
  })
```

### After (Fixed)
```typescript
// Check phone conflicts first
const { data: existingPhoneUser, error: phoneCheckError } = await supabase
  .from('user_profiles')
  .select('id, phone')
  .eq('phone', phone)
  .maybeSingle();

if (existingPhoneUser && existingPhoneUser.id !== userId) {
  // Phone conflict detected
  error = new Error('Phone number already registered with a different account');
} else {
  // Safe to proceed with upsert
  // ... normal upsert logic
}
```

## Expected Behavior

### Scenario 1: New User (No Conflict)
- Phone: `+917050959444` (not in database)
- User ID: `new-uuid`
- Result: ✅ Profile created successfully

### Scenario 2: Existing User Login
- Phone: `+917050959444` (exists with same user ID)
- User ID: `existing-uuid` (same as in database)
- Result: ✅ Profile updated successfully

### Scenario 3: Phone Conflict
- Phone: `+917050959444` (exists with different user ID)
- User ID: `different-uuid` (different from database)
- Result: ❌ Clear error message: "Phone number already registered with a different account"

## Testing

### Test Phone Conflict Detection
```bash
# First, create a user profile
curl -X POST 'https://your-project.supabase.co/rest/v1/user_profiles' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "uuid-1",
    "phone": "+917050959444"
  }'

# Then try to create another profile with same phone but different ID
curl -X POST 'https://your-project.supabase.co/rest/v1/user_profiles' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "uuid-2",
    "phone": "+917050959444"
  }'
# Should return error: "duplicate key value violates unique constraint"
```

### Test OTP Flow
1. Register with phone `+917050959444`
2. Try to register again with same phone
3. Should get clear error message instead of constraint violation

## Benefits
- ✅ Prevents phone constraint violations
- ✅ Clear error messages for users
- ✅ Better debugging information
- ✅ Maintains data integrity
- ✅ Graceful error handling

## Files Modified
- `src/lib/supabaseAuth.ts` - Enhanced conflict detection
- `src/lib/supabaseAuthSimple.ts` - Same improvements
- `PHONE_CONFLICT_FIX.md` - This documentation

## Next Steps
1. Test the fix with duplicate phone numbers
2. Verify OTP authentication flow works correctly
3. Monitor logs for any remaining constraint violations
4. Consider implementing phone number transfer functionality if needed
