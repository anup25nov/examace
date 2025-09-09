# SMS Integration Guide for Production OTP

## Overview
This guide explains how to integrate a real SMS service for sending OTP messages in production.

## Current Status
- ✅ Database functions are set up
- ✅ OTP generation and storage is working
- ⚠️ SMS sending is currently simulated (OTP logged to console)
- 🔄 **You need to integrate with a real SMS service**

## Recommended SMS Services

### 1. Twilio (Recommended)
- **Pros**: Reliable, good documentation, global coverage
- **Cost**: ~$0.0075 per SMS in India
- **Setup**: Easy integration

### 2. AWS SNS
- **Pros**: Scalable, integrates well with AWS
- **Cost**: ~$0.00645 per SMS in India
- **Setup**: Requires AWS account

### 3. TextLocal (India-specific)
- **Pros**: Good for Indian numbers, competitive pricing
- **Cost**: ~₹0.15 per SMS
- **Setup**: Easy for Indian market

## Implementation Steps

### Step 1: Choose Your SMS Service
We recommend **Twilio** for its reliability and ease of use.

### Step 2: Get API Credentials
1. Sign up for your chosen SMS service
2. Get your API credentials (API key, secret, etc.)
3. Add them to your environment variables

### Step 3: Update Database Function
Replace the `RAISE NOTICE` line in the `send_otp_to_phone` function with actual SMS sending code.

### Step 4: Environment Variables
Add these to your `.env` file:
```env
# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Or for AWS SNS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
```

## Quick Twilio Integration

### 1. Install Twilio SDK
```bash
npm install twilio
```

### 2. Update Database Function
Replace the `RAISE NOTICE` line in `send_otp_to_phone` function with:

```sql
-- Add this to the function (after generating OTP)
-- This is a simplified version - you'll need to implement the actual SMS sending
-- in your application code or use a webhook

-- For now, the OTP is logged to console
-- In production, you'll call your SMS service here
```

### 3. Create SMS Service in Your App
Create a new file `src/lib/smsService.ts`:

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (phone: string, message: string) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { success: false, error: error.message };
  }
};
```

### 4. Update Profile Service
Modify `src/lib/profileService.ts` to call the SMS service:

```typescript
import { sendSMS } from './smsService';

// In the sendOTP function, after getting the OTP from database:
const smsResult = await sendSMS(phone, `Your S2S verification code is: ${otp}`);
if (!smsResult.success) {
  return { success: false, message: 'Failed to send SMS' };
}
```

## Testing

### 1. Test OTP Generation
```sql
SELECT public.send_otp_to_phone('your-user-id', '+919876543210');
```

### 2. Test OTP Verification
```sql
SELECT public.verify_phone_otp('your-user-id', '+919876543210', '123456');
```

### 3. Check OTP Records
```sql
SELECT * FROM public.phone_verifications 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC;
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for OTP requests
2. **OTP Expiration**: OTPs expire after 5 minutes
3. **Cleanup**: Old OTPs are automatically cleaned up
4. **Uniqueness**: Phone numbers are unique per user
5. **RLS**: Row Level Security is enabled

## Cost Estimation

For 1000 users requesting OTP daily:
- **Twilio**: ~$7.50/month
- **AWS SNS**: ~$6.45/month
- **TextLocal**: ~₹150/month

## Next Steps

1. **Run the database migration** (`PRODUCTION_OTP_SETUP.sql`)
2. **Choose your SMS service**
3. **Set up API credentials**
4. **Implement SMS sending**
5. **Test the complete flow**

## Support

If you need help with SMS integration, I can help you:
1. Set up Twilio integration
2. Configure AWS SNS
3. Implement rate limiting
4. Add SMS templates
5. Handle delivery status

Let me know which SMS service you'd like to use, and I'll help you implement it!
