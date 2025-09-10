# 🚀 Razorpay End-to-End Setup Guide

## 🎯 **Complete Implementation Steps**

### **Step 1: Install Dependencies**
```bash
npm install razorpay
npm install @types/razorpay
```

### **Step 2: Environment Variables**
Create/update your `.env.local` file:

```env
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_test_RFxIToeCLybhiA
RAZORPAY_KEY_SECRET=MHHKyti0XnceA6iQ4ufzvNtR
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Public Razorpay Key (for frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RFxIToeCLybhiA

# Supabase (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Step 3: Database Setup**
Run the SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content from RAZORPAY_DATABASE_SCHEMA.sql
-- This creates all necessary tables, functions, and policies
```

### **Step 4: Razorpay Dashboard Configuration**

#### **4.1 Webhook Setup**
1. **Go to Razorpay Dashboard** → Settings → Webhooks
2. **Add Webhook URL**: `https://yourdomain.com/api/razorpay-webhook`
3. **Enable Events**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `payment.authorized`
4. **Copy Webhook Secret** and add to `.env.local`

#### **4.2 Test Mode Setup**
- Ensure you're in **Test Mode**
- Use test credentials provided
- Test payments will be in sandbox mode

### **Step 5: Update Components**

#### **5.1 Update MembershipPlans.tsx**
```typescript
// Replace existing payment modal with Razorpay modal
import { RazorpayPaymentModal } from '@/components/RazorpayPaymentModal';

// In your component:
const [showRazorpayModal, setShowRazorpayModal] = useState(false);
const [selectedPlan, setSelectedPlan] = useState(null);

const handleBuyPlan = (plan: any) => {
  setSelectedPlan(plan);
  setShowRazorpayModal(true);
};

// In your JSX:
{showRazorpayModal && selectedPlan && (
  <RazorpayPaymentModal
    plan={selectedPlan}
    onClose={() => {
      setShowRazorpayModal(false);
      setSelectedPlan(null);
    }}
    onPaymentSuccess={(paymentId) => {
      console.log('Payment successful:', paymentId);
      // Handle success (refresh data, show success message, etc.)
      setShowRazorpayModal(false);
      setSelectedPlan(null);
    }}
  />
)}
```

#### **5.2 Remove Old Payment Components**
- Remove `SimpleUpiPayment.tsx`
- Remove `SimplePaymentModal.tsx`
- Remove `PaymentModal.tsx` (or keep for other payment methods)
- Remove `paymentValidationService.ts`

### **Step 6: Test the Integration**

#### **6.1 Test Payment Flow**
1. **Select a plan** → Payment modal opens
2. **Click "Pay"** → Razorpay checkout opens
3. **Use test card**: `4111 1111 1111 1111`
4. **Complete payment** → Success callback triggered
5. **Check database** → Payment record created
6. **Check membership** → User membership activated

#### **6.2 Test Webhook**
1. **Make a test payment**
2. **Check webhook events** in database
3. **Verify payment status** updated
4. **Check membership activation**

### **Step 7: Production Setup**

#### **7.1 Switch to Live Mode**
1. **Get live credentials** from Razorpay
2. **Update environment variables**
3. **Update webhook URL** to production domain
4. **Test with real payments**

#### **7.2 Security Considerations**
- **Use HTTPS** for webhook URL
- **Verify webhook signatures**
- **Implement rate limiting**
- **Log all webhook events**
- **Monitor failed payments**

---

## 🔧 **What You Need to Provide**

### **1. Webhook URL**
```
https://yourdomain.com/api/razorpay-webhook
```

### **2. Webhook Secret**
- Generate in Razorpay Dashboard
- Add to `.env.local`

### **3. Domain Configuration**
- Ensure your domain is accessible
- HTTPS is required for webhooks

---

## 📋 **Files Created/Updated**

