# Database Analysis Framework

## Overview
This document provides a systematic approach to analyze database tables, columns, and data flow to identify:
- Unused tables/columns
- Flow breaks
- Incorrect data patterns
- Missing relationships
- Performance issues

## Analysis Steps

### Step 1: Core Application Tables (Priority 1)
These are the essential tables for the application to function:

#### 1.1 User Management
- **user_profiles** - Core user data
- **auth.users** - Supabase auth (system table)

#### 1.2 Test System
- **test_attempts** - Individual test attempts
- **test_completions** - Test completion tracking
- **individual_test_scores** - Test scores and rankings
- **exam_stats** - User's overall exam statistics

#### 1.3 Membership System
- **membership_plans** - Available plans
- **user_memberships** - User's active memberships
- **membership_transactions** - Payment transactions

### Step 2: Supporting Tables (Priority 2)
These support core functionality:

#### 2.1 Referral System
- **referral_codes** - User referral codes
- **referral_mappings** - Who referred whom
- **referral_earnings** - Referral earnings
- **referral_tracking** - Referral tracking
- **referral_rewards** - Referral rewards
- **referral_links** - Referral links
- **referral_events** - Referral events
- **referral_transactions** - Referral transactions
- **referral_payouts** - Referral payouts

#### 2.2 Analytics & Tracking
- **user_streaks** - Daily streaks
- **daily_visits** - Daily visit tracking
- **webhook_events** - Webhook events

### Step 3: System Tables (Priority 3)
These are system/infrastructure tables:

#### 3.1 Payment System
- **payment_verifications** - Payment verification
- **payment_audit_log** - Payment audit logs

#### 3.2 Verification
- **otp_verifications** - OTP verification
- **phone_verifications** - Phone verification

#### 3.3 Views & Summaries
- **user_membership_summary** - View
- **user_referral_summary** - View
- **user_profile_summary** - View
- **exam_stats_with_defaults** - View
- **membership_plans_view** - View

#### 3.4 Features
- **membership_features** - Plan features

## Analysis Template

For each table, analyze:

### Table: [TABLE_NAME]

#### Purpose
- What is this table supposed to do?
- What business logic does it support?

#### Columns Analysis
| Column | Type | Nullable | Purpose | Used in Code | Issues |
|--------|------|----------|---------|--------------|--------|
| id | UUID | No | Primary key | ✅ | - |
| user_id | UUID | No | Foreign key | ✅ | - |
| ... | ... | ... | ... | ... | ... |

#### Data Flow
- **Insert**: When is data inserted?
- **Update**: When is data updated?
- **Delete**: When is data deleted?
- **Read**: Where is data read from?

#### Relationships
- **Foreign Keys**: What tables does this reference?
- **Referenced By**: What tables reference this?

#### Issues Found
- [ ] Unused columns
- [ ] Missing indexes
- [ ] Data inconsistencies
- [ ] Flow breaks
- [ ] Performance issues

#### Recommendations
- [ ] Remove unused columns
- [ ] Add missing indexes
- [ ] Fix data inconsistencies
- [ ] Optimize queries

## Next Steps

1. **Start with Core Tables**: Analyze user_profiles, test_attempts, test_completions first
2. **Check Data Usage**: Verify each column is actually used in the codebase
3. **Identify Flow Breaks**: Find where data flow is incomplete
4. **Check Relationships**: Ensure foreign keys are properly maintained
5. **Performance Analysis**: Look for missing indexes and slow queries

## Tools for Analysis

1. **Code Search**: Use grep to find table/column usage
2. **Database Queries**: Check actual data patterns
3. **TypeScript Types**: Verify type definitions match reality
4. **Migration Files**: Understand table evolution
5. **Function Analysis**: Check stored procedures and functions
