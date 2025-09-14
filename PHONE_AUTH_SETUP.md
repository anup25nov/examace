# Phone Authentication Setup Guide

## Issue: "Unsupported phone provider" Error

The error `AuthApiError: Unsupported phone provider` occurs because Supabase needs to be configured with an SMS provider to send OTP codes to phone numbers.

## Solution: Configure SMS Provider in Supabase

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **Authentication** → **Settings** → **Phone Auth**

### Step 2: Configure SMS Provider
You have several options:

#### Option A: Twilio (Recommended for Production)
1. Sign up for a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token
3. In Supabase, select **Twilio** as provider
4. Enter your Twilio credentials:
   - Account SID
   - Auth Token
   - Phone Number (your Twilio phone number)

#### Option B: MessageBird
1. Sign up for MessageBird account
2. Get your API key
3. In Supabase, select **MessageBird** as provider
4. Enter your API key

#### Option C: Textlocal (For India)
1. Sign up for Textlocal account
2. Get your API key
3. In Supabase, select **Textlocal** as provider
4. Enter your API key

### Step 3: Test Configuration
1. Save the configuration
2. Test by sending an OTP to your phone number
3. Verify that you receive the SMS

## Alternative: Use Email OTP for Testing

If you want to test the authentication flow without setting up SMS, you can temporarily modify the code to use email OTP:

```typescript
// In supabaseAuth.ts, temporarily change:
const { error } = await supabase.auth.signInWithOtp({
  email: phone, // Use phone as email for testing
  options: {
    shouldCreateUser: true,
  }
});
```

## Important Notes

1. **SMS costs money** - Each OTP sent will cost a small amount
2. **Rate limiting** - Supabase has rate limits for OTP sending
3. **Phone number format** - Ensure phone numbers are in international format (+91XXXXXXXXXX)
4. **Testing** - Use your own phone number for testing to avoid charges

## Next Steps

1. Configure SMS provider in Supabase dashboard
2. Test the phone authentication flow
3. Remove this setup guide file once everything is working

## Troubleshooting

- **Still getting "Unsupported phone provider"**: Check if SMS provider is properly configured and enabled
- **OTP not received**: Check phone number format and SMS provider logs
- **Rate limit exceeded**: Wait a few minutes before trying again
