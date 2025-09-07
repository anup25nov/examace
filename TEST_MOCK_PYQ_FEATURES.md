# Test Mock/PYQ Features

## Instructions for Testing

### Step 1: Run Database Fix
1. Open your Supabase SQL Editor
2. Run the `COMPREHENSIVE_DATABASE_FIX.sql` file
3. Verify all functions are created successfully

### Step 2: Test Mock/PYQ Features

#### Test 1: is_already_attempted (Green Tick)
1. Navigate to any exam dashboard (e.g., SSC CGL)
2. Look for Mock Tests or PYQ sections
3. **Expected**: No green tick for uncompleted tests
4. Complete a Mock or PYQ test
5. Return to dashboard
6. **Expected**: Green tick (✓) appears with "Completed" status

#### Test 2: Score Display
1. After completing a Mock or PYQ test
2. Return to dashboard
3. **Expected**: Score displayed prominently in blue gradient box
4. **Expected**: Format: "85%" (large, bold, blue text)

#### Test 3: Rank Display
1. After completing a Mock or PYQ test
2. Return to dashboard
3. **Expected**: Rank displayed in purple gradient box
4. **Expected**: Format: "#3" (large, bold, purple text)
5. **Expected**: "out of X participants" text below

#### Test 4: View Solutions
1. On a completed Mock or PYQ test
2. Click "📖 View Solutions" button
3. **Expected**: Navigate to solutions page
4. **Expected**: Shows all questions with correct answers
5. **Expected**: Shows user's answers and explanations

#### Test 5: Retry Functionality
1. On a completed Mock or PYQ test
2. Click "🔄 Retry" button
3. **Expected**: Navigate to test interface
4. **Expected**: Test starts fresh (no previous answers)
5. Complete the test again
6. **Expected**: New score and rank calculated
7. **Expected**: Previous completion status cleared

#### Test 6: Performance Statistics
1. Complete multiple Mock and PYQ tests
2. Check Performance Statistics section
3. **Expected**: "Tests Taken" shows only Mock + PYQ count
4. **Expected**: "Average Score" shows Mock + PYQ average
5. **Expected**: "Best Score" shows Mock + PYQ best
6. **Expected**: Practice tests should NOT be counted

### Step 3: UI Enhancement Verification

#### Card Design
1. **Expected**: Each Mock/PYQ set in individual card
2. **Expected**: Green border/background for completed tests
3. **Expected**: Clean, modern card design
4. **Expected**: Proper spacing and layout

#### Button Layout
1. **Expected**: "▶️ Start Test" for new tests
2. **Expected**: "📖 View Solutions" and "🔄 Retry" for completed tests
3. **Expected**: Buttons properly sized and positioned

### Step 4: Database Verification

#### Check Database Tables
1. `test_completions` - Should have entries for completed tests
2. `individual_test_scores` - Should have scores and ranks
3. `exam_stats` - Should have Mock + PYQ only statistics

#### Check Functions
1. `is_test_completed` - Should return correct boolean
2. `get_user_test_score` - Should return score, rank, participants
3. `submitindividualtestscore` - Should update scores and ranks
4. `update_exam_stats_properly` - Should calculate Mock + PYQ stats

## Expected Results

### ✅ All Features Working:
- Green tick for completed tests
- Score display (percentage)
- Rank display (out of participants)
- View Solutions functionality
- Retry functionality with updates
- Performance Statistics from API only
- Enhanced UI cards

### ❌ Common Issues to Check:
- Database function errors (ambiguous column references)
- Duplicate key constraint violations
- Performance stats including practice tests
- Missing green ticks or scores
- Broken view solutions or retry

## Troubleshooting

### If Database Functions Fail:
1. Check Supabase logs for errors
2. Verify function permissions
3. Run the COMPREHENSIVE_DATABASE_FIX.sql again

### If UI Features Don't Work:
1. Check browser console for errors
2. Verify API calls are successful
3. Check localStorage for cached data
4. Clear browser cache and reload

### If Performance Stats Wrong:
1. Verify `update_exam_stats_properly` function
2. Check that only Mock + PYQ tests are counted
3. Verify API calls in Network tab
