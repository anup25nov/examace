# End-to-End Test Cases for Step2Sarkari

## Test Environment Setup

### Database Setup
1. **Clean Database**: All tables should be empty
2. **Membership Plans**: Insert Pro (₹99), Pro+ (₹299), and Free plans
3. **Test Users**: Create 2 users through Supabase Auth
   - User 1: Free user (testuser1@example.com)
   - User 2: Pro user (testuser2@example.com)

## Test Cases

### 1. User Registration & Authentication

#### Test Case 1.1: Phone Number Registration
**Steps:**
1. Navigate to `/auth`
2. Enter phone number: `+919876543210`
3. Click "Send OTP"
4. Enter OTP received
5. Complete registration

**Expected Results:**
- User created in `auth.users` table
- User profile created in `user_profiles` table
- Membership status: `free`
- Referral code generated
- User streak initialized

**Database Verification:**
```sql
SELECT * FROM user_profiles WHERE phone = '+919876543210';
SELECT * FROM user_streaks WHERE user_id = (SELECT id FROM user_profiles WHERE phone = '+919876543210');
SELECT * FROM referral_codes WHERE user_id = (SELECT id FROM user_profiles WHERE phone = '+919876543210');
```

#### Test Case 1.2: Referral Code Registration
**Steps:**
1. Navigate to `/auth?ref=TEST123456`
2. Enter phone number: `+919876543211`
3. Complete registration

**Expected Results:**
- User created with `referred_by` field set to `TEST123456`
- Referral relationship established

**Database Verification:**
```sql
SELECT * FROM user_profiles WHERE phone = '+919876543211' AND referred_by = 'TEST123456';
```

### 2. Membership & Payment Flow

#### Test Case 2.1: Free User Dashboard
**Steps:**
1. Login as free user
2. Navigate to dashboard

**Expected Results:**
- Membership status shows "Free"
- Limited access to tests
- Upgrade prompts visible

**UI Verification:**
- Header shows "Free" badge
- Membership card shows upgrade options
- Test cards show "Upgrade Required" for premium tests

#### Test Case 2.2: Pro Plan Purchase
**Steps:**
1. Click on "Membership" in profile dropdown
2. Select "Pro Plan" (₹99)
3. Click "Pay Now"
4. Complete Razorpay payment

**Expected Results:**
- Payment record created in `payments` table
- User membership created in `user_memberships` table
- User profile updated with Pro status
- Success message displayed

**Database Verification:**
```sql
SELECT * FROM payments WHERE user_id = '[USER_ID]' AND plan_id = 'pro';
SELECT * FROM user_memberships WHERE user_id = '[USER_ID]' AND plan_id = 'pro';
SELECT * FROM user_profiles WHERE id = '[USER_ID]' AND membership_status = 'active';
```

#### Test Case 2.3: Pro+ Plan Purchase
**Steps:**
1. Click on "Membership" in profile dropdown
2. Select "Pro Plus Plan" (₹299)
3. Complete payment

**Expected Results:**
- Payment record created
- User membership updated to Pro+
- Unlimited access granted

### 3. Test Taking Flow

#### Test Case 3.1: Free User Test Access
**Steps:**
1. Login as free user
2. Navigate to exam dashboard
3. Click on any test

**Expected Results:**
- Limited access message shown
- Upgrade prompt displayed
- Cannot start premium tests

#### Test Case 3.2: Pro User Test Taking
**Steps:**
1. Login as Pro user
2. Navigate to exam dashboard
3. Click on "SSC CGL Mock Test 1"
4. Start test
5. Answer questions
6. Submit test

**Expected Results:**
- Test interface loads
- Questions display correctly
- Timer works
- Submit button enabled
- Results page shows score and rank

**Database Verification:**
```sql
SELECT * FROM test_completions WHERE user_id = '[USER_ID]' AND test_id = 'ssc-cgl-mock-1';
SELECT * FROM individual_test_scores WHERE user_id = '[USER_ID]' AND test_id = 'ssc-cgl-mock-1';
SELECT * FROM test_attempts WHERE user_id = '[USER_ID]' AND test_id = 'ssc-cgl-mock-1';
SELECT * FROM exam_stats WHERE user_id = '[USER_ID]' AND exam_id = 'ssc-cgl';
```

#### Test Case 3.3: Pro Plan Limits
**Steps:**
1. Login as Pro user
2. Take 11 mock tests
3. Try to take 12th test

**Expected Results:**
- After 11 tests, upgrade prompt shown
- Cannot start 12th test
- Plan limits enforced

### 4. Test Solutions & Security

#### Test Case 4.1: Test Solutions Access
**Steps:**
1. Complete a test
2. Click "View Solutions"
3. Try to inspect element/right-click

**Expected Results:**
- Solutions page loads
- Right-click disabled
- Developer tools blocked
- Text selection disabled
- Security warning displayed

#### Test Case 4.2: Direct Refer from Solutions
**Steps:**
1. On solutions page
2. Click "Refer Now" button
3. Check clipboard

**Expected Results:**
- Referral link copied to clipboard
- Success message shown
- Link format: `https://domain.com/auth?ref=REFERRAL_CODE`

### 5. Profile & Membership Management

#### Test Case 5.1: Profile Display
**Steps:**
1. Login as Pro user
2. Click on profile dropdown
3. Click "Profile"

**Expected Results:**
- Profile page shows correct membership status
- Plan details displayed
- Referral statistics shown
- Upgrade option visible

**Database Verification:**
```sql
SELECT * FROM test_data_summary WHERE user_id = '[USER_ID]';
```

