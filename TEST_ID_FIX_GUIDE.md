# Test ID Fix Guide

## Issue Identified
The `individual_test_scores` table is storing the test type ("mock") instead of the actual test name ("mock-test-4") in the `test_id` field.

## Root Cause Analysis

### Current Data (Incorrect):
```json
{
  "test_id": "mock",        // ❌ Should be "mock-test-4"
  "test_type": "mock",      // ✅ Correct
  "exam_id": "ssc-cgl"      // ✅ Correct
}
```

### Expected Data (Correct):
```json
{
  "test_id": "mock-test-4", // ✅ Should be actual test name
  "test_type": "mock",      // ✅ Correct
  "exam_id": "ssc-cgl"      // ✅ Correct
}
```

## Debugging Steps

### Step 1: Check Console Logs
1. Open browser developer tools
2. Complete a Mock or PYQ test
3. Check console for debug logs:
   - `submitTestCompletion - submission data:`
   - `submitIndividualTestScore - parameters:`

### Step 2: Verify Parameters
The logs should show:
```javascript
// submitTestCompletion
{
  examId: "ssc-cgl",
  testType: "mock",        // ✅ Correct
  testId: "mock-test-4",   // ✅ Should be actual test name
  topicId: null,
  score: 85
}

// submitIndividualTestScore
{
  examId: "ssc-cgl",
  testType: "mock",        // ✅ Correct
  testId: "mock-test-4",   // ✅ Should be actual test name
  score: 85
}
```

### Step 3: Check Database Function
If parameters are correct but database shows wrong data, the issue is in the database function.

## Fixes Applied

### 1. Added Debug Logging
- Added console logs to track parameter values
- This will help identify where the issue occurs

### 2. UI Already Fixed
- Green tick shows for completed tests ✅
- Retry and View Solutions buttons show for completed tests ✅
- Score and rank display properly ✅

### 3. Database Function Fix
- Run `COMPREHENSIVE_DATABASE_FIX.sql` to ensure functions work correctly

## Testing Instructions

### Test 1: Complete a Mock Test
1. Navigate to SSC CGL dashboard
2. Start a Mock test (e.g., "Mock Test 4")
3. Complete the test
4. Check console logs for debug output
5. Return to dashboard
6. **Expected**: Green tick, score, rank, retry/view solutions buttons

### Test 2: Check Database
1. Go to Supabase dashboard
2. Check `individual_test_scores` table
3. **Expected**: `test_id` should be "mock-test-4" (or similar)
4. **Not Expected**: `test_id` should NOT be "mock"

### Test 3: Test Completion Detection
1. Return to dashboard
2. **Expected**: Test shows as completed with green tick
3. **Expected**: Score and rank are displayed
4. **Expected**: Retry and View Solutions buttons are visible

## Troubleshooting

### If test_id is still "mock":
1. Check console logs to see what parameters are being passed
2. If parameters are correct, the database function needs fixing
3. If parameters are wrong, the issue is in the frontend code

### If UI doesn't show completion status:
1. Check if `isTestCompleted` function is working
2. Verify the completion key format matches between storage and retrieval
3. Check browser console for errors

### If score/rank not showing:
1. Check if `getIndividualTestScore` function is working
2. Verify the test_id matches between storage and retrieval
3. Check if the score was actually stored in the database

## Expected Results After Fix

### Database:
```sql
SELECT * FROM individual_test_scores WHERE user_id = 'your-user-id';
-- Should show test_id as actual test names like "mock-test-4", "pyq-2023", etc.
```

### UI:
- ✅ Green tick for completed tests
- ✅ Score display (percentage)
- ✅ Rank display (out of participants)
- ✅ Retry button (clears previous attempt)
- ✅ View Solutions button (shows solutions)
- ✅ Performance Statistics (Mock + PYQ only)

## Next Steps

1. **Run the database fix**: Execute `COMPREHENSIVE_DATABASE_FIX.sql`
2. **Test the functionality**: Complete a Mock or PYQ test
3. **Check the logs**: Verify parameters are correct
4. **Verify database**: Check that test_id is stored correctly
5. **Test UI**: Ensure all features work as expected

## Files Modified

1. `src/lib/supabaseStats.ts` - Added debug logging
2. `src/pages/TestInterface.tsx` - Fixed parameter passing
3. `COMPREHENSIVE_DATABASE_FIX.sql` - Fixed database functions
4. `src/pages/ExamDashboard.tsx` - Enhanced UI (already done)

The main issue is likely in the database function or parameter passing. The debug logs will help identify the exact cause.
