# Referral Commission Debug Guide

## Root Cause Identified

The referral commission system was not working because:

### 1. **Webhook Not Processing Commissions**
- The `process_payment_and_membership` function (called by Razorpay webhook) does NOT include commission processing
- This is the main issue - commissions were only processed in client-side code that could fail silently

### 2. **System Architecture**
- The system uses `referral_codes.total_earnings` as the main table for storing commission amounts
- `referral_commissions` table is for detailed tracking, but `referral_codes.total_earnings` is what users see
- Missing columns in `referral_transactions` table prevented proper commission processing

### 3. **Commission Flow**
- When user A refers user B and B purchases membership:
  1. `referral_transactions` table tracks the referral relationship
  2. `referral_commissions` table stores detailed commission records
  3. `referral_codes.total_earnings` gets updated with the commission amount (this is what users see)

## Fix Applied

The `FIX_REFERRAL_COMMISSION_WEBHOOK.sql` file addresses the core issue:

1. **Updates `process_payment_and_membership`** to include commission processing in the webhook
2. **Adds missing columns** to `referral_transactions` table
3. **Creates debugging functions** to help identify issues
4. **Creates a function to process missed commissions**

## How to Debug

### Step 1: Apply the Fix
```sql
-- Run the fix
\i FIX_REFERRAL_COMMISSION_WEBHOOK.sql
```

### Step 2: Check Commission Status for a User
```sql
-- Replace 'user-uuid-here' with actual user ID
SELECT * FROM debug_commission_status('user-uuid-here');
```

This will show:
- Whether user has a referral
- Referral status
- Number of memberships
- Number of commissions
- Total commission amount
- Last membership date

### Step 3: Process Missed Commissions
```sql
-- Process all missed commissions
SELECT * FROM process_missing_commissions();
```

This will:
- Find all completed memberships without commissions
- Process commissions for users with pending referrals
- Return count of processed commissions and total amount

### Step 4: Check Referral Transactions
```sql
-- Check referral transactions for a user
SELECT 
  rt.*,
  up.phone as referrer_phone,
  up2.phone as referred_phone
FROM referral_transactions rt
LEFT JOIN user_profiles up ON rt.referrer_id = up.id
LEFT JOIN user_profiles up2 ON rt.referred_id = up2.id
WHERE rt.referred_id = 'user-uuid-here';
```

### Step 5: Check Commission Records
```sql
-- Check commission records for a user
SELECT 
  rc.*,
  up.phone as referrer_phone,
  up2.phone as referred_phone
FROM referral_commissions rc
LEFT JOIN user_profiles up ON rc.referrer_id = up.id
LEFT JOIN user_profiles up2 ON rc.referred_id = up2.id
WHERE rc.referred_id = 'user-uuid-here';
```

## Common Issues and Solutions

### Issue: "No referrer found for user"
**Cause:** User doesn't have a referral transaction or it's not in 'pending' status
**Solution:** Check if referral was properly applied during signup

### Issue: "Commission already exists"
**Cause:** Commission was already processed for this user
**Solution:** This is normal - check if commission amount is correct

### Issue: "Not first membership, no commission"
**Cause:** User already has an active membership and `first_membership_only` is true
**Solution:** This is expected behavior for first-membership-only commissions

### Issue: "Payment not completed"
**Cause:** Payment status is not 'completed'
**Solution:** Check payment status in `membership_transactions` table

## Testing the Fix

### Test 1: New User with Referral
1. Create a new user with a referral code
2. Purchase membership
3. Check if commission is created

### Test 2: Existing User with Missed Commission
1. Run `process_missing_commissions()`
2. Check if commissions are created for existing memberships

### Test 3: Webhook Processing
1. Make a test payment
2. Check webhook logs
3. Verify commission is processed automatically

## Monitoring

### Daily Check
```sql
-- Check recent commissions
SELECT 
  DATE(created_at) as date,
  COUNT(*) as commission_count,
  SUM(commission_amount) as total_amount
FROM referral_commissions
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Weekly Check
```sql
-- Check users with memberships but no commissions
SELECT 
  mt.user_id,
  COUNT(mt.id) as membership_count,
  COUNT(rc.id) as commission_count,
  SUM(mt.amount) as total_spent
FROM membership_transactions mt
LEFT JOIN referral_commissions rc ON mt.user_id = rc.referred_id
WHERE mt.status = 'completed'
  AND mt.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY mt.user_id
HAVING COUNT(rc.id) = 0
ORDER BY total_spent DESC;
```

## Next Steps

1. **Apply the fix** using the SQL file
2. **Process missed commissions** for existing users
3. **Monitor the system** for new commissions
4. **Test with a new user** to ensure the flow works
5. **Set up alerts** for commission processing failures

## Files Modified

- `FIX_REFERRAL_COMMISSION_SYSTEM.sql` - Main fix
- `FIX_REFERRAL_TRANSACTIONS.sql` - Referral transactions fix
- `FIX_REFERRAL_COMMISSIONS.sql` - Referral commissions fix
