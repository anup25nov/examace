# 🗄️ Profile Management Database Migration Guide

## 📋 Overview
This guide will help you migrate your existing database to support the new profile management features including phone verification, UPI integration, and referral tracking.

## ⚠️ Important Notes
- **Backup First**: Always backup your database before running migrations
- **Test Environment**: Test the migration in a development environment first
- **Existing Data**: The migration preserves all existing data
- **Rollback Plan**: Keep the original schema for rollback if needed

## 🚀 Migration Steps

### Step 1: Run the Migration Script
1. Open your Supabase SQL Editor
2. Copy and paste the contents of `PROFILE_DATABASE_MIGRATION.sql`
3. Execute the script
4. Wait for completion (should take 1-2 minutes)

### Step 2: Verify the Migration
1. Run the contents of `TEST_PROFILE_MIGRATION.sql`
2. Check that all tests show "PASS"
3. If any tests fail, check the error messages and re-run the migration

### Step 3: Update Your Application
The application code is already updated to work with the new schema. No code changes needed.

## 📊 What the Migration Adds

### New Columns to `user_profiles`:
- `name` - User's full name
- `phone_verified` - Boolean flag for phone verification status
- `upi_id` - UPI ID for withdrawals
- `referral_earnings` - Total referral earnings
- `total_referrals` - Count of successful referrals

### New Tables:
1. **`phone_verifications`** - OTP verification system
2. **`daily_visits`** - Daily visit tracking for accolades
3. **`referral_transactions`** - Referral earnings and withdrawals

### New Features:
- **Phone Verification**: OTP-based phone number verification
- **UPI Integration**: Support for UPI-based withdrawals
- **Referral Tracking**: Complete referral system with earnings
- **Daily Visits**: Track user engagement for accolades
- **Performance Indexes**: Optimized database performance
- **Row Level Security**: Secure data access policies

## 🔧 Database Schema Changes

### Before Migration:
```sql
user_profiles:
- id (UUID, Primary Key)
- email (TEXT)
- phone (TEXT)
- pin (VARCHAR)
- membership_plan (TEXT)
- membership_status (TEXT)
- membership_expiry (TEXT)
- referral_code (TEXT)
- referred_by (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### After Migration:
```sql
user_profiles:
- id (UUID, Primary Key)
- email (TEXT)
- phone (TEXT)
- pin (VARCHAR)
- membership_plan (TEXT)
- membership_status (TEXT)
- membership_expiry (TEXT)
- referral_code (TEXT)
- referred_by (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
+ name (VARCHAR)                    -- NEW
+ phone_verified (BOOLEAN)          -- NEW
+ upi_id (VARCHAR)                  -- NEW
+ referral_earnings (DECIMAL)       -- NEW
+ total_referrals (INTEGER)         -- NEW

phone_verifications:                -- NEW TABLE
- id (UUID, Primary Key)
- phone (VARCHAR)
- otp (VARCHAR)
- expires_at (TIMESTAMP)
- used (BOOLEAN)
- created_at (TIMESTAMP)

daily_visits:                       -- NEW TABLE
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- visit_date (DATE)
- created_at (TIMESTAMP)

referral_transactions:              -- NEW TABLE
- id (UUID, Primary Key)
- referrer_id (UUID, Foreign Key)
- referee_id (UUID, Foreign Key)
- amount (DECIMAL)
- transaction_type (VARCHAR)
- status (VARCHAR)
- upi_id (VARCHAR)
- transaction_id (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🛡️ Security Features

### Row Level Security (RLS):
- Users can only access their own profile data
- Phone verifications are accessible to anyone (for OTP verification)
- Daily visits are user-specific
- Referral transactions are accessible to involved parties only

### Data Validation:
- Phone numbers must be 10 digits
- UPI IDs must follow valid format
- OTP codes must be 6 digits
- Transaction amounts must be positive

## 📈 Performance Optimizations

### Indexes Created:
- `idx_user_profiles_phone_verified` - Fast phone verification lookups
- `idx_user_profiles_referral_earnings` - Quick earnings queries
- `idx_phone_verifications_phone` - Fast OTP lookups
- `idx_phone_verifications_expires` - Efficient cleanup of expired OTPs
- `idx_daily_visits_user_date` - Quick daily visit checks
- `idx_referral_transactions_referrer` - Fast referral queries
- `idx_referral_transactions_referee` - Fast referee queries

## 🔄 Functions and Views

### Functions:
- `update_updated_at_column()` - Auto-update timestamps
- `cleanup_expired_otps()` - Clean up expired OTPs
- `get_user_profile_with_stats()` - Get profile with referral stats

### Views:
- `user_profile_summary` - Complete user profile with visit stats

## 🧪 Testing the Migration

### Manual Testing:
1. **Profile Update**: Try updating a user's profile
2. **Phone Verification**: Test OTP sending and verification
3. **Referral System**: Test referral tracking
4. **Daily Visits**: Verify daily visit tracking works

### Automated Testing:
Run the test script to verify all components are working:
```sql
-- Run TEST_PROFILE_MIGRATION.sql
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Column already exists" errors**:
   - The migration uses `IF NOT EXISTS` checks
   - This is normal and can be ignored

2. **Permission errors**:
   - Ensure you're running as a database admin
   - Check that RLS policies are properly set

3. **Constraint violations**:
   - Check that phone numbers are 10 digits
   - Verify UPI ID format is correct

### Rollback Plan:
If you need to rollback:
1. Drop the new tables: `phone_verifications`, `daily_visits`, `referral_transactions`
2. Remove new columns from `user_profiles`
3. Drop new indexes and constraints
4. Restore from backup if needed

## 📞 Support

If you encounter any issues:
1. Check the Supabase logs for detailed error messages
2. Verify all constraints and data types
3. Test with sample data first
4. Contact support with specific error messages

## ✅ Post-Migration Checklist

- [ ] Migration script completed successfully
- [ ] All test queries show "PASS"
- [ ] Profile update functionality works
- [ ] Phone verification system works
- [ ] Referral tracking works
- [ ] Daily visit tracking works
- [ ] Performance is acceptable
- [ ] No data loss occurred
- [ ] Application functions normally

## 🎉 You're Done!

Your database is now ready to support the new profile management features. Users can:
- Complete their profiles with name and phone verification
- Set up UPI IDs for withdrawals
- Track referral earnings
- Receive daily visit accolades
- Enjoy a more professional and engaging experience

The migration is complete and your application is ready for production! 🚀
