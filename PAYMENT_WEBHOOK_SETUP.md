# Payment Webhook Setup Guide

## Overview
The payment system now uses a webhook-only flow for maximum reliability and security. All payment verification and membership activation is handled server-side by Razorpay webhooks.

## Setup Steps

### 1. Configure Razorpay Webhook
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Create a new webhook with these settings:
   - **URL**: `https://talvssmwnsfotoutjlhd.supabase.co/functions/v1/razorpay-webhook`
   - **Events**: Select `payment.captured`
   - **Secret**: Generate a strong secret key (save this!)

### 2. Set Environment Variables
In your Supabase Edge Function environment, set:
```
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Deploy Edge Functions
```bash
supabase functions deploy razorpay-webhook
supabase functions deploy create_razorpay_order
```

## How It Works

### Payment Flow
1. **User initiates payment** → UI calls `create_razorpay_order`
2. **Razorpay processes payment** → User completes payment
3. **Razorpay sends webhook** → `razorpay-webhook` function receives event
4. **Webhook processes payment** → Updates payment status, activates membership
5. **User sees success** → UI shows success message

### What the Webhook Does
- ✅ Updates `payments` table status to `completed`
- ✅ Creates/updates `user_memberships` record
- ✅ Creates `membership_transactions` record
- ✅ Updates `user_profiles` with membership info
- ✅ Processes referral commissions
- ✅ Handles all error cases gracefully

## Testing

### Test Payment Flow
1. Make a test payment
2. Check Supabase logs: `supabase functions logs razorpay-webhook`
3. Verify in database:
   ```sql
   -- Check payment status
   SELECT id, status, paid_at FROM payments WHERE razorpay_order_id = 'your_order_id';
   
   -- Check membership
   SELECT * FROM user_memberships WHERE user_id = 'your_user_id';
   
   -- Check transaction
   SELECT * FROM membership_transactions WHERE user_id = 'your_user_id';
   ```

### Debug Webhook Issues
1. Check webhook delivery in Razorpay dashboard
2. Check function logs: `supabase functions logs razorpay-webhook`
3. Verify environment variables are set correctly
4. Test webhook manually with curl if needed

## Benefits of Webhook-Only Flow

✅ **Reliable**: Server-side processing, no client-side failures
✅ **Secure**: No sensitive operations in client code
✅ **Consistent**: Single source of truth for payment processing
✅ **Maintainable**: One place to handle all payment logic
✅ **Scalable**: Handles high volume without client dependencies

## Troubleshooting

### Common Issues
1. **Webhook not firing**: Check URL and events in Razorpay dashboard
2. **401 errors**: Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
3. **Database errors**: Check table schema matches webhook expectations
4. **Membership not activated**: Check webhook logs for specific errors

### Manual Payment Completion
If a payment succeeds but webhook fails, you can manually complete it:
```sql
-- Update payment status
UPDATE payments 
SET status = 'completed', 
    paid_at = NOW(),
    razorpay_payment_id = 'payment_id_here'
WHERE razorpay_order_id = 'order_id_here';

-- Activate membership
INSERT INTO user_memberships (user_id, plan_id, start_date, end_date, status)
VALUES ('user_id', 'plan_id', NOW(), NOW() + INTERVAL '1 year', 'active')
ON CONFLICT (user_id) DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  status = EXCLUDED.status;
```
