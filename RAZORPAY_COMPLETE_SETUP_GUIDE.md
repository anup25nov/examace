# 🚀 Razorpay Complete Setup Guide

## 📋 **What You Need to Do**

### **1. Database Migration** 🗄️
**Run this SQL script in your Supabase SQL Editor:**
```sql
-- Copy and paste the entire content of RAZORPAY_MIGRATION_SCRIPT.sql
```

**This script will:**
- ✅ Add Razorpay columns to your existing `payments` table
- ✅ Create `webhook_events` table for tracking
- ✅ Add all necessary indexes and functions
- ✅ Preserve your existing payment data
- ✅ Set up proper security policies

---

### **2. Environment Variables** 🔐
**Add these to your `.env.local` file:**

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_RFxIToeCLybhiA
RAZORPAY_KEY_SECRET=MHHKyti0XnceA6iQ4ufzvNtR

# For production (use same credentials as requested)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RFxIToeCLybhiA

# Webhook Secret (generate a random string)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase Configuration (you already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

### **3. Razorpay Dashboard Configuration** ⚙️

#### **Step 1: Login to Razorpay Dashboard**
- Go to: https://dashboard.razorpay.com/
- Login with your Razorpay account

#### **Step 2: Configure Webhook**
- Go to **Settings** → **Webhooks**
- Click **Add New Webhook**
- **Webhook URL**: `https://yourdomain.com/api/razorpay-webhook`
- **Events to Subscribe**:
  - `payment.captured`
  - `payment.failed`
  - `order.paid`
  - `order.payment_failed`

#### **Step 3: Get Webhook Secret**
- After creating webhook, copy the **Webhook Secret**
- Add it to your `.env.local` as `RAZORPAY_WEBHOOK_SECRET`

---

### **4. Test the Integration** 🧪

#### **Test Payment Flow:**
1. **Start your development server**
2. **Go to membership plans page**
3. **Click on a plan**
4. **Complete payment using Razorpay test cards**
5. **Verify payment in database**

#### **Test Cards (Razorpay):**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
Name: Any name
```

---

## 🔧 **Files You Need to Execute**

### **1. Database Migration**
```sql
-- File: RAZORPAY_MIGRATION_SCRIPT.sql
-- Execute this in Supabase SQL Editor
```

### **2. Environment Setup**
```bash
# File: .env.local
# Add the environment variables listed above
```

---

## 📁 **Complete File List**

### **Database Files:**
- ✅ `RAZORPAY_MIGRATION_SCRIPT.sql` - **Execute this in Supabase**

### **Environment Files:**
- ✅ `.env.local` - **Add your environment variables**

### **Code Files (Already Fixed):**
- ✅ `src/lib/razorpayService.ts` - **Razorpay API integration**
- ✅ `src/lib/paymentService.ts` - **Payment service with Supabase**
- ✅ `src/lib/razorpayPaymentService.ts` - **Payment orchestration**
- ✅ `src/components/RazorpayPaymentModal.tsx` - **Payment UI component**
- ✅ `src/pages/api/razorpay-webhook.ts` - **Webhook handler**
- ✅ `src/components/MembershipPlans.tsx` - **Updated to use Razorpay**

---

## 🎯 **Step-by-Step Execution**

### **Step 1: Database Migration**
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy entire content of `RAZORPAY_MIGRATION_SCRIPT.sql`
4. Paste and execute
5. Verify success message

### **Step 2: Environment Variables**
1. Open `.env.local` file
2. Add all Razorpay environment variables
3. Save file
4. Restart development server

### **Step 3: Razorpay Dashboard**
1. Login to Razorpay Dashboard
2. Configure webhook URL
3. Copy webhook secret
4. Add secret to `.env.local`

### **Step 4: Test Payment**
1. Start development server
2. Go to membership plans
3. Test payment flow
4. Verify in database

---

## 🔍 **Verification Steps**

### **Check Database:**
```sql
-- Verify payments table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify webhook_events table exists
SELECT * FROM public.webhook_events LIMIT 1;

-- Verify functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%payment%';
```

### **Check Environment:**
```bash
# Verify environment variables are loaded
echo $RAZORPAY_KEY_ID
echo $RAZORPAY_KEY_SECRET
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. Database Migration Fails**
- **Error**: Column already exists
- **Solution**: The script uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times

#### **2. Environment Variables Not Loading**
- **Error**: Undefined environment variables
- **Solution**: Restart development server after adding variables

#### **3. Webhook Not Working**
- **Error**: Webhook events not received
- **Solution**: Check webhook URL is accessible and events are subscribed

#### **4. Payment Verification Fails**
- **Error**: Signature verification failed
- **Solution**: Check `RAZORPAY_KEY_SECRET` is correct

---

## 🎉 **Success Indicators**

### **Database Migration Success:**
- ✅ Success message: "Razorpay migration completed successfully!"
- ✅ New columns added to payments table
- ✅ webhook_events table created
- ✅ All functions created

### **Environment Setup Success:**
- ✅ All environment variables loaded
- ✅ No undefined variable errors
- ✅ Razorpay service initializes

### **Payment Flow Success:**
- ✅ Payment modal opens
- ✅ Razorpay checkout loads
- ✅ Payment processes successfully
- ✅ Database records updated
- ✅ Membership activated

---

## 📞 **Support**

### **If You Encounter Issues:**

1. **Check Database Migration**
   - Verify all columns exist
   - Check function creation

2. **Check Environment Variables**
   - Verify all variables are set
   - Restart development server

3. **Check Razorpay Dashboard**
   - Verify webhook configuration
   - Check event subscriptions

4. **Check Browser Console**
   - Look for JavaScript errors
   - Check network requests

---

## 🏆 **Final Status**

Once you complete these steps:

- ✅ **Database** - Razorpay columns and functions added
- ✅ **Environment** - All variables configured
- ✅ **Webhook** - Razorpay webhook configured
- ✅ **Payment Flow** - Complete end-to-end integration
- ✅ **Production Ready** - System ready for live payments

**Your Razorpay payment system will be fully functional!** 🚀

---

## 📝 **Quick Checklist**

- [ ] Run `RAZORPAY_MIGRATION_SCRIPT.sql` in Supabase
- [ ] Add environment variables to `.env.local`
- [ ] Configure webhook in Razorpay Dashboard
- [ ] Test payment flow
- [ ] Verify database records
- [ ] Check webhook events

**Complete these steps and your Razorpay integration will be ready!** ✨