# 🔧 Payment Schema Fix Guide

## 🚨 **Issue Identified**

The error shows that the `plan_name` column doesn't exist in your `payments` table:

```
column "plan_name" of relation "payments" does not exist
```

This means your database table was created with an older schema that's missing some required columns.

---

## 🛠️ **Solution Options**

### **Option 1: Quick Fix (Recommended)**
If you have existing payment data that you want to keep:

1. **Run the Quick Fix Script:**
   ```sql
   -- Copy and paste this entire script into your Supabase SQL Editor
   -- File: QUICK_FIX_PAYMENTS_TABLE.sql
   ```

2. **This will:**
   - ✅ Add missing columns without losing data
   - ✅ Update existing records with proper plan names
   - ✅ Add all required constraints and indexes
   - ✅ Create missing tables (payment_verifications, payment_audit_log)

### **Option 2: Complete Rebuild**
If you don't have important payment data or want a clean start:

1. **Run the Complete Rebuild Script:**
   ```sql
   -- Copy and paste this entire script into your Supabase SQL Editor
   -- File: FIX_PAYMENTS_TABLE_SCHEMA.sql
   ```

2. **This will:**
   - ⚠️ **DELETE ALL EXISTING PAYMENT DATA**
   - ✅ Create fresh tables with correct schema
   - ✅ Add all functions and constraints
   - ✅ Set up complete payment verification system

---

## 🚀 **Recommended Steps**

### **Step 1: Run Quick Fix**
```sql
-- Run QUICK_FIX_PAYMENTS_TABLE.sql in Supabase SQL Editor
```

### **Step 2: Test Payment Creation**
1. Go to your app
2. Try to create a payment
3. Check if the error is resolved

### **Step 3: Verify Schema**
Run this query to check if all columns exist:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

You should see these columns:
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

### **Test 1: Payment Creation**
```javascript
// This should now work without errors
const paymentData = {
  paymentId: 'PAY_TEST_123',
  planId: 'monthly',
  planName: 'Monthly Premium', // This column now exists
  amount: 299,
  paymentMethod: 'upi',
  upiId: 'ankit.m9155@axl'
};

const result = await paymentService.createPayment(paymentData);
console.log(result); // Should show success
```

### **Test 2: Payment Flow**
1. Go to your app
2. Try to purchase a premium plan
3. Follow the complete payment flow
4. Verify that all steps work correctly

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
2. **Verify admin panel functionality**
3. **Check all edge cases work**
4. **Deploy to production** when ready

---

## 📞 **Need Help?**

If you're still having issues:

1. **Check the error message** - it will tell you exactly what's missing
2. **Run the schema verification query** to see what columns exist
3. **Try the complete rebuild** if the quick fix doesn't work
4. **Check Supabase logs** for detailed error information

**The fix should resolve the payment creation issue completely!** 🚀
