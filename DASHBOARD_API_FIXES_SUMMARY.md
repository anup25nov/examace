# Dashboard API Issues Fixed

## Issues Identified and Resolved

### 1. Multiple API Calls to user_profiles (7 times)
**Problem**: Each dashboard component was making individual API calls to fetch user profile data, resulting in 7 duplicate calls.

**Solution**: 
- Created `DashboardDataContext` to centralize user data fetching
- Updated all dashboard components to use shared context instead of individual hooks
- Implemented caching to prevent unnecessary API calls
- Modified `App.tsx` to wrap the application with `DashboardDataProvider`

**Files Modified**:
- `src/contexts/DashboardDataContext.tsx` (new)
- `src/App.tsx`
- `src/pages/EnhancedExamDashboard.tsx`
- `src/pages/ExamDashboard.tsx`
- `src/pages/ProfessionalExamDashboard.tsx`

### 2. user_memberships API Calls with Different Parameters
**Problem**: Two different API calls were being made:
- One with additional filters (giving 200 response)
- One without filters (giving 406 response)

**Solution**:
- Updated `optimizedApiService.ts` to use consistent parameters
- Added proper date filtering and ordering
- Used `maybeSingle()` instead of `single()` to handle cases where no membership exists

**Files Modified**:
- `src/lib/optimizedApiService.ts`

### 3. get_user_messages RPC Function - Column Error
**Problem**: Function was trying to access `um.message` column but the table has `content` column.

**Solution**:
- Fixed the RPC function to use `um.content as message`
- Added proper column mapping
- Added `message_type` column to user_messages table

**SQL Fix**:
```sql
CREATE OR REPLACE FUNCTION get_user_messages(user_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
    id UUID,
    message_type VARCHAR(50),
    title TEXT,
    message TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.id,
        COALESCE(um.message_type, 'info') as message_type,
        um.title,
        um.content as message,  -- Use 'content' column instead of 'message'
        um.is_read,
        um.created_at
    FROM user_messages um
    WHERE um.user_id = user_uuid
    ORDER BY um.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. get_comprehensive_referral_stats RPC Function - Ambiguous Column
**Problem**: Ambiguous `referral_code` column reference causing 400 error.

**Solution**:
- Fixed the function to explicitly reference `rc.code as referral_code`
- Ensured proper table aliases and column references

**SQL Fix**:
```sql
CREATE OR REPLACE FUNCTION get_comprehensive_referral_stats(user_uuid UUID)
RETURNS TABLE(
    referral_code VARCHAR(20),
    total_referrals INTEGER,
    total_commissions_earned DECIMAL(10,2),
    paid_commissions DECIMAL(10,2),
    pending_commissions DECIMAL(10,2),
    cancelled_commissions DECIMAL(10,2),
    active_referrals INTEGER,
    completed_referrals INTEGER,
    pending_referrals INTEGER,
    referral_link TEXT,
    code_created_at TIMESTAMP WITH TIME ZONE,
    last_referral_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.code as referral_code,  -- Explicitly reference rc.code
        COALESCE(rc.total_referrals, 0)::INTEGER as total_referrals,
        COALESCE(rc.total_earnings, 0.00) as total_commissions_earned,
        -- ... rest of the query
    FROM referral_codes rc
    LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
    LEFT JOIN referral_commissions rc_comm ON rt.referred_id = rc_comm.referred_id
    WHERE rc.user_id = user_uuid
    GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings, rc.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Files Created/Modified

### New Files:
- `src/contexts/DashboardDataContext.tsx` - Centralized dashboard data management
- `fix_dashboard_api_issues.sql` - SQL fixes for RPC functions
- `apply_dashboard_fixes.sql` - Direct SQL fixes to apply
- `DASHBOARD_API_FIXES_SUMMARY.md` - This summary document

### Modified Files:
- `src/App.tsx` - Added DashboardDataProvider
- `src/pages/EnhancedExamDashboard.tsx` - Updated to use shared context
- `src/pages/ExamDashboard.tsx` - Updated to use shared context
- `src/pages/ProfessionalExamDashboard.tsx` - Updated to use shared context
- `src/lib/optimizedApiService.ts` - Fixed membership query parameters

## Next Steps

1. **Apply SQL Fixes**: Run the SQL fixes in Supabase SQL Editor:
   ```sql
   -- Copy and paste the contents of apply_dashboard_fixes.sql
   ```

2. **Test the Dashboard**: Verify that:
   - User profile data loads only once
   - Membership data loads correctly
   - Messages load without errors
   - Referral stats load without errors

3. **Monitor API Calls**: Check the network tab to ensure:
   - No duplicate user_profiles calls
   - Consistent user_memberships calls
   - No 400 errors from RPC functions

## Benefits

- **Reduced API Calls**: From 7+ calls to 1 call for user data
- **Better Performance**: Cached data reduces loading times
- **Error Prevention**: Fixed RPC function errors
- **Consistent Data**: All components use the same data source
- **Better UX**: Faster loading and fewer errors
