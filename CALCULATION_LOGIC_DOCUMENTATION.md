# ExamAce - Complete Calculation Logic Documentation

## Overview
This document provides a comprehensive overview of all calculation logic used throughout the ExamAce application, including score calculations, statistics, rankings, and performance metrics.

---

## 1. Test Score Calculations

### 1.1 Individual Test Score Calculation
**Location**: `src/lib/supabaseStats.ts` - `submitindividualtestscore` function
**Database Function**: `submitindividualtestscore`

```sql
-- Parameters: p_user_id, p_exam_id, p_test_type, p_test_id, p_score
-- Returns: JSONB with score, rank, total_participants

INSERT INTO individual_test_scores (user_id, exam_id, test_type, test_id, score, rank, total_participants)
VALUES (p_user_id, p_exam_id, p_test_type, p_test_id, p_score, v_rank, v_total_participants)
ON CONFLICT (user_id, exam_id, test_type, test_id) 
DO UPDATE SET
  score = EXCLUDED.score,
  rank = EXCLUDED.rank,
  total_participants = EXCLUDED.total_participants,
  completed_at = now();
```

**How it works**:
- Stores individual test scores with rank and total participants
- Uses conflict resolution to update existing scores
- Rank is calculated as 1 (placeholder - can be enhanced with actual ranking logic)
- Total participants is set to 1 (placeholder - can be enhanced with actual count)

### 1.2 Test Completion Score Calculation
**Location**: `src/pages/TestInterface.tsx` - `submitIndividualTestScore` function

```typescript
const submitIndividualTestScore = async (examId: string, testType: string, testId: string, score: number) => {
  const { data, error } = await supabaseStatsService.submitIndividualTestScore(
    examId, testType, testId, score
  );
  
  if (error) {
    console.error('Error submitting test score:', error);
    return;
  }
  
  console.log('Test score submitted successfully:', data);
};
```

**How it works**:
- Calls the Supabase RPC function to store test scores
- Handles errors and logs success/failure
- Updates the database with the user's test performance

---

## 2. Exam Statistics Calculations

### 2.1 Overall Exam Statistics
**Location**: `supabase/migrations/20250103000002_fix_rpc_functions.sql` - `update_exam_stats_properly` function

```sql
CREATE OR REPLACE FUNCTION public.update_exam_stats_properly(
  user_uuid UUID,
  exam_name TEXT,
  new_score INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score)
  VALUES (user_uuid, exam_name, 1, new_score, new_score)
  ON CONFLICT (user_id, exam_id) 
  DO UPDATE SET
    total_tests = exam_stats.total_tests + 1,
    best_score = GREATEST(exam_stats.best_score, new_score),
    average_score = (exam_stats.average_score * exam_stats.total_tests + new_score) / (exam_stats.total_tests + 1),
    last_test_date = now(),
    updated_at = now();
END;
$$;
```

**How it works**:
- **Total Tests**: Increments by 1 for each new test attempt
- **Best Score**: Uses `GREATEST()` function to keep the highest score
- **Average Score**: Calculates running average using the formula:
  ```
  new_average = (old_average × old_count + new_score) / (old_count + 1)
  ```
- **Last Test Date**: Updates to current timestamp

### 2.2 Performance Statistics Display
**Location**: `src/pages/ExamDashboard.tsx` - `userStats` calculation

```typescript
// Calculate best rank from individual test scores
let bestRank = 0;
testScores.forEach((scoreData) => {
  if (scoreData.rank > 0 && (bestRank === 0 || scoreData.rank < bestRank)) {
    bestRank = scoreData.rank;
  }
});

setUserStats({
  totalTests: currentExamStats.totalTests,
  avgScore: currentExamStats.averageScore,
  bestScore: currentExamStats.bestScore,
  bestRank: bestRank,
  lastActive: currentExamStats.lastTestDate
});
```

**How it works**:
- **Total Tests**: Retrieved from `exam_stats.total_tests`
- **Average Score**: Retrieved from `exam_stats.average_score`
- **Best Score**: Retrieved from `exam_stats.best_score`
- **Best Rank**: Calculated by iterating through all test scores and finding the lowest (best) rank
- **Last Active**: Retrieved from `exam_stats.last_test_date`

---

## 3. Progress Bar Calculations

### 3.1 Performance Statistics Progress Bars
**Location**: `src/pages/ExamDashboard.tsx` - Performance Statistics cards

