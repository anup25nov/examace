# 🔧 Payment Schema Error Fix

## 🚨 **Error Identified**

You're getting this error:
```
ERROR: 42703: column "table_name" does not exist
```

This is because the `information_schema.check_constraints` table doesn't have a `table_name` column in some PostgreSQL versions.

---

## 🛠️ **Quick Fix**

### **Option 1: Use Simple Fix Script (Recommended)**
```sql
-- Run this instead: SIMPLE_PAYMENTS_TABLE_FIX.sql
-- This avoids the constraint checking issue
```

### **Option 2: Manual Column Addition**
If you want to add columns manually:

```sql
-- Add missing columns one by one
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'none';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failed_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update existing records
UPDATE public.payments 
SET plan_name = CASE 
    WHEN plan_id = 'monthly' THEN 'Monthly Premium'
    WHEN plan_id = 'yearly' THEN 'Yearly Premium'
    WHEN plan_id = 'lifetime' THEN 'Lifetime Access'
    WHEN plan_id = 'free' THEN 'Free Plan'
    ELSE 'Unknown Plan'
END
WHERE plan_name IS NULL;
```

---

## 🚀 **Recommended Steps**

### **Step 1: Run Simple Fix**
```sql
-- Copy and paste SIMPLE_PAYMENTS_TABLE_FIX.sql into Supabase SQL Editor
```

### **Step 2: Verify Columns Added**
```sql
-- Check if all columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### **Step 3: Test Payment Creation**
1. Go to your app
2. Try to create a payment
3. The error should be resolved

---

## ✅ **Expected Result**

After running the fix, you should see these columns in your payments table:

- ✅ `id` (uuid)
- ✅ `user_id` (uuid)
- ✅ `payment_id` (text)
- ✅ `plan_id` (text)
- ✅ `plan_name` (text) ← **This was missing**
- ✅ `amount` (numeric)
- ✅ `currency` (text)
- ✅ `payment_method` (text)
- ✅ `upi_id` (text)
- ✅ `payment_reference` (text)
- ✅ `status` (text)
- ✅ `verification_status` (text) ← **This was missing**
- ✅ `created_at` (timestamp)
- ✅ `paid_at` (timestamp) ← **This was missing**
- ✅ `verified_at` (timestamp) ← **This was missing**
- ✅ `expires_at` (timestamp)
- ✅ `failed_reason` (text) ← **This was missing**
- ✅ `dispute_reason` (text) ← **This was missing**
- ✅ `admin_notes` (text) ← **This was missing**
- ✅ `metadata` (jsonb) ← **This was missing**

---

## 🧪 **Test the Fix**

### **Test Payment Creation**
```javascript
// This should now work without errors
const paymentData = {
  paymentId: 'PAY_TEST_123',
  planId: 'monthly',
  planName: 'Monthly Premium', // This column now exists
  amount: 299,
  paymentMethod: 'razorpay',
  upiId: undefined
};

const result = await paymentService.createPayment(paymentData);
console.log(result); // Should show success
```

---

## 🔍 **Troubleshooting**

### **If you still get errors:**

#### **Error: "relation does not exist"**
- The payments table doesn't exist at all
- Run the complete rebuild script: `FIX_PAYMENTS_TABLE_SCHEMA.sql`

#### **Error: "permission denied"**
- Check your Supabase RLS policies
- Make sure you're authenticated
- Verify function permissions

#### **Error: "function does not exist"**
- The database functions weren't created
- Run the complete rebuild script: `FIX_PAYMENTS_TABLE_SCHEMA.sql`

---

## ✅ **Success Indicators**

After running the fix, you should see:

1. **No more column errors** when creating payments
2. **Payment creation works** without 400 errors
3. **All payment functions work** (create, verify, etc.)
4. **Admin panel shows payments** correctly
5. **Complete payment flow works** end-to-end

---

## 🎯 **Next Steps**

Once the schema is fixed:

1. **Test the complete payment flow**
2. **Verify Razorpay integration works**
3. **Check admin panel functionality**
4. **Deploy to production** when ready

---

## 📞 **Need Help?**

If you're still having issues:

1. **Check the error message** - it will tell you exactly what's missing
2. **Run the schema verification query** to see what columns exist
3. **Try the simple fix script** - it avoids complex constraint checking
4. **Check Supabase logs** for detailed error information

**The simple fix should resolve the payment creation issue completely!** 🚀
