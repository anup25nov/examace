# SMS Configuration Guide for Phone Authentication

## Current Issue: 500 Internal Server Error

The error `POST https://talvssmwnsfotoutjlhd.supabase.co/auth/v1/otp 500 (Internal Server Error)` occurs because:

1. **SMS Provider Not Configured**: Supabase needs an SMS provider to send OTP codes
2. **Database Trigger Issues**: The user creation trigger might be failing

## Solution 1: Configure SMS Provider (Required)

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project: https://supabase.com/dashboard/project/talvssmwnsfotoutjlhd
2. Navigate to **Authentication** → **Settings** → **Phone Auth**

### Step 2: Configure SMS Provider
Choose one of these options:

#### Option A: Twilio (Recommended for Production)
1. Sign up at https://www.twilio.com
2. Get your credentials:
   - Account SID
   - Auth Token  
   - Phone Number
3. In Supabase, select **Twilio** and enter credentials

#### Option B: Textlocal (Good for India)
1. Sign up at https://www.textlocal.in
2. Get your API key
3. In Supabase, select **Textlocal** and enter API key

#### Option C: MessageBird
1. Sign up at https://www.messagebird.com
2. Get your API key
3. In Supabase, select **MessageBird** and enter API key

### Step 3: Enable Phone Auth
1. Make sure **Phone Auth** is enabled in Authentication settings
2. Save the configuration
3. Test with your phone number

## Solution 2: Database Issues Fixed

I've already fixed the database trigger issues:

✅ **Fixed `handle_new_user` trigger** - Now handles errors gracefully
✅ **Added fallback user creation** - Ensures user profiles are created
✅ **Fixed referral code creation** - Direct database insertion instead of RPC
✅ **Added error handling** - Won't fail auth if profile creation fails

## Testing Steps

1. **Configure SMS Provider** (Required)
2. **Test Phone Authentication**:
   ```javascript
   // Try with your phone number
   const phone = "9876543210"; // Your 10-digit number
   const result = await sendOTPCode(phone);
   ```

3. **Check Console Logs** for any remaining errors

## Alternative: Use Email OTP for Testing

If you want to test without SMS setup, temporarily modify the code:

```typescript
// In supabaseAuth.ts, change line 19-24:
const { data, error } = await supabase.auth.signInWithOtp({
  email: `${phone}@test.com`, // Use phone as email for testing
  options: {
    shouldCreateUser: true
  }
});
```

## Important Notes

- **SMS costs money** - Each OTP costs ~₹0.50-1.00
- **Rate limiting** - Supabase limits OTP requests
- **Phone format** - Use 10-digit Indian numbers (9876543210)
- **Testing** - Use your own number to avoid charges

## Next Steps

1. **Configure SMS provider** in Supabase dashboard
2. **Test the authentication flow**
3. **Remove this guide** once everything works

The database issues are already fixed, so once you configure the SMS provider, the authentication should work perfectly! 🎉
