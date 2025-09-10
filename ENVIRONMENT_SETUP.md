# 🔧 Environment Setup for Razorpay Integration

## 📋 **Required Environment Variables**

Create or update your `.env.local` file with the following variables:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_RFxIToeCLybhiA
RAZORPAY_KEY_SECRET=MHHKyti0XnceA6iQ4ufzvNtR
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Public Razorpay Key (for frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RFxIToeCLybhiA

# Supabase Configuration (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🔑 **How to Get These Values**

### **1. Razorpay Credentials**
- **Key ID**: `rzp_test_RFxIToeCLybhiA` (already provided)
- **Key Secret**: `MHHKyti0XnceA6iQ4ufzvNtR` (already provided)
- **Webhook Secret**: Generate in Razorpay Dashboard → Settings → Webhooks

### **2. Supabase Credentials**
- **URL**: Found in Supabase Dashboard → Settings → API
- **Anon Key**: Found in Supabase Dashboard → Settings → API

### **3. Webhook Secret**
1. Go to **Razorpay Dashboard**
2. Navigate to **Settings** → **Webhooks**
3. Add webhook URL: `https://yourdomain.com/api/razorpay-webhook`
4. Copy the **Webhook Secret** and add to `.env.local`

## 🚀 **Setup Steps**

### **Step 1: Create .env.local**
```bash
# Create the file
touch .env.local

# Add the content (copy from above)
```

### **Step 2: Update Values**
Replace the placeholder values with your actual credentials:

```env
# Replace these with your actual values
RAZORPAY_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **Step 3: Restart Development Server**
```bash
npm run dev
```

## 🔒 **Security Notes**

### **Important:**
- ✅ **Never commit** `.env.local` to version control
- ✅ **Use different credentials** for development and production
- ✅ **Keep webhook secret** secure and private
- ✅ **Use HTTPS** for production webhook URLs

### **Production Setup:**
```env
# Production environment variables
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_live_key_id
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🧪 **Testing Environment**

### **Test Mode:**
- Use the provided test credentials
- Payments will be in sandbox mode
- No real money will be charged

### **Test Cards:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
Name: Any name
```

## ✅ **Verification**

### **Check if environment variables are loaded:**
```javascript
// In your browser console or component
console.log('Razorpay Key ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

### **Expected Output:**
```
Razorpay Key ID: rzp_test_RFxIToeCLybhiA
Supabase URL: https://your-project.supabase.co
```

## 🚨 **Troubleshooting**

### **Issue 1: "Environment variable not found"**
**Solution:** 
- Check if `.env.local` exists
- Restart development server
- Verify variable names are correct

### **Issue 2: "Invalid Razorpay key"**
**Solution:**
- Verify key ID and secret are correct
- Check if you're using test/live keys appropriately
- Ensure no extra spaces in the values

### **Issue 3: "Webhook signature verification failed"**
**Solution:**
- Check webhook secret is correct
- Verify webhook URL is accessible
- Ensure HTTPS is used for production

## 📞 **Need Help?**

If you encounter issues:

1. **Check environment variables** are set correctly
2. **Restart development server** after changes
3. **Verify credentials** in Razorpay dashboard
4. **Check browser console** for errors
5. **Test with provided test credentials** first

---

## 🎯 **Next Steps**

After setting up environment variables:

1. **Run database migration** (RAZORPAY_DATABASE_SCHEMA.sql)
2. **Configure webhook** in Razorpay dashboard
3. **Test payment flow** end-to-end
4. **Deploy to production** with live credentials

**Your environment is now ready for Razorpay integration!** 🚀