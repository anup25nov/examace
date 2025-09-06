# Parameter Mapping Fix for Test Completion

## Issue Identified

Looking at the database results, the test completion is being stored with incorrect parameter mapping:

**For mock-test-3 (what is stored):**
- `test_type`: "mock" ✓
- `test_id`: "mock" ❌ (should be "mock-test-3")
- `topic_id`: "mock-test-3" ❌ (should be null)

**For mock-test-1 (what is stored):**
- `test_type`: "mock" ✓
- `test_id`: "mock-test-1" ✓
- `topic_id`: null ✓

## Root Cause

The issue appears to be in the parameter mapping in the `submitTestAttempt` function. The parameters are being swapped or incorrectly mapped.

## URL Structure Analysis

For URL: `/test/ssc-cgl/mock/mock-test-3`
- `examId`: "ssc-cgl"
- `sectionId`: "mock" (test type)
- `testType`: "mock-test-3" (test ID)
- `topic`: undefined

## Expected vs Actual Storage

**Expected storage for mock-test-3:**
```json
{
  "user_id": "660edf9c-fcad-41a3-8f27-4a496413899f",
  "exam_id": "ssc-cgl",
  "test_type": "mock",
  "test_id": "mock-test-3",
  "topic_id": null,
  "score": 54
}
```

**Actual storage for mock-test-3:**
```json
{
  "user_id": "660edf9c-fcad-41a3-8f27-4a496413899f",
  "exam_id": "ssc-cgl",
  "test_type": "mock",
  "test_id": "mock",           // ❌ Wrong!
  "topic_id": "mock-test-3",   // ❌ Wrong!
  "score": 54
}
```

## Fix Required

The parameter mapping in `submitTestAttempt` needs to be corrected to ensure:
- `testType` = `sectionId` (test type: "mock", "pyq", "practice")
- `testId` = `testType` (actual test ID: "mock-test-3", etc.)
- `topicId` = `topic` (for practice tests, null for mock/pyq)

## Files to Check/Modify

1. `src/hooks/useExamStats.ts` - `submitTestAttempt` function
2. `src/pages/TestInterface.tsx` - Parameter passing
3. `src/lib/supabaseStats.ts` - `submitTestCompletion` function

## Testing

After fixing, test with:
1. Take mock-test-3 again
2. Verify the database stores:
   - `test_type`: "mock"
   - `test_id`: "mock-test-3"
   - `topic_id`: null
3. Check that `is_test_completed` returns true