```typescript
// Tests Taken Progress Bar
style={{ width: `${Math.min((userStats.totalTests / 20) * 100, 100)}%` }}

// Average Score Progress Bar
style={{ width: `${Math.min((userStats.avgScore / 100) * 100, 100)}%` }}

// Best Score Progress Bar
style={{ width: `${Math.min((userStats.bestScore / 100) * 100, 100)}%` }}

// Best Rank Progress Bar
style={{ width: `${Math.min((100 - userStats.bestRank) * 2, 100)}%` }}
```

**How it works**:
- **Tests Taken**: Progress based on 20 tests as maximum (5% per test)
- **Average Score**: Progress based on 100 as maximum score (1% per point)
- **Best Score**: Progress based on 100 as maximum score (1% per point)
- **Best Rank**: Progress based on rank improvement (lower rank = higher progress)
  - Formula: `(100 - rank) * 2` with maximum of 100%
  - Rank 1 = 198% → capped at 100%
  - Rank 50 = 100%
  - Rank 100 = 0%

---

## 4. Test Results Calculations

### 4.1 Marks Breakdown Calculation
**Location**: `src/components/SolutionsDisplay.tsx` - `marksBreakdown` calculation

```typescript
const marksBreakdown = {
  totalQuestions: totalQuestions,
  attemptedQuestions: userAnswers ? Object.keys(userAnswers).length : 0,
  correctQuestions: correctCount,
  incorrectQuestions: incorrectCount,
  skippedQuestions: totalQuestions - (userAnswers ? Object.keys(userAnswers).length : 0),
  obtainedMarks: correctCount * 2, // Assuming 2 marks per correct answer
  negativeMarks: incorrectCount * 0.5, // Assuming 0.5 negative marks per incorrect answer
  netMarks: (correctCount * 2) - (incorrectCount * 0.5),
  totalMarks: totalQuestions * 2 // Assuming 2 marks per question
};
```

**How it works**:
- **Total Questions**: From test data
- **Attempted Questions**: Count of answered questions
- **Correct Questions**: Count of correctly answered questions
- **Incorrect Questions**: Count of incorrectly answered questions
- **Skipped Questions**: Total - Attempted
- **Obtained Marks**: Correct answers × 2 marks per question
- **Negative Marks**: Incorrect answers × 0.5 negative marks per question
- **Net Marks**: Obtained marks - Negative marks
- **Total Marks**: Total questions × 2 marks per question

### 4.2 Score Percentage Calculation
**Location**: `src/components/SolutionsDisplay.tsx` - Score calculation

```typescript
const score = marksBreakdown.totalMarks > 0 
  ? Math.round((marksBreakdown.netMarks / marksBreakdown.totalMarks) * 100)
  : 0;
```

**How it works**:
- **Score**: (Net Marks / Total Marks) × 100
- **Rounded**: Using `Math.round()` for whole numbers
- **Fallback**: Returns 0 if total marks is 0

---

## 5. Time Calculations

### 5.1 Test Duration Formatting
**Location**: `src/components/SolutionsDisplay.tsx` - `formatTime` function

```typescript
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};
```

**How it works**:
- **Hours**: `Math.floor(seconds / 3600)`
- **Minutes**: `Math.floor((seconds % 3600) / 60)`
- **Seconds**: `seconds % 60`
- **Format**: Shows appropriate units based on duration

### 5.2 Test Timer Calculation
**Location**: `src/pages/TestInterface.tsx` - Timer logic

