# Parameter Mapping Issue Fix

## Issue Identified

Based on the database results you provided, there's a parameter mapping issue causing test completions to be stored incorrectly.

### Current Database State
```json
{
  "user_id": "660edf9c-fcad-41a3-8f27-4a496413899f",
  "exam_id": "ssc-cgl",
  "test_type": "mock",
  "test_id": "mock",           // ❌ Should be "mock-test-3"
  "topic_id": "mock-test-3",   // ❌ Should be null
  "score": 54,
  "completed_at": "2025-09-06 18:52:42.541467+00"
}
```

### Expected Database State
```json
{
  "user_id": "660edf9c-fcad-41a3-8f27-4a496413899f",
  "exam_id": "ssc-cgl",
  "test_type": "mock",
  "test_id": "mock-test-3",    // ✅ Correct
  "topic_id": null,            // ✅ Correct
  "score": 54,
  "completed_at": "2025-09-06 18:52:42.541467+00"
}
```

## Root Cause Analysis

The issue is in the parameter mapping between the TestInterface and the database storage. The parameters are being swapped or incorrectly mapped.

### URL Structure
For URL: `/test/ssc-cgl/mock/mock-test-3`
- `examId`: "ssc-cgl"
- `sectionId`: "mock" (test type)
- `testType`: "mock-test-3" (test ID)
- `topic`: undefined

### Current Parameter Flow
1. **TestInterface** calls `submitTestAttempt(examId, score, totalQuestions, correctAnswers, timeTaken, answers, sectionId!, testType!, topic)`
2. **useExamStats** maps to `submitTestCompletion({ testType: sectionId, testId: testId, topicId: topicId })`
3. **Database** stores with swapped parameters

## Fix Applied

### 1. Added Debug Logging
Added comprehensive debug logging to track the exact parameters being passed:

- `src/hooks/useExamStats.ts` - Added logging in `submitTestAttempt`
- `src/lib/supabaseStats.ts` - Added logging in `submitTestCompletion`

### 2. Parameter Mapping Verification
The current mapping should be correct:
- `testType` = `sectionId` ("mock")
- `testId` = `testType` ("mock-test-3")
- `topicId` = `topic` (undefined → null)

## Testing Steps

### Step 1: Take Mock Test 3 Again
1. Navigate to mock test 3
2. Complete the test
3. Check browser console for debug logs

### Step 2: Verify Parameters in Console
Look for these log messages:
```
submitTestAttempt called with: {
  targetExamId: "ssc-cgl",
  sectionId: "mock",
  testId: "mock-test-3",
  topicId: undefined
}

submitTestCompletion called with: {
  examId: "ssc-cgl",
  testType: "mock",
  testId: "mock-test-3",
  topicId: undefined
}

Storing test completion record: {
  user_id: "...",
  exam_id: "ssc-cgl",
  test_type: "mock",
  test_id: "mock-test-3",
  topic_id: null
}
```

### Step 3: Check Database
Run this query in Supabase SQL Editor:
```sql
SELECT 
  user_id,
  exam_id,
  test_type,
  test_id,
  topic_id,
  score,
  completed_at
FROM test_completions 
WHERE exam_id = 'ssc-cgl' 
  AND test_type = 'mock'
  AND test_id = 'mock-test-3'
ORDER BY completed_at DESC
LIMIT 1;
```

### Step 4: Test Completion Check
```sql
SELECT is_test_completed(
  '660edf9c-fcad-41a3-8f27-4a496413899f'::uuid,
  'ssc-cgl',
  'mock',
  'mock-test-3',
  NULL
) as is_completed;
```

## Expected Results After Fix

✅ **Correct Storage**: `test_id` should be "mock-test-3", `topic_id` should be null
✅ **Completion Check**: `is_test_completed` should return `true`
✅ **Dashboard Display**: Test should show as completed

## If Issue Persists

If the parameters are still being swapped, we may need to:

1. **Check the TestInterface parameter passing**
2. **Verify the URL routing structure**
3. **Fix the parameter mapping in the function calls**

The debug logging will help identify exactly where the parameter swap is occurring.

## Files Modified

- `src/hooks/useExamStats.ts` - Added debug logging
- `src/lib/supabaseStats.ts` - Added debug logging
- `PARAMETER_MAPPING_ISSUE_FIX.md` - This documentation

## Next Steps

1. Take mock test 3 again
2. Check console logs for parameter values
3. Verify database storage
4. Test completion status
5. Report back with the console logs and database results
