# Database Analysis - Step 1: user_profiles Table

## Table Overview
**Purpose**: Core user data storage - stores user profile information, membership details, and referral data.

## Schema Analysis

### Current Schema (from TypeScript types):
```typescript
user_profiles: {
  Row: {
    created_at: string | null
    id: string                    // Primary key, references auth.users(id)
    membership_expiry: string | null
    membership_plan: string | null
    membership_status: string | null
    phone: string                 // Required, unique
    referral_code: string | null  // Unique
    referred_by: string | null
    updated_at: string | null
  }
}
```

### Original Schema (from migration):
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  membership_status VARCHAR(20) DEFAULT 'free',
  membership_plan VARCHAR(50),
  membership_expiry TIMESTAMP WITH TIME ZONE,
  referral_code VARCHAR(20) UNIQUE,
  referred_by VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Column Usage Analysis

| Column | Type | Used in Code | Purpose | Issues Found |
|--------|------|--------------|---------|--------------|
| `id` | UUID | ✅ | Primary key, user identifier | - |
| `phone` | VARCHAR(15) | ✅ | User's phone number | - |
| `membership_status` | VARCHAR(20) | ❌ | User's membership status | **UNUSED** |
| `membership_plan` | VARCHAR(50) | ✅ | Active membership plan | - |
| `membership_expiry` | TIMESTAMP | ✅ | When membership expires | - |
| `referral_code` | VARCHAR(20) | ✅ | User's referral code | - |
| `referred_by` | VARCHAR(20) | ✅ | Who referred this user | - |
| `created_at` | TIMESTAMP | ✅ | Account creation time | - |
| `updated_at` | TIMESTAMP | ✅ | Last update time | - |

## Code Usage Analysis

### ✅ **Used Columns**:

1. **`id`** - Primary key, used everywhere
2. **`phone`** - Authentication and identification
3. **`membership_plan`** - Payment processing, plan checks
4. **`membership_expiry`** - Plan validation
5. **`referral_code`** - Referral system
6. **`referred_by`** - Referral tracking
7. **`created_at`** - Profile creation
8. **`updated_at`** - Profile updates

### ❌ **Unused Columns**:

1. **`membership_status`** - Never referenced in code
   - **Issue**: Redundant with `membership_plan` and `membership_expiry`
   - **Impact**: Data inconsistency potential
   - **Recommendation**: Remove or use consistently

## Data Flow Analysis

### Insert Operations:
- **Auth triggers**: `handle_new_user()` function
- **Profile creation**: `supabaseAuth.ts`, `supabaseAuthSimple.ts`
- **Dev auth**: `devAuth.ts`

### Update Operations:
- **Membership updates**: `razorpayPaymentService.ts`, `paymentService.ts`
- **Referral updates**: `referralService.ts`
- **Profile updates**: `profileService.ts`

### Read Operations:
- **Profile fetching**: `profileService.ts`
- **Auth checks**: Multiple auth services
- **Referral checks**: Referral system

## Issues Found

### 1. **Schema Mismatch** 🚨
- **Problem**: TypeScript types show different columns than actual usage
- **Evidence**: Code references `email`, `name`, `upi_id`, `referral_earnings`, `total_referrals` but these aren't in the schema
- **Impact**: Runtime errors, type mismatches

### 2. **Unused Column** ⚠️
- **Problem**: `membership_status` is never used
- **Impact**: Data redundancy, confusion

### 3. **Missing Columns** 🚨
- **Problem**: Code expects columns that don't exist:
  - `email` - Referenced in multiple places
  - `name` - Referenced in profile service
  - `upi_id` - Referenced in profile service
  - `referral_earnings` - Referenced in profile service
  - `total_referrals` - Referenced in profile service
  - `phone_verified` - Referenced in profile service

### 4. **Data Type Issues** ⚠️
- **Problem**: `referred_by` is VARCHAR(20) but should reference `referral_codes.code`
- **Impact**: Foreign key constraint missing

## Recommendations

### Immediate Fixes:
1. **Add missing columns** to match code expectations
2. **Remove unused `membership_status`** column
3. **Add proper foreign key** for `referred_by`
4. **Update TypeScript types** to match actual schema

### Schema Updates Needed:
```sql
-- Add missing columns
ALTER TABLE user_profiles ADD COLUMN email VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN name VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN upi_id VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN referral_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN total_referrals INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;

-- Remove unused column
ALTER TABLE user_profiles DROP COLUMN membership_status;

-- Add foreign key constraint
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_referred_by_fkey 
  FOREIGN KEY (referred_by) REFERENCES referral_codes(code);
```

## Next Steps
1. **Verify actual database schema** vs TypeScript types
2. **Check if missing columns exist** in database but not in types
3. **Analyze test_attempts table** next
4. **Check for data inconsistencies** in existing records
