# Debug Test ID Issue

## Problem
The `submitindividualtestscore` RPC call is receiving `test_name: "mock"` instead of `test_name: "mock-test-2"`.

## Expected vs Actual

### Expected Request:
```json
{
  "exam_name": "ssc-cgl",
  "test_type_name": "mock",
  "test_name": "mock-test-2",  // ✅ Should be actual test ID
  "score_value": 13,
  "user_uuid": "660edf9c-fcad-41a3-8f27-4a496413899f"
}
```

### Actual Request:
```json
{
  "exam_name": "ssc-cgl",
  "test_type_name": "mock",
  "test_name": "mock",  // ❌ Wrong - should be "mock-test-2"
  "score_value": 13,
  "user_uuid": "660edf9c-fcad-41a3-8f27-4a496413899f"
}
```

## Debugging Steps

### Step 1: Check Console Logs
1. Open browser developer tools
2. Complete a Mock test (e.g., "Mock Test 2")
3. Check console for these debug logs:

#### Expected Logs:
```javascript
// TestInterface - submitIndividualTestScore parameters:
{
  examId: "ssc-cgl",
  testType: "mock",        // ✅ Correct
  testId: "mock-test-2",   // ✅ Should be actual test ID
  score: 13
}

// supabaseStats - submitIndividualTestScore received:
{
  examId: "ssc-cgl",
  testType: "mock",        // ✅ Correct
  testId: "mock-test-2",   // ✅ Should be actual test ID
  score: 13
}
```

### Step 2: Identify the Issue
Based on the logs, identify where the problem occurs:

#### If TestInterface logs show wrong testId:
- The issue is in the route parameters or URL structure
- Check the actual URL being used

#### If TestInterface logs show correct testId but supabaseStats shows wrong:
- The issue is in the parameter passing between functions
- Check the function call in TestInterface

#### If both logs show correct testId but request is wrong:
- The issue is in the supabaseStats service
- Check the RPC call parameters

## Route Structure Analysis

### Current Route:
```
/test/:examId/:sectionId/:testType
```

### Example URL:
```
/test/ssc-cgl/mock/mock-test-2
```

### Parameters:
- `examId` = "ssc-cgl"
- `sectionId` = "mock" (test type)
- `testType` = "mock-test-2" (actual test ID)

## Function Call Chain

### 1. TestInterface:
```typescript
await submitIndividualTestScore(examId, sectionId, testType!, score);
// examId = "ssc-cgl"
// sectionId = "mock"
// testType = "mock-test-2"
// score = 13
```

### 2. useExamStats Hook:
```typescript
const submitIndividualTestScore = async (examId: string, testType: string, testId: string, score: number) => {
  return await supabaseStatsService.submitIndividualTestScore(examId, testType, testId, score);
};
// examId = "ssc-cgl"
// testType = "mock"
// testId = "mock-test-2"
// score = 13
```

### 3. supabaseStats Service:
```typescript
await supabase.rpc('submitindividualtestscore', {
  user_uuid: user.id,
  exam_name: examId,        // "ssc-cgl"
  test_type_name: testType, // "mock"
  test_name: testId,        // "mock-test-2"
  score_value: score        // 13
});
```

## Possible Issues

### Issue 1: Route Parameters
If the URL is not structured correctly, the parameters might be wrong.

### Issue 2: Parameter Order
If the function call has parameters in wrong order.

### Issue 3: Variable Names
If there's confusion between `sectionId` and `testType` variables.

## Testing Instructions

### Test 1: Check URL Structure
1. Navigate to a Mock test
2. Check the URL in browser address bar
3. **Expected**: `/test/ssc-cgl/mock/mock-test-2`
4. **Not Expected**: `/test/ssc-cgl/mock/mock`

### Test 2: Check Console Logs
1. Complete a Mock test
2. Check console for debug logs
3. Verify parameter values at each step

### Test 3: Check Network Tab
1. Open Network tab in developer tools
2. Complete a Mock test
3. Find the `submitindividualtestscore` request
4. Check the request payload

## Fixes Applied

### 1. Added Debug Logging
- TestInterface: Logs parameters before calling function
- supabaseStats: Logs parameters received by service

### 2. Parameter Verification
- Ensured correct parameter order in function calls
- Added comments to clarify parameter meanings

## Next Steps

1. **Run the test**: Complete a Mock test and check console logs
2. **Identify the issue**: Based on logs, find where the wrong value is coming from
3. **Apply fix**: Fix the specific issue identified
4. **Verify**: Test again to ensure correct test_id is passed

## Expected Results After Fix

### Console Logs:
```javascript
// TestInterface - submitIndividualTestScore parameters:
{
  examId: "ssc-cgl",
  testType: "mock",
  testId: "mock-test-2",  // ✅ Correct test ID
  score: 13
}

// supabaseStats - submitIndividualTestScore received:
{
  examId: "ssc-cgl",
  testType: "mock",
  testId: "mock-test-2",  // ✅ Correct test ID
  score: 13
}
```

### Network Request:
```json
{
  "exam_name": "ssc-cgl",
  "test_type_name": "mock",
  "test_name": "mock-test-2",  // ✅ Correct test ID
  "score_value": 13,
  "user_uuid": "660edf9c-fcad-41a3-8f27-4a496413899f"
}
```

### Database:
```sql
SELECT * FROM individual_test_scores WHERE user_id = 'your-user-id';
-- Should show test_id as "mock-test-2" instead of "mock"
```

The debug logs will help identify exactly where the issue occurs in the parameter passing chain.