#### Test Case 5.2: Membership Modal
**Steps:**
1. Click "Membership" in profile dropdown
2. Verify modal opens

**Expected Results:**
- Modal opens without navigation
- Plans displayed correctly
- Pricing shown accurately

### 6. Referral System

#### Test Case 6.1: Referral Code Generation
**Steps:**
1. Login as any user
2. Navigate to referral page

**Expected Results:**
- Unique referral code generated
- Referral link created
- Sharing options available

#### Test Case 6.2: Referral Tracking
**Steps:**
1. User A shares referral link
2. User B registers using link
3. Check referral statistics

**Expected Results:**
- Referral relationship established
- Referral count updated
- Commission calculated (if applicable)

### 7. Mobile App Testing

#### Test Case 7.1: Mobile Back Button
**Steps:**
1. Open app on mobile
2. Navigate to test page
3. Press back button

**Expected Results:**
- Confirmation dialog shown
- Option to exit or continue
- App doesn't close immediately

#### Test Case 7.2: App State Management
**Steps:**
1. Start a test
2. Minimize app
3. Reopen app

**Expected Results:**
- Test state preserved
- User remains logged in
- Data refreshed if needed

### 8. Performance & Bulk Operations

#### Test Case 8.1: Bulk Test Data Loading
**Steps:**
1. Login as user with multiple test completions
2. Navigate to dashboard

**Expected Results:**
- All test data loads in single API call
- No individual API calls per test
- Fast loading time

**API Verification:**
- Check network tab for `/v1/rpc/get_all_test_completions_for_exam`
- Verify single call loads all data

#### Test Case 8.2: Dashboard Performance
**Steps:**
1. Load dashboard with multiple tests
2. Check loading time

**Expected Results:**
- Dashboard loads within 2 seconds
- All test cards display correctly
- Scores and ranks shown

### 9. Error Handling

#### Test Case 9.1: Payment Failure
**Steps:**
1. Start payment process
2. Cancel payment
3. Check error handling

**Expected Results:**
- Error message displayed
- User redirected appropriately
- No incomplete records created

#### Test Case 9.2: Network Error
**Steps:**
1. Disconnect internet
2. Try to take test
3. Reconnect internet

**Expected Results:**
- Error message shown
- Retry option available
- Data preserved

### 10. Data Consistency

#### Test Case 10.1: Membership Sync
**Steps:**
1. Purchase membership
2. Check all related tables

**Expected Results:**
- `user_profiles.membership_status` = `user_memberships.status`
- `user_profiles.membership_plan` = `user_memberships.plan_id`
- All timestamps updated

#### Test Case 10.2: Test Score Consistency
**Steps:**
1. Complete test
2. Check all score-related tables

**Expected Results:**
- Scores match across all tables
- Ranks calculated correctly
- Statistics updated

## Database Verification Queries

### Check User Data
```sql
-- User profiles
SELECT * FROM user_profiles ORDER BY created_at DESC;

-- User memberships
SELECT up.phone, um.plan_id, um.status, um.end_date 
FROM user_profiles up 
LEFT JOIN user_memberships um ON up.id = um.user_id;

-- Test completions
SELECT up.phone, tc.test_id, tc.score, tc.completed_at
FROM user_profiles up
LEFT JOIN test_completions tc ON up.id = tc.user_id
ORDER BY tc.completed_at DESC;

-- Referral relationships
SELECT 
    referrer.phone as referrer_phone,
    referred.phone as referred_phone,
    referred.referred_by
FROM user_profiles referrer
JOIN user_profiles referred ON referrer.referral_code = referred.referred_by;
```

### Check Data Integrity
```sql
-- Membership consistency
SELECT 
    up.id,
    up.membership_status,
    up.membership_plan,
    um.plan_id,
    um.status,
    CASE 
        WHEN up.membership_status = 'free' AND um.plan_id IS NULL THEN 'OK'
        WHEN up.membership_status != 'free' AND um.plan_id IS NOT NULL 
             AND up.membership_plan = um.plan_id THEN 'OK'
        ELSE 'INCONSISTENT'
    END as status
FROM user_profiles up
LEFT JOIN user_memberships um ON up.id = um.user_id;

-- Test data consistency
SELECT 
    tc.user_id,
    tc.test_id,
    tc.score as completion_score,
    its.score as individual_score,
    CASE 
        WHEN tc.score = its.score THEN 'OK'
        ELSE 'INCONSISTENT'
    END as score_status
FROM test_completions tc
LEFT JOIN individual_test_scores its ON tc.user_id = its.user_id 
    AND tc.test_id = its.test_id
WHERE tc.score != its.score;
```

## Test Execution Checklist

- [ ] User registration works
- [ ] Phone authentication works
- [ ] Referral system works
- [ ] Payment integration works
- [ ] Membership plans work
- [ ] Test taking flow works
- [ ] Test solutions work
- [ ] Profile management works
- [ ] Mobile app works
- [ ] Performance is acceptable
- [ ] Error handling works
- [ ] Data consistency maintained
- [ ] Security measures work
- [ ] All API endpoints work
- [ ] Database constraints work

## Issues to Watch For

1. **Payment Issues**: Plan name null, incorrect amounts
2. **Membership Sync**: Profile and membership tables out of sync
3. **Test Limits**: Pro plan limits not enforced
4. **Data Exposure**: Solutions page security measures
5. **Performance**: Slow loading, multiple API calls
6. **Mobile Issues**: Back button, app state management
7. **Referral Issues**: Code generation, tracking
8. **UI Issues**: Responsive design, data display
9. **Database Issues**: Foreign key constraints, data types
10. **API Issues**: Return types, error handling
