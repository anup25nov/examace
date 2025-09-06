# Query Mismatch Fix - Select-First Approach

## Issue Analysis

**Problem**: The update query was failing with `PGRST116` (no rows found) because it couldn't find the existing record, even though the insert was failing with a duplicate key constraint.

**Root Cause**: There was a mismatch between the query parameters used to find existing records and the actual data in the database. The update query was not finding the record that the insert was trying to duplicate.

## Error Sequence

1. **First Error**: `409 Conflict` with `"test_completions_unique"` constraint
   - The insert operation failed because a record already exists
   
2. **Second Error**: `406 Not Acceptable` with `PGRST116` 
   - The update operation failed because it couldn't find the existing record
   - This suggests a mismatch in the query parameters

## New Approach: Select-First Strategy

Instead of trying to update directly, we now use a **select-first** approach that:

1. **Check for Existing Records**: First query to see if a record exists with the exact parameters
2. **Update if Found**: If record exists, update it using the record's ID
3. **Insert if Not Found**: If no record exists, insert a new one
4. **Comprehensive Logging**: Log all parameters and operations for debugging

### Code Implementation

```typescript
// 1. First, check if a record already exists with these exact parameters
console.log('Checking for existing test completion record with parameters:', {
  user_id: completionRecord.user_id,
  exam_id: completionRecord.exam_id,
  test_type: completionRecord.test_type,
  test_id: completionRecord.test_id,
  topic_id: completionRecord.topic_id
});

// 2. Build the select query to check for existing records
let selectQuery = supabase
  .from('test_completions')
  .select('*')
  .eq('user_id', completionRecord.user_id)
  .eq('exam_id', completionRecord.exam_id)
  .eq('test_type', completionRecord.test_type)
  .eq('test_id', completionRecord.test_id);

// 3. Handle topic_id properly for select
const finalSelectQuery = completionRecord.topic_id === null 
  ? selectQuery.is('topic_id', null)
  : selectQuery.eq('topic_id', completionRecord.topic_id);

// 4. Execute select query
const { data: existingRecords, error: selectError } = await finalSelectQuery;

// 5. If record exists, update it using the record's ID
if (existingRecords && existingRecords.length > 0) {
  console.log('Found existing record, updating it:', existingRecords[0]);
  
  const { data: updateData, error: updateError } = await supabase
    .from('test_completions')
    .update({...})
    .eq('id', existingRecords[0].id)  // Use the record's ID for update
    .select()
    .single();
}

// 6. If no record exists, insert new one
else {
  console.log('No existing record found, inserting new record...');
  
  const { data: insertData, error: insertError } = await supabase
    .from('test_completions')
    .insert(completionRecord)
    .select()
    .single();
}
```

## Key Improvements

### ✅ **Eliminates Query Mismatch**
- First checks for existing records with exact parameters
- Uses the record's ID for updates (more reliable than complex WHERE clauses)
- Ensures we're working with the correct record

### ✅ **Better Error Handling**
- Clear distinction between "record exists" and "record doesn't exist"
- Comprehensive logging of all parameters and operations
- No more `PGRST116` errors from failed updates

### ✅ **More Reliable Updates**
- Updates using the record's primary key (ID) instead of complex WHERE clauses
- Avoids issues with NULL handling in WHERE clauses
- More predictable behavior

### ✅ **Comprehensive Logging**
- Logs all query parameters before execution
- Logs existing records when found
- Clear success/failure messages for each operation

## Files Modified

### `src/lib/supabaseStats.ts`
- **Lines 507-579**: Implemented select-first approach
- **Added**: Comprehensive parameter logging
- **Added**: Select query to check for existing records
- **Added**: Update using record ID instead of complex WHERE clauses
- **Added**: Better error handling and logging

## Expected Results

### ✅ **No More Query Mismatches**
- Select query will find existing records correctly
- Updates will work using the record's ID
- No more `PGRST116` errors

### ✅ **No More Constraint Violations**
- Insert only happens when no record exists
- Update happens when record exists
- No duplicate key violations

### ✅ **Better Debugging**
- Clear logging of all parameters and operations
- Easy to see what's happening at each step
- Better error messages

## Testing Steps

### 1. Test New Record Creation
1. Take a test that hasn't been completed before
2. Complete the test
3. Check console for "No existing record found, inserting new record..." message
4. Verify the record is inserted correctly

### 2. Test Existing Record Update
1. Take the same test again
2. Complete it with a different score
3. Check console for "Found existing record, updating it:" message
4. Verify the record is updated (not duplicated)

### 3. Test Parameter Logging
1. Take any test
2. Check console for "Checking for existing test completion record with parameters:" message
3. Verify all parameters are logged correctly
4. Check that the parameters match what you expect

### 4. Monitor for Errors
1. Look for any remaining 409 or 406 errors
2. Check that all operations complete successfully
3. Verify no constraint violations occur

## Debugging Information

The new approach provides comprehensive logging:

- **Parameter Logging**: Shows exactly what parameters are being used
- **Record Detection**: Shows whether existing records are found
- **Operation Logging**: Shows whether update or insert is performed
- **Success/Failure**: Clear messages for each operation

## Next Steps

1. **Test the fix**: Take mock test 3 again and monitor the console logs
2. **Check parameter logging**: Verify the logged parameters match your expectations
3. **Verify operations**: Check that the correct operation (update/insert) is performed
4. **Monitor for errors**: Ensure no more constraint violations occur

The select-first approach should completely eliminate both the query mismatch and constraint violation issues by ensuring we always work with the correct record.
