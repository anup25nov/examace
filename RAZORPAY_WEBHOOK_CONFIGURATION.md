# 🔗 Razorpay Webhook Configuration Guide

## 🌐 **Webhook URL Configuration**

### **For Development (Local Testing):**
```
https://your-ngrok-url.ngrok.io/api/razorpay-webhook
```

### **For Production (Vercel Deployment):**
```
https://your-app-name.vercel.app/api/razorpay-webhook
```

### **For Custom Domain:**
```
https://yourdomain.com/api/razorpay-webhook
```

---

## 📋 **Correct Webhook Events**

### **Available Events in Razorpay Dashboard:**
✅ **Use these events (order.payment_failed doesn't exist):**

1. **`payment.captured`** - Payment successfully captured
2. **`payment.failed`** - Payment failed
3. **`order.paid`** - Order marked as paid
4. **`order.payment_failed`** - ❌ **This event doesn't exist in Razorpay**

### **Recommended Event Configuration:**
```
✅ payment.captured
✅ payment.failed  
✅ order.paid
```

---

## 🛠️ **Step-by-Step Configuration**

### **Step 1: Get Your Webhook URL**

#### **For Vercel Deployment:**
1. Deploy your app to Vercel
2. Get your app URL (e.g., `https://examace.vercel.app`)
3. Your webhook URL will be: `https://examace.vercel.app/api/razorpay-webhook`

#### **For Local Testing:**
1. Install ngrok: `npm install -g ngrok`
2. Start your dev server: `npm run dev`
3. In another terminal: `ngrok http 8084`
4. Use the ngrok URL: `https://abc123.ngrok.io/api/razorpay-webhook`

### **Step 2: Configure in Razorpay Dashboard**

1. **Login to Razorpay Dashboard**
   - Go to: https://dashboard.razorpay.com/
   - Login with your account

2. **Navigate to Webhooks**
   - Go to **Settings** → **Webhooks**
   - Click **Add New Webhook**

3. **Configure Webhook**
   - **Webhook URL**: `https://your-app.vercel.app/api/razorpay-webhook`
   - **Events to Subscribe**:
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `order.paid`

4. **Save and Get Secret**
   - Click **Save**
   - Copy the **Webhook Secret**
   - Add it to your `.env.local`:

```bash
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

## 🔧 **Updated Environment Variables**

Add these to your `.env.local`:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_RFxIToeCLybhiA
RAZORPAY_KEY_SECRET=MHHKyti0XnceA6iQ4ufzvNtR
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RFxIToeCLybhiA

# Webhook Secret (get this from Razorpay Dashboard)
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Your deployment URL (for reference)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 🧪 **Testing Webhook**

### **Test Webhook URL:**
```bash
# Test if your webhook endpoint is accessible
curl -X POST https://your-app.vercel.app/api/razorpay-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### **Expected Response:**
```json
{
  "error": "Invalid signature"
}
```
*This is expected since we didn't send a valid signature*

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Webhook URL Not Accessible**
**Error**: `Webhook URL is not accessible`

**Solutions:**
- ✅ Make sure your app is deployed and running
- ✅ Check if the URL is correct
- ✅ Test the URL in browser: `https://your-app.vercel.app/api/razorpay-webhook`

### **Issue 2: Invalid Signature Error**
**Error**: `Invalid webhook signature`

**Solutions:**
- ✅ Check `RAZORPAY_WEBHOOK_SECRET` is correct
- ✅ Make sure you copied the secret from Razorpay Dashboard
- ✅ Restart your development server after adding the secret

### **Issue 3: Event Not Found**
**Error**: `order.payment_failed is not found`

**Solution:**
- ✅ Use only these events: `payment.captured`, `payment.failed`, `order.paid`
- ✅ Remove `order.payment_failed` from your webhook configuration

---

## 📱 **For Mobile App (Capacitor)**

If you're also building a mobile app, you'll need to handle webhooks differently:

### **Option 1: Use Same Webhook URL**
- Mobile app payments will also trigger the same webhook
- Webhook will handle both web and mobile payments

### **Option 2: Separate Mobile Webhook**
- Create a separate webhook for mobile: `/api/razorpay-mobile-webhook`
- Handle mobile-specific logic

---

## 🔍 **Webhook Event Structure**

### **Payment Captured Event:**
```json
{
  "event": "payment.captured",
  "id": "evt_1234567890",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1234567890",
        "order_id": "order_1234567890",
        "status": "captured",
        "amount": 10000,
        "currency": "INR"
      }
    }
  }
}
```

### **Payment Failed Event:**
```json
{
  "event": "payment.failed",
  "id": "evt_1234567890",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1234567890",
        "order_id": "order_1234567890",
        "status": "failed",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Payment failed"
      }
    }
  }
}
```

---

## ✅ **Verification Checklist**

- [ ] App deployed to Vercel
- [ ] Webhook URL accessible
- [ ] Correct events subscribed (`payment.captured`, `payment.failed`, `order.paid`)
- [ ] Webhook secret added to `.env.local`
- [ ] Development server restarted
- [ ] Test payment made
- [ ] Webhook events received in database

---

## 🎯 **Quick Setup Summary**

1. **Deploy your app** to Vercel
2. **Get your app URL** (e.g., `https://examace.vercel.app`)
3. **Configure webhook** in Razorpay Dashboard:
   - URL: `https://examace.vercel.app/api/razorpay-webhook`
   - Events: `payment.captured`, `payment.failed`, `order.paid`
4. **Copy webhook secret** and add to `.env.local`
5. **Test payment** to verify webhook works

**Your webhook will be ready!** 🚀