### **New Files:**
- ✅ `src/lib/razorpayService.ts` - Razorpay API integration
- ✅ `src/lib/paymentService.ts` - Payment management
- ✅ `src/components/RazorpayPaymentModal.tsx` - Payment UI
- ✅ `src/pages/api/razorpay-webhook.ts` - Webhook handler
- ✅ `RAZORPAY_DATABASE_SCHEMA.sql` - Database schema
- ✅ `RAZORPAY_SETUP_GUIDE.md` - This guide

### **Files to Update:**
- ✅ `src/components/MembershipPlans.tsx` - Use Razorpay modal
- ✅ `.env.local` - Add Razorpay credentials

### **Files to Remove (Optional):**
- ❌ `src/components/SimpleUpiPayment.tsx`
- ❌ `src/components/SimplePaymentModal.tsx`
- ❌ `src/lib/paymentValidationService.ts`

---

## 🧪 **Testing Checklist**

### **Payment Flow:**
- [ ] **Payment modal opens** correctly
- [ ] **Razorpay checkout** loads properly
- [ ] **Test payment** completes successfully
- [ ] **Success callback** triggered
- [ ] **Database updated** with payment record
- [ ] **Membership activated** for user

### **Webhook Testing:**
- [ ] **Webhook receives** payment events
- [ ] **Payment status** updated in database
- [ ] **Membership activation** works
- [ ] **Error handling** works properly

### **Error Scenarios:**
- [ ] **Payment failure** handled correctly
- [ ] **Network errors** handled gracefully
- [ ] **Invalid signatures** rejected
- [ ] **Database errors** logged properly

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Razorpay not defined"**
**Solution:** Ensure Razorpay script is loaded before using it
```typescript
// Check if Razorpay is loaded
if (typeof window !== 'undefined' && window.Razorpay) {
  // Use Razorpay
}
```

### **Issue 2: "Invalid signature"**
**Solution:** Check webhook secret and signature verification
```typescript
// Verify webhook secret is correct
const isValid = razorpayService.verifyWebhookSignature(body, signature, secret);
```

### **Issue 3: "Payment not found"**
**Solution:** Check if payment record exists in database
```typescript
// Find payment by order ID
const payment = await paymentService.getPaymentByOrderId(orderId);
```

### **Issue 4: "Membership not activated"**
**Solution:** Check user profile update
```typescript
// Verify membership activation
const membership = await paymentService.getUserMembership(userId);
```

---

## 🎉 **Success Indicators**

### **Payment System Working:**
- ✅ **Payment modal** opens and displays correctly
- ✅ **Razorpay checkout** loads without errors
- ✅ **Test payments** complete successfully
- ✅ **Database records** created properly
- ✅ **Webhook events** received and processed
- ✅ **Membership activation** works
- ✅ **Error handling** works gracefully

### **Database Working:**
- ✅ **Payments table** has records
- ✅ **Webhook events** table has events
- ✅ **User profiles** updated with membership
- ✅ **RLS policies** working correctly

---

## 🚀 **Ready to Go Live?**

### **Pre-Launch Checklist:**
- [ ] **All tests passing**
- [ ] **Webhook URL configured**
- [ ] **Live credentials** ready
- [ ] **Error monitoring** set up
- [ ] **Payment logging** working
- [ ] **Membership activation** verified

### **Launch Steps:**
1. **Switch to live mode** in Razorpay
2. **Update environment variables**
3. **Deploy to production**
4. **Test with real payment**
5. **Monitor webhook delivery**
6. **Verify membership activation**

---

## 📞 **Support & Troubleshooting**

### **If you encounter issues:**

1. **Check browser console** for JavaScript errors
2. **Check server logs** for webhook errors
3. **Verify database** records are created
4. **Test webhook** delivery in Razorpay dashboard
5. **Check environment variables** are set correctly

### **Debug Tools:**
- **Razorpay Dashboard** → Webhooks → Event logs
- **Supabase Dashboard** → Table Editor → Check records
- **Browser DevTools** → Network tab → Check API calls

---

## 🎯 **Next Steps**

After successful implementation:

1. **Monitor payment success rates**
2. **Set up payment analytics**
3. **Implement refund handling**
4. **Add subscription support**
5. **Optimize payment flow**

**Your Razorpay payment system is now ready for production!** 🚀
