# Refund Testing Guide

## 🎯 How to Test Refunds

### Method 1: Using Razorpay Dashboard (Recommended)

1. **Go to Razorpay Dashboard**:
   - Visit [Razorpay Dashboard](https://dashboard.razorpay.com)
   - Navigate to **Payments** → **All Payments**

2. **Find a Test Payment**:
   - Look for payments with status "Captured" or "Failed"
   - Use the search filter to find specific payments

3. **Initiate Manual Refund**:
   - Click on a payment
   - Click **"Refund"** button
   - Enter refund amount (partial or full)
   - Add reason: "Test refund for ExamAce system"
   - Click **"Process Refund"**

4. **Verify Refund**:
   - Check payment status changes to "Refunded"
   - Verify webhook is sent to your system
   - Check Supabase logs for processing

### Method 2: Using Test Webhook (Advanced)

1. **Create Test Webhook Payload**:
   ```bash
   # Run the test script
   node test_webhook_refund.js
   ```

2. **Send Test Webhook**:
   ```bash
   curl -X POST "https://talvssmwnsfotoutjlhd.supabase.co/functions/v1/razorpay-webhook" \
     -H "Content-Type: application/json" \
     -H "X-Razorpay-Signature: [signature]" \
     -d '[webhook_payload]'
   ```

3. **Check Response**:
   - Should return "OK" if successful
   - Check Supabase Edge Function logs

### Method 3: Using Razorpay Test Cards

1. **Use Test Card for Payment**:
   - Card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date

2. **Simulate Payment Failure**:
   - Use CVV: `999` to trigger payment failure
   - Payment will be captured but marked as failed
   - System should automatically initiate refund

3. **Verify Automatic Refund**:
   - Check Razorpay dashboard for refund
   - Verify payment status in your system
   - Check webhook processing logs

## 🔍 What to Check During Testing

### 1. Webhook Processing
- ✅ Webhook received successfully
- ✅ Signature verification passed
- ✅ Payment status updated correctly
- ✅ Refund initiated automatically (if applicable)

### 2. Database Updates
- ✅ Payment status changed to 'refunded'
- ✅ Refund timestamp recorded
- ✅ Refund reason logged
- ✅ User membership status updated (if needed)

### 3. Razorpay Dashboard
- ✅ Refund appears in payments list
- ✅ Refund status is "Processed"
- ✅ Refund amount matches expected
- ✅ Refund reason is recorded

## 🚨 Common Issues & Solutions

### Issue: Webhook Not Received
**Solution**:
- Check webhook URL in Razorpay dashboard
- Verify webhook is enabled for "payment.failed" events
- Test webhook URL accessibility

### Issue: Refund Not Initiated
**Solution**:
- Check `RAZORPAY_KEY_SECRET` is set correctly
- Verify payment was actually captured
- Check webhook logs for errors

### Issue: Database Not Updated
**Solution**:
- Check Supabase Edge Function logs
- Verify database permissions
- Check for foreign key constraints

## 📊 Test Scenarios

### Scenario 1: Payment Captured but Failed Later
1. Make payment with valid card
2. Payment gets captured successfully
3. Simulate failure (using test CVV 999)
4. Verify automatic refund is initiated

### Scenario 2: Manual Refund
1. Make successful payment
2. Go to Razorpay dashboard
3. Manually initiate refund
4. Verify webhook processing

### Scenario 3: Partial Refund
1. Make payment for ₹299
2. Initiate partial refund for ₹150
3. Verify partial refund processing
4. Check remaining amount handling

## 🎯 Expected Results

### Successful Refund Test:
- ✅ Payment status: `refunded`
- ✅ Refund amount: Correct
- ✅ Refund timestamp: Recorded
- ✅ User notification: Sent (if implemented)
- ✅ Razorpay dashboard: Shows refund

### Failed Refund Test:
- ❌ Payment status: `failed`
- ❌ Error reason: Logged
- ❌ Retry mechanism: Activated (if implemented)
- ❌ Admin notification: Sent (if implemented)

## 📝 Test Checklist

- [ ] Webhook endpoint accessible
- [ ] Signature verification working
- [ ] Database updates correctly
- [ ] Razorpay refund processed
- [ ] User membership updated
- [ ] Error handling works
- [ ] Logs are comprehensive
- [ ] Retry mechanism works

## 🔧 Debugging Tools

### Check Webhook Logs:
```bash
# Check Supabase Edge Function logs
supabase functions logs razorpay-webhook
```

### Test Signature Verification:
```bash
# Test signature generation
node test_signature_verification.js
```

### Check Database:
```sql
-- Check payment status
SELECT * FROM payments WHERE payment_id = 'pay_xxx';

-- Check membership status
SELECT * FROM user_memberships WHERE user_id = 'xxx';
```

## 📞 Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Verify Razorpay webhook configuration
3. Test with debug endpoint
4. Check database permissions
5. Review error messages in console

**Remember**: Always test in development environment first before testing in production!
