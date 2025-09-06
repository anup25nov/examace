# Constraint Violation Fix

## Issue Identified

**Error**: `409 Conflict - duplicate key value violates unique constraint "idx_test_completions_unique"`

**Root Cause**: The error shows a different constraint name (`idx_test_completions_unique`) than what we expected (`test_completions_unique`). This suggests the database has a unique index rather than a table constraint, and our previous delete-then-insert approach wasn't handling the constraint properly.

## Analysis

### Constraint Name Mismatch
- **Expected**: `test_completions_unique` (from migration files)
- **Actual**: `idx_test_completions_unique` (from error message)
- **Implication**: The database has a unique index that we need to handle differently

### Previous Fix Issues
The delete-then-insert approach had problems:
1. **NULL handling**: The delete operation might not work correctly with NULL `topic_id` values
2. **Constraint timing**: The constraint might be enforced at the index level, not just the table level
3. **Race conditions**: Multiple operations could still cause conflicts

## New Fix Applied

### Insert-Then-Update Strategy
Instead of delete-then-insert, we now use an **insert-then-update** approach:

```typescript
// 1. Try to insert first
let { data, error } = await supabase
  .from('test_completions')
  .insert(completionRecord)
  .select()
  .single();

// 2. If insert fails due to duplicate key (23505), update instead
if (error && error.code === '23505') {
  // Build update query with proper NULL handling
  let updateQuery = supabase
    .from('test_completions')
    .update({...})
    .eq('user_id', ...)
    .eq('exam_id', ...)
    .eq('test_type', ...)
    .eq('test_id', ...);

  // Handle topic_id properly (it might be null)
  if (completionRecord.topic_id === null) {
    updateQuery = updateQuery.is('topic_id', null);
  } else {
    updateQuery = updateQuery.eq('topic_id', completionRecord.topic_id);
  }
}
```

### Key Improvements

1. **Proper NULL Handling**: Uses `.is('topic_id', null)` for NULL values instead of `.eq('topic_id', null)`
2. **Error Code Detection**: Specifically checks for `23505` (duplicate key violation)
3. **Graceful Fallback**: If insert fails, automatically tries update
4. **Better Logging**: Logs when duplicate key is detected and update is attempted

## Files Modified

### `src/lib/supabaseStats.ts`
- **Lines 507-555**: Replaced delete-then-insert with insert-then-update approach
- **Added**: Proper NULL handling for `topic_id` field
- **Added**: Specific error code detection for duplicate key violations
- **Added**: Better error logging and handling

### `CHECK_DATABASE_CONSTRAINTS.sql`
- **Created**: Script to check actual database constraints and indexes
- **Purpose**: Help identify the exact constraint structure in the database

## How the New Fix Works

### 1. **Insert First**
- Attempts to insert the new record
- If successful, continues with normal flow

### 2. **Handle Duplicate Key**
- If insert fails with error code `23505` (duplicate key violation)
- Logs the duplicate key detection
- Proceeds to update the existing record

### 3. **Update Existing Record**
- Builds an update query with all the constraint fields
- Uses proper NULL handling for `topic_id`
- Updates the record with new data
- Returns the updated record

### 4. **Error Handling**
- If update also fails, returns the error
- Comprehensive logging for debugging

## Expected Results

### ✅ **No More 409 Errors**
- Insert-then-update approach handles duplicates gracefully
- Proper NULL handling prevents constraint violations
- No more duplicate key constraint errors

### ✅ **Correct Data Storage**
- Test completions are properly stored or updated
- Existing records are updated with new scores/times
- No data loss or corruption

### ✅ **Better Error Handling**
- Clear logging when duplicates are detected
- Graceful fallback from insert to update
- Better debugging information

## Testing Steps

### 1. Test Normal Insert
1. Take a new test (one that hasn't been completed)
2. Complete the test
3. Verify it's stored correctly without errors

### 2. Test Duplicate Handling
1. Take the same test again
2. Complete it with a different score
3. Verify the record is updated (not duplicated)
4. Check that no 409 errors occur

### 3. Test NULL Topic ID
1. Take a mock test (which has NULL topic_id)
2. Complete the test
3. Verify proper handling of NULL values

### 4. Monitor Logs
1. Check console for "Duplicate key detected" messages
2. Verify update operations are logged
3. Look for any remaining errors

## Database Investigation

Run the `CHECK_DATABASE_CONSTRAINTS.sql` script to:
- See the actual constraint names and definitions
- Identify any unique indexes
- Understand the exact database structure
- Verify the constraint is working as expected

## Next Steps

1. **Test the fix**: Take mock test 3 again and monitor for errors
2. **Check database**: Verify the record is stored/updated correctly
3. **Run constraint check**: Use the SQL script to verify database structure
4. **Monitor logs**: Look for duplicate key detection messages

The new approach should handle the constraint violation gracefully and provide better error handling and logging.
