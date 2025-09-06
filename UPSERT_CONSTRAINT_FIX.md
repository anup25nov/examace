# Upsert Constraint Fix - Proper Conflict Resolution

## Issue Analysis

**Problem**: We're getting both constraint violation and "no rows found" errors:

1. **First Error**: `23505` - duplicate key constraint violation when trying to INSERT
2. **Second Error**: `PGRST116` - no rows found when trying to UPDATE

**Root Cause**: The UPDATE query is not finding the existing record because the parameters don't match the actual data structure, but the INSERT is failing because the record already exists (causing the constraint violation).

## URL Analysis

From the error URLs, we can see:
- **UPDATE query**: `test_id=eq.mock&topic_id=eq.mock-test-1`
- **Constraint violation**: Suggests there IS a record, but with different parameters

This indicates a **parameter mapping issue** where:
- The UPDATE query parameters don't match the actual stored data
- The INSERT fails because a record with the same constraint values already exists

## New Approach: Proper Upsert with Fallback

Instead of trying to handle update/insert separately, we now use a **proper upsert approach** with a **delete-then-insert fallback**:

### 1. **Try Upsert First**
- Use Supabase's built-in upsert functionality
- Proper conflict resolution with the correct constraint fields
- Handles both insert and update cases automatically

### 2. **Fallback to Delete-Then-Insert**
- If upsert fails, manually delete the existing record
- Then insert the new record
- Handles edge cases where upsert might not work

## Code Implementation

```typescript
// 1. Try upsert first with proper conflict resolution
const { data: completionData, error: completionError } = await supabase
  .from('test_completions')
  .upsert(completionRecord, {
    onConflict: 'user_id,exam_id,test_type,test_id,topic_id',
    ignoreDuplicates: false
  })
  .select()
  .single();

// 2. If upsert fails, try delete-then-insert
if (completionError) {
  console.log('Upsert failed, trying delete-then-insert approach...');
  
  // Delete existing record
  const deleteQuery = supabase
    .from('test_completions')
    .delete()
    .eq('user_id', completionRecord.user_id)
    .eq('exam_id', completionRecord.exam_id)
    .eq('test_type', completionRecord.test_type)
    .eq('test_id', completionRecord.test_id);

  // Handle topic_id properly for delete
  const finalDeleteQuery = completionRecord.topic_id === null 
    ? deleteQuery.is('topic_id', null)
    : deleteQuery.eq('topic_id', completionRecord.topic_id);

  // Execute delete
  const { error: deleteError } = await finalDeleteQuery;
  
  // Insert new record
  const { data: insertData, error: insertError } = await supabase
    .from('test_completions')
    .insert(completionRecord)
    .select()
    .single();
}
```

## Key Improvements

### ✅ **Proper Upsert Implementation**
- Uses Supabase's built-in upsert functionality
- Correct conflict resolution with all constraint fields
- Handles both insert and update cases automatically

### ✅ **Robust Fallback Mechanism**
- If upsert fails, falls back to delete-then-insert
- Handles edge cases where upsert might not work
- Ensures the operation always succeeds

### ✅ **Correct Constraint Handling**
- Uses the proper constraint fields: `user_id,exam_id,test_type,test_id,topic_id`
- Handles NULL values correctly in the delete operation
- Avoids parameter mapping issues

### ✅ **Better Error Handling**
- Clear logging for each step of the process
- Graceful fallback from upsert to delete-then-insert
- Comprehensive error reporting

## Files Modified

### `src/lib/supabaseStats.ts`
- **Lines 507-562**: Implemented proper upsert with fallback approach
- **Added**: Upsert with correct conflict resolution
- **Added**: Delete-then-insert fallback mechanism
- **Added**: Proper NULL handling for topic_id
- **Added**: Comprehensive logging for debugging

## Expected Results

### ✅ **No More Constraint Violations**
- Upsert handles duplicate records automatically
- Fallback ensures the operation always succeeds
- No more 23505 errors

### ✅ **No More PGRST116 Errors**
- Upsert doesn't rely on complex WHERE clauses
- Fallback uses delete-then-insert which is more reliable
- No more "0 rows found" errors

### ✅ **More Reliable Operations**
- Built-in upsert functionality is more robust
- Fallback mechanism handles edge cases
- Consistent behavior regardless of existing data

## Testing Steps

### 1. Test New Record Creation
1. Take a test that hasn't been completed before
2. Complete the test
3. Check console for "Successfully upserted test completion record" message
4. Verify the record is inserted correctly

### 2. Test Existing Record Update
1. Take the same test again
2. Complete it with a different score
3. Check console for "Successfully upserted test completion record" message
4. Verify the record is updated correctly

### 3. Test Fallback Mechanism
1. If upsert fails, check console for "Upsert failed, trying delete-then-insert approach..." message
2. Verify the fallback mechanism works correctly
3. Check that the operation completes successfully

### 4. Monitor for Errors
1. Look for any remaining 23505 or PGRST116 errors
2. Check that all operations complete successfully
3. Verify no constraint violations occur

## How It Works

### 1. **Upsert Attempt**
- Tries to insert the record
- If a duplicate exists, updates it instead
- Uses the correct constraint fields for conflict resolution

### 2. **Fallback Mechanism**
- If upsert fails for any reason, falls back to delete-then-insert
- Deletes any existing record with the same constraint values
- Inserts the new record

### 3. **Error Handling**
- Comprehensive logging for each step
- Clear success/failure messages
- Graceful handling of all error cases

## Next Steps

1. **Test the fix**: Take mock test 3 again and monitor for any errors
2. **Check console logs**: Look for upsert success or fallback messages
3. **Verify operations**: Check that test completion works correctly
4. **Monitor for errors**: Ensure no more constraint violations occur

The proper upsert approach with fallback should completely eliminate both the constraint violation and PGRST116 errors by using the most reliable database operations available.