```typescript
const [timeLeft, setTimeLeft] = useState(testData.examInfo.duration * 60); // Convert minutes to seconds

useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        handleSubmit();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

**How it works**:
- **Initial Time**: Duration in minutes × 60 (converted to seconds)
- **Countdown**: Decrements by 1 every second
- **Auto Submit**: When time reaches 0, automatically submits the test

---

## 6. Streak Calculations

### 6.1 Daily Streak Update
**Location**: `MINIMAL_STREAK_FIX.sql` - `get_or_create_user_streak` function

```sql
CREATE OR REPLACE FUNCTION public.get_or_create_user_streak(
  user_uuid UUID
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  current_streak INTEGER,
  longest_streak INTEGER,
  total_tests_taken INTEGER,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert if not exists
  INSERT INTO user_streaks (
    user_id, current_streak, longest_streak, total_tests_taken, last_activity_date, created_at, updated_at
  )
  VALUES (
    user_uuid, 0, 0, 0, NULL, now(), now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Return the streak data
  RETURN QUERY
  SELECT 
    us.id,
    us.user_id,
    us.current_streak,
    us.longest_streak,
    us.total_tests_taken,
    us.last_activity_date,
    us.created_at,
    us.updated_at
  FROM user_streaks us
  WHERE us.user_id = user_uuid;
END;
$$;
```

**How it works**:
- **Current Streak**: Number of consecutive days with activity
- **Longest Streak**: Highest streak achieved
- **Total Tests**: Count of all tests taken
- **Last Activity**: Date of last test attempt
- **Auto Creation**: Creates streak record if user doesn't have one

---

## 7. Accuracy Calculations

### 7.1 Test Accuracy Calculation
**Location**: `src/components/SolutionsDisplay.tsx` - Accuracy display

```typescript
<p className="text-xs text-muted-foreground">
  {marksBreakdown.attemptedQuestions > 0 
    ? Math.round((marksBreakdown.correctQuestions / marksBreakdown.attemptedQuestions) * 100) 
    : 0}% correct
</p>
```

**How it works**:
- **Accuracy**: (Correct Questions / Attempted Questions) × 100
- **Rounded**: Using `Math.round()` for whole numbers
- **Fallback**: Returns 0% if no questions attempted

---

## 8. Ranking Calculations

### 8.1 Individual Test Ranking
**Location**: `src/lib/supabaseStats.ts` - `getIndividualTestScore` function

```typescript
const getIndividualTestScore = async (examId: string, testType: string, testId: string) => {
  const { data, error } = await supabase
    .from('individual_test_scores')
    .select('*')
    .eq('exam_id', examId)
    .eq('test_type', testType)
    .eq('test_id', testId)
    .single();

  return { data, error };
};
```

**How it works**:
- **Rank**: Retrieved from `individual_test_scores.rank`
- **Total Participants**: Retrieved from `individual_test_scores.total_participants`
- **Score**: Retrieved from `individual_test_scores.score`
- **Highest Marks**: Retrieved from `individual_test_scores.highest_marks` (if available)

---

## 9. Summary of All Calculations

### 9.1 Score Calculations
- **Individual Test Score**: Raw score from test completion
- **Net Score**: Obtained marks - Negative marks
- **Percentage Score**: (Net Marks / Total Marks) × 100
- **Average Score**: Running average of all test scores
- **Best Score**: Highest score achieved across all tests

### 9.2 Statistics Calculations
- **Total Tests**: Count of all completed tests
- **Best Rank**: Lowest (best) rank achieved across all tests
- **Accuracy**: (Correct / Attempted) × 100
- **Progress Bars**: Based on predefined maximums and current values

### 9.3 Time Calculations
- **Test Duration**: Minutes × 60 = seconds
- **Time Formatting**: Hours, minutes, seconds display
- **Timer Countdown**: Decrements by 1 second

### 9.4 Streak Calculations
- **Current Streak**: Consecutive days with activity
- **Longest Streak**: Highest streak achieved
- **Total Tests**: Count of all tests taken

### 9.5 Ranking Calculations
- **Individual Rank**: Rank for specific test
- **Total Participants**: Number of people who attempted the test
- **Best Rank**: Best rank across all tests

---

## 10. Configuration Values

### 10.1 Scoring System
- **Marks per Question**: 2 marks
- **Negative Marks**: 0.5 marks per incorrect answer
- **Maximum Score**: 100% (can be adjusted based on total marks)

### 10.2 Progress Bar Maximums
- **Tests Taken**: 20 tests (5% per test)
- **Score Progress**: 100 points (1% per point)
- **Rank Progress**: Based on rank improvement formula

### 10.3 Test Durations
- **Mock Tests**: 180 minutes (3 hours)
- **PYQ Tests**: 30 minutes (varies by test)
- **Practice Tests**: 30 minutes (varies by test)

---

## 11. Database Schema Impact

### 11.1 Tables Used for Calculations
- **`exam_stats`**: Overall exam statistics
- **`individual_test_scores`**: Individual test performance
- **`user_streaks`**: Daily streak tracking
- **`test_completions`**: Test completion tracking

### 11.2 Key Fields
- **`total_tests`**: Count of completed tests
- **`average_score`**: Running average score
- **`best_score`**: Highest score achieved
- **`rank`**: Current rank for specific test
- **`current_streak`**: Current daily streak

---

This documentation provides a complete overview of all calculation logic used in the ExamAce application. All calculations are designed to be accurate, efficient, and provide meaningful insights to users about their exam preparation progress.
