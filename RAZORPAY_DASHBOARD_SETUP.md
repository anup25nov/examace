# Fix Razorpay Website Mismatch - Step by Step

## The Problem
Payment is being blocked because the website URL (`http://localhost:8080` or your production URL) is not registered in your Razorpay dashboard.

## Solution: Add Website to Razorpay Dashboard

### Step 1: Login to Razorpay Dashboard
1. Go to https://dashboard.razorpay.com/
2. Login with your Razorpay account

### Step 2: Navigate to Settings
1. Click on **Settings** in the left sidebar
2. Click on **API Keys** (or **Configuration** → **API Keys**)

### Step 3: Add Allowed Websites
1. Scroll down to find **"Allowed Websites"** or **"Website URLs"** section
2. Click **"Add Website"** or **"Add URL"** button
3. Add your website URLs:

   **For Local Development:**
   ```
   http://localhost:8080
   ```
   (Or whatever port you're using)

   **For Production:**
   ```
   https://your-production-domain.com
   ```

4. Click **Save** or **Update**

### Step 4: Verify
1. Make sure the website URL is listed in the allowed websites
2. The URL should match exactly (including `http://` vs `https://` and port number)

## Alternative: Use Test Mode (Easier for Development)

Test mode typically allows localhost by default, so you don't need to add it manually.

### Switch to Test Mode:
1. In Razorpay Dashboard, look for **"Test Mode"** toggle in the top right
2. Switch it to **ON** (Test Mode)
3. Copy your **Test Key ID** (starts with `rzp_test_`)
4. Update your `.env.local`:
   ```env
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   ```
5. Restart your dev server

## Quick Checklist

- [ ] Logged into Razorpay Dashboard
- [ ] Navigated to Settings → API Keys
- [ ] Found "Allowed Websites" section
- [ ] Added `http://localhost:8080` (for local dev)
- [ ] Added production URL (if testing production)
- [ ] Saved changes
- [ ] Restarted dev server (if using new keys)
- [ ] Tested payment again

## Still Not Working?

### Check These:
1. **URL Format**: Must match exactly
   - ✅ Correct: `http://localhost:8080`
   - ❌ Wrong: `localhost:8080` (missing protocol)
   - ❌ Wrong: `http://localhost:8080/` (trailing slash)

2. **API Key**: Make sure you're using the correct key
   - Test Mode: Keys start with `rzp_test_`
   - Live Mode: Keys start with `rzp_live_`

3. **Mode Match**: 
   - If using Test Mode, make sure your key is a test key
   - If using Live Mode, make sure your key is a live key

4. **Wait Time**: Changes in Razorpay dashboard may take a few minutes to propagate

## For Production

When deploying to production:
1. Add your production domain to allowed websites
2. Use Live Mode API keys
3. Make sure the domain matches exactly (including `https://`)

## Contact Support

If still not working:
- Razorpay Support: https://razorpay.com/support/
- Email: support@razorpay.com

---

**Note**: The code has been updated to include the website URL. You just need to register it in the Razorpay dashboard.

