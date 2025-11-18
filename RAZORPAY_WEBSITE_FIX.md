# Razorpay Website Mismatch Fix

## Problem
Getting error: **"Payment blocked as website does not match registered website(s)"**

This happens when the website URL where the payment is initiated doesn't match what's registered in your Razorpay dashboard.

## Solution

### Option 1: Add Website to Razorpay Dashboard (Recommended)

1. **Go to Razorpay Dashboard**
   - Login at https://dashboard.razorpay.com/
   - Navigate to **Settings** → **API Keys**

2. **Add Allowed Websites**
   - Find the section for **"Allowed Websites"** or **"Website URLs"**
   - Add your website URLs:
     - **For Production**: `https://your-production-domain.com`
     - **For Local Development**: `http://localhost:8080` (or your local port)
     - **For Staging**: `https://your-staging-domain.com`

3. **Save Changes**

### Option 2: Use Test Mode for Local Development

If you're testing locally, use Razorpay **Test Mode**:

1. **Get Test API Keys**
   - In Razorpay Dashboard → **Settings** → **API Keys**
   - Switch to **Test Mode** (toggle in top right)
   - Copy **Test Key ID** and **Test Key Secret**

2. **Update `.env.local`**
   ```env
   VITE_RAZORPAY_KEY_ID=your_test_key_id_here
   ```

3. **Test Mode allows localhost by default**

### Option 3: Disable Website Validation (Not Recommended)

⚠️ **Only for testing** - This reduces security:

1. In Razorpay Dashboard → **Settings** → **API Keys**
2. Look for **"Website Validation"** or **"Origin Check"**
3. Temporarily disable it (only for testing!)

## Code Changes Made

I've updated the Razorpay payment components to include the `website` field:

- ✅ `src/components/RazorpayCheckout.tsx` - Added `website: window.location.origin`
- ✅ `src/components/UnifiedPaymentModal.tsx` - Added `website: window.location.origin`

This ensures Razorpay knows which website is initiating the payment.

## Verification

After making changes:

1. **Restart your dev server**
   ```powershell
   npm run dev
   ```

2. **Test a payment**
   - Try making a test payment
   - Check if the error is resolved

3. **Check Razorpay Dashboard**
   - Go to **Payments** → **All Payments**
   - Verify the payment shows the correct website

## Common Issues

### Still Getting Error After Adding Website

**Check:**
- ✅ Website URL matches exactly (including `http://` vs `https://`)
- ✅ Port number is included for localhost (e.g., `http://localhost:8080`)
- ✅ No trailing slashes
- ✅ Using correct API keys (Test vs Live)

### Production vs Development

**Best Practice:**
- Use **Test Mode** with test keys for local development
- Use **Live Mode** with production keys only in production
- Register both localhost and production URLs in Razorpay dashboard

## Quick Fix for Local Development

If you just need to test locally quickly:

1. **Use Test Mode** (easiest)
   ```env
   # In .env.local
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   ```

2. **Or add localhost to allowed websites** in Razorpay dashboard

## Need Help?

- Razorpay Support: https://razorpay.com/support/
- Check Razorpay Docs: https://razorpay.com/docs/

---

**Note**: The code has been updated to include the website URL automatically. You just need to ensure the URL is registered in your Razorpay dashboard.

