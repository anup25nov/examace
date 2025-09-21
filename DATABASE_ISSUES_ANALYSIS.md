# Database Issues Analysis and Solutions

## Issues Identified

### 1. Unused Tables and Dependencies
**Problem**: The database contains tables that are not being used or have very few records.

**Tables to Review**:
- `question_images` - Likely unused feature
- `admin_users` - May have very few records
- `referral_payouts` - May be empty or unused
- `referral_commissions` - May have low usage

**Solution**: 
- Create a function to identify tables with low usage
- Drop unused tables to reduce database size
- Remove dependencies on unused tables

### 2. Unnecessary Exam Records
**Problem**: Users have exam_stats records for exams they never took (e.g., airforce, mts, navy, army when they only took ssc-cgl).

**Root Cause**: 
- The system creates exam_stats records for all available exams when a user registers
- This happens regardless of whether the user actually takes tests for those exams

**Solution**:
- Delete exam_stats records that have no corresponding test_completions
- Only create exam_stats records when a user actually takes a test
- Add constraints to prevent invalid exam_ids

### 3. Membership Data Inconsistency
**Problem**: User's current plan is not getting updated correctly.

**Root Cause**:
- `user_profiles.membership_status` and `user_memberships` table are out of sync
- The system updates one but not the other consistently

**Solution**:
- Sync `user_profiles` with `user_memberships` data
- Update membership status based on actual membership records
- Ensure consistency between the two tables

## Migration Scripts Created

### 1. Database Cleanup Migration (`20250115000075_cleanup_and_fix_database.sql`)
This migration:
- Cleans up invalid exam_ids from all tables
- Removes exam_stats records with no corresponding test completions
- Fixes membership inconsistencies
- Adds constraints to prevent future issues
- Creates indexes for better performance

### 2. Analysis Functions
- `get_table_usage()` - Identifies unused tables
- `membership_summary` - View for membership status
- Constraints to prevent invalid exam_ids

## Recommended Actions

### Immediate Actions
1. **Run the cleanup migration** to fix data inconsistencies
2. **Verify membership data** is now consistent
3. **Check exam records** are only for exams users actually took

### Long-term Improvements
1. **Modify user registration** to not create exam_stats for all exams
2. **Add triggers** to keep membership data in sync
3. **Regular cleanup** of unused data
4. **Monitor table usage** to identify future unused tables

## SQL Queries to Verify Fixes

### Check Exam Records
```sql
-- See which exams have records
SELECT exam_id, COUNT(*) as record_count
FROM exam_stats 
GROUP BY exam_id 
ORDER BY record_count DESC;

-- Check if users have records for exams they never took
SELECT 
    es.user_id,
    es.exam_id,
    COUNT(*) as stats_count,
    COUNT(tc.id) as completion_count
FROM exam_stats es
LEFT JOIN test_completions tc ON es.user_id = tc.user_id AND es.exam_id = tc.exam_id
GROUP BY es.user_id, es.exam_id
HAVING COUNT(tc.id) = 0;
```

### Check Membership Consistency
```sql
-- Check membership inconsistencies
SELECT 
    up.id,
    up.phone,
    up.membership_status as profile_status,
    up.membership_plan as profile_plan,
    um.plan_id as actual_plan,
    um.status as actual_status,
    um.end_date as expiry_date
FROM user_profiles up
LEFT JOIN user_memberships um ON up.id = um.user_id
WHERE up.membership_status != 'free' OR um.plan_id IS NOT NULL
ORDER BY up.created_at DESC;
```

### Check Table Usage
```sql
-- See which tables are unused
SELECT * FROM get_table_usage();
```

## Expected Results After Cleanup

1. **Reduced Database Size**: Unused tables and records removed
2. **Consistent Membership Data**: user_profiles and user_memberships in sync
3. **Accurate Exam Records**: Only records for exams users actually took
4. **Better Performance**: Proper indexes and constraints
5. **Data Integrity**: Constraints prevent future inconsistencies

## Files Created

1. `supabase/migrations/20250115000075_cleanup_and_fix_database.sql` - Main cleanup migration
2. `analyze_database_issues.sql` - Analysis script
3. `run_cleanup.sql` - Cleanup execution script
4. `DATABASE_ISSUES_ANALYSIS.md` - This analysis document

## Next Steps

1. Run the migration when database connection is stable
2. Verify the fixes work correctly
3. Monitor the database for any issues
4. Implement the long-term improvements
