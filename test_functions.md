# Test Functions for Database Issues

## Issues Fixed:

### 1. ✅ `create_all_default_exam_stats` Function
**Problem**: Function was missing from database
**Solution**: Created comprehensive function in migration `20250115000018`

**Usage**:
```javascript
// Create default exam stats for all exams
supabase.rpc('create_all_default_exam_stats', {
  p_user_id: "48d26d2e-79f5-402d-b93b-e0ce56b917e3"
})
```

### 2. ✅ `test_attempts` NOT NULL Constraint
**Problem**: `test_id` column had NOT NULL constraint but no value provided
**Solution**: Made `test_id` nullable and added default value in migration `20250115000019`

**Usage**:
```javascript
// Option 1: Use the simple function
supabase.rpc('insert_simple_test_attempt', {
  p_user_id: "48d26d2e-79f5-402d-b93b-e0ce56b917e3",
  p_exam_id: "ssc-cgl",
  p_score: 0,
  p_total_questions: 1,
  p_correct_answers: 0,
  p_time_taken: 5,
  p_answers: [{"questionId":"q1","selectedOption":-1,"isCorrect":false}]
})

// Option 2: Direct insert (now works with nullable test_id)
supabase.from('test_attempts').insert({
  user_id: "48d26d2e-79f5-402d-b93b-e0ce56b917e3",
  exam_id: "ssc-cgl",
  score: 0,
  total_questions: 1,
  correct_answers: 0,
  time_taken: 5,
  answers: [{"questionId":"q1","selectedOption":-1,"isCorrect":false}]
})
```

### 3. ✅ Available Functions

#### **Exam Stats Functions**:
- `create_all_default_exam_stats(p_user_id)` - Create stats for all exams
- `create_default_exam_stats(p_user_id, p_exam_id)` - Create stats for specific exam
- `create_default_user_streak(p_user_id)` - Create user streak record
- `initialize_new_user(p_user_id, p_phone)` - Complete user initialization

#### **Test Attempt Functions**:
- `insert_simple_test_attempt(...)` - Simple test attempt insertion
- `insert_test_attempt_with_defaults(...)` - Advanced test attempt insertion

## Test Commands:

### Test 1: Create Default Exam Stats
```bash
curl -X POST 'https://talvssmwnsfotoutjlhd.supabase.co/rest/v1/rpc/create_all_default_exam_stats' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id": "48d26d2e-79f5-402d-b93b-e0ce56b917e3"}'
```

### Test 2: Insert Test Attempt
```bash
curl -X POST 'https://talvssmwnsfotoutjlhd.supabase.co/rest/v1/rpc/insert_simple_test_attempt' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_user_id": "48d26d2e-79f5-402d-b93b-e0ce56b917e3",
    "p_exam_id": "ssc-cgl",
    "p_score": 0,
    "p_total_questions": 1,
    "p_correct_answers": 0,
    "p_time_taken": 5,
    "p_answers": [{"questionId":"q1","selectedOption":-1,"isCorrect":false}]
  }'
```

### Test 3: Direct Insert (should work now)
```bash
curl -X POST 'https://talvssmwnsfotoutjlhd.supabase.co/rest/v1/test_attempts' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "48d26d2e-79f5-402d-b93b-e0ce56b917e3",
    "exam_id": "ssc-cgl",
    "score": 0,
    "total_questions": 1,
    "correct_answers": 0,
    "time_taken": 5,
    "answers": [{"questionId":"q1","selectedOption":-1,"isCorrect":false}]
  }'
```

## Expected Results:

✅ **create_all_default_exam_stats**: Should return success and create 5 exam stats records
✅ **insert_simple_test_attempt**: Should return success with attempt_id
✅ **Direct insert**: Should work without test_id constraint error

All functions are now available and the constraints have been fixed! 🎉
