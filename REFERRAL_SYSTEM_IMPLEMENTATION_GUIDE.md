# Referral Commission System Implementation Guide

## Overview
This guide provides step-by-step instructions to implement the complete referral commission system for ExamAce.

## ✅ What's Already Implemented

### 1. Backend Functions (Database)
- `process_referral_commission()` - Calculates and stores 50% commission
- `get_user_referral_stats()` - Returns user's referral statistics  
- `request_commission_withdrawal()` - Handles withdrawal requests
- `get_user_commission_history()` - Shows commission history

### 2. Frontend Components
- `ReferralDashboard.tsx` - Complete referral dashboard
- Updated payment components to pass referral codes
- Enhanced auth flow to store referral codes

### 3. Payment Integration
- Updated `verify_razorpay_payment` function to process commissions
- Modified payment services to include referral codes

## 🚀 Next Steps to Complete Implementation

### Step 1: Deploy Database Migration

Run this SQL migration on your Supabase database:

```sql
-- File: supabase/migrations/20250115000051_simple_commission_fix.sql
-- This creates all the necessary functions for the commission system
```

### Step 2: Test the Complete Flow

Run the test script to verify everything works:

```sql
-- File: test_referral_flow_complete.sql
-- This tests: U1 refers U2 → U2 signs up → U2 purchases → U1 gets commission
```

### Step 3: Add ReferralDashboard to Your App

Add the ReferralDashboard component to your main app:

```tsx
// In your main app component
import { ReferralDashboard } from '@/components/ReferralDashboard';

// Add a route or button to access the dashboard
<ReferralDashboard />
```

### Step 4: Update Payment Flow

Ensure your payment components are using the updated services:

```tsx
// The RazorpayCheckout component now automatically:
// 1. Gets referral code from localStorage
// 2. Passes it to the payment verification
// 3. Triggers commission processing
```

## 🔄 Complete Flow

1. **U1 signs up** → Gets referral code automatically
2. **U2 signs up using U1's referral code** → Creates referral relationship  
3. **U2 purchases membership (₹2)** → Triggers commission calculation
4. **Commission is calculated** → 50% of membership amount (₹1)
5. **Commission is stored** → In `referral_commissions` table
6. **U1's stats are updated** → Total earnings and pending commission
7. **Withdrawal option** → U1 can request payout through dashboard

## 📊 Database Schema

### Key Tables:
- `referral_codes` - Stores user referral codes and stats
- `referral_transactions` - Tracks referral relationships
- `referral_commissions` - Stores commission details
- `referral_payouts` - Handles withdrawal requests

### Key Functions:
- `process_referral_commission(user_id, payment_id, plan, amount)`
- `get_user_referral_stats(user_id)`
- `request_commission_withdrawal(user_id, amount, payment_method)`
- `get_user_commission_history(user_id)`

## 🎯 Features Implemented

### For Users:
- ✅ Automatic referral code generation
- ✅ Referral code sharing and copying
- ✅ Real-time referral statistics
- ✅ Commission history tracking
- ✅ Withdrawal request system
- ✅ 50% commission on first membership purchase

### For Admins:
- ✅ Commission tracking and management
- ✅ Withdrawal request processing
- ✅ Referral network monitoring

## 🧪 Testing

### Manual Test Steps:
1. Create two test users (U1 and U2)
2. U1 gets referral code automatically
3. U2 signs up using U1's referral code
4. U2 purchases a membership (₹2)
5. Check that U1 gets ₹1 commission
6. Verify U1 can see stats in ReferralDashboard
7. Test withdrawal request functionality

### Test Script:
Run `test_referral_flow_complete.sql` to test the complete flow automatically.

## 🔧 Configuration

### Commission Rate:
- Currently set to 50% (configurable in `process_referral_commission` function)
- Only applies to first membership purchase per referred user

### Withdrawal Settings:
- Minimum withdrawal amount: ₹10
- Payment methods: Bank transfer, UPI, Paytm
- Status tracking: pending → processing → completed

## 📱 Frontend Integration

### ReferralDashboard Component:
- Shows total referrals, earnings, pending commission
- Allows copying and sharing referral codes
- Provides withdrawal request form
- Displays commission history

### Payment Integration:
- Automatically captures referral codes during signup
- Passes referral codes to payment verification
- Triggers commission processing on successful payment

## 🚨 Important Notes

1. **Database Connection**: Ensure your Supabase database is accessible
2. **Migration Order**: Apply migrations in the correct order
3. **Testing**: Always test in a development environment first
4. **Security**: All functions use SECURITY DEFINER for proper access control

## 📞 Support

If you encounter any issues:
1. Check the database connection
2. Verify all migrations are applied
3. Test with the provided test script
4. Check the browser console for any frontend errors

The system is now ready for production use once the database migration is applied!
