# Statistics Logic Implementation

## 📊 Updated Statistics Computation

### Main Statistics (Mock + PYQ Only)
The main statistics now only consider **Mock Tests** and **Previous Year Questions (PYQ)**:

- **Tests Taken**: Sum of Mock and PYQ tests attempted by the user
- **Average Score**: Average score of Mock and PYQ tests attempted by the user  
- **Best Score**: Maximum score obtained from Mock and PYQ tests attempted by the user
- **Rank**: Overall rank based on Mock and PYQ performance
- **Percentile**: Calculated based on Mock and PYQ performance

### Individual Test Scores & Ranks
Each Mock and PYQ test set now displays:

- **Score**: User's score percentage for that specific test
- **Rank**: User's rank among all participants who took that test
- **Total Participants**: Number of users who have attempted that test

## 🗄️ Database Schema

### New Tables Added

#### `individual_test_scores`
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to user_profiles)
- exam_id: VARCHAR(50)
- test_type: VARCHAR(20) ('mock' or 'pyq')
- test_id: VARCHAR(100) (specific test identifier)
- score: INTEGER (user's score percentage)
- rank: INTEGER (user's rank for this test)
- total_participants: INTEGER (total users who took this test)
- completed_at: TIMESTAMP
```

#### `test_completions`
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to user_profiles)
- exam_id: VARCHAR(50)
- test_type: VARCHAR(20) ('mock', 'pyq', or 'practice')
- test_id: VARCHAR(100)
- topic_id: VARCHAR(100) (for practice tests)
- total_questions: INTEGER
- correct_answers: INTEGER
- time_taken: INTEGER (seconds)
- completed_at: TIMESTAMP
- answers: JSONB (detailed answers)
```

#### `user_streaks`
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to user_profiles)
- current_streak: INTEGER
- longest_streak: INTEGER
- last_activity_date: DATE
- total_tests_taken: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 🔧 Database Functions

### `update_exam_stats_mock_pyq_only(exam_name)`
- Updates exam statistics considering only Mock and PYQ tests
- Calculates total tests, average score, and best score
- Recalculates overall ranks

### `calculate_test_rank(user_uuid, exam_name, test_type, test_name)`
- Calculates user's rank for a specific test
- Updates the rank in individual_test_scores table
- Returns the calculated rank

### `get_user_test_score(user_uuid, exam_name, test_type, test_name)`
- Returns user's score, rank, and total participants for a specific test
- Used for displaying individual test performance

### `is_test_completed(user_uuid, exam_name, test_type, test_name, topic_name)`
- Checks if user has completed a specific test
- Used for showing completion indicators

### `update_user_streak(user_uuid)`
- Updates user's daily streak based on test completions
- Handles streak calculation and maintenance

## 🎯 UI Implementation

### Statistics Display
- **Header**: "Performance Statistics - Based on Mock Tests and Previous Year Questions (PYQ) only"
- **Cards**: Each stat card shows "(Mock + PYQ)" to clarify scope
- **Real-time Updates**: Statistics update immediately after test completion

### Individual Test Cards
For Mock and PYQ tests, each test card shows:
```
[Test Name] ✓ (if completed)
[Test Info]
┌─────────────────────────────────┐
│ Score: 85%  Rank: #12          │
│ of 150 participants             │
└─────────────────────────────────┘
[Retry available] (if completed)
```

### Practice Tests
- Practice tests do NOT show individual scores/ranks
- Practice tests do NOT count toward main statistics
- Practice tests still show completion indicators

## 🔄 Data Flow

### Test Completion Flow
1. User completes a test (Mock/PYQ/Practice)
2. Test completion recorded in `test_completions`
3. User streak updated via `update_user_streak()`
4. If Mock or PYQ:
   - Individual score recorded in `individual_test_scores`
   - Test rank calculated via `calculate_test_rank()`
   - Exam stats updated via `update_exam_stats_mock_pyq_only()`
5. UI refreshes to show updated statistics and individual scores

### Statistics Calculation
- **Main Stats**: Only Mock + PYQ tests
- **Individual Scores**: Only Mock + PYQ tests
- **Practice Tests**: Tracked separately, not included in main stats
- **Streaks**: Based on any test completion (Mock, PYQ, or Practice)

## 📱 User Experience

### Clear Visual Distinction
- Main statistics clearly labeled as "Mock + PYQ only"
- Individual test scores prominently displayed for Mock/PYQ
- Practice tests show completion status but no scores/ranks
- Retry functionality available for all completed tests

### Motivation Features
- Daily streak tracking encourages regular practice
- Individual test rankings provide competitive element
- Clear progress indicators show completion status
- Best score tracking shows improvement over time

## 🚀 Benefits

1. **Focused Competition**: Main stats focus on high-stakes tests (Mock/PYQ)
2. **Individual Feedback**: Users see their performance on each test
3. **Fair Comparison**: Rankings based on same test types
4. **Practice Freedom**: Practice tests don't affect main rankings
5. **Motivation**: Streaks and individual scores encourage engagement
6. **Transparency**: Clear labeling of what counts toward main stats

This implementation provides a comprehensive and fair assessment system that motivates users while maintaining clear distinctions between different types of tests.
