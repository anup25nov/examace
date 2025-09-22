# Database Analysis - Step 2: test_attempts Table

## Table Overview
**Purpose**: Tracks individual test attempts - when users start and complete tests.

## Schema Analysis

### Current Schema (from TypeScript types):
```typescript
test_attempts: {
  Row: {
    answers: Json | null
    completed_at: string | null
    correct_answers: number
    exam_id: string
    id: string
    score: number
    test_id: string
    test_type: string
    time_taken: number | null
    total_questions: number
    user_id: string
  }
}
```

### Actual Schema (from migrations):
```sql
-- Original schema
CREATE TABLE test_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL,
  test_id VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  answers JSONB
);

-- Added later via migrations:
-- status VARCHAR(50) NOT NULL DEFAULT 'completed'
-- created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

## Column Usage Analysis

| Column | Type | Used in Code | Purpose | Issues Found |
|--------|------|--------------|---------|--------------|
| `id` | UUID | ✅ | Primary key | - |
| `user_id` | UUID | ✅ | Foreign key to user | - |
| `exam_id` | VARCHAR(50) | ✅ | Which exam | - |
| `test_type` | VARCHAR(20) | ✅ | Type of test (mock/pyq/practice) | - |
| `test_id` | VARCHAR(100) | ✅ | Specific test identifier | - |
| `score` | INTEGER | ✅ | Test score | - |
| `total_questions` | INTEGER | ✅ | Total questions in test | - |
| `correct_answers` | INTEGER | ✅ | Number of correct answers | - |
| `time_taken` | INTEGER | ✅ | Time taken in seconds | - |
| `started_at` | TIMESTAMP | ✅ | When test started | - |
| `completed_at` | TIMESTAMP | ✅ | When test completed | - |
| `answers` | JSONB | ✅ | User's answers | - |
| `status` | VARCHAR(50) | ✅ | Test status | **Schema Mismatch** |
| `created_at` | TIMESTAMP | ❌ | Record creation time | **Schema Mismatch** |
| `updated_at` | TIMESTAMP | ❌ | Last update time | **Schema Mismatch** |

## Code Usage Analysis

### ✅ **Used Columns**:
1. **`id`** - Primary key, used for updates
2. **`user_id`** - Filtering user's attempts
3. **`exam_id`** - Filtering by exam
4. **`test_type`** - Filtering by test type
5. **`test_id`** - Specific test identification
6. **`score`** - Test results
7. **`total_questions`** - Test metadata
8. **`correct_answers`** - Test results
9. **`time_taken`** - Performance tracking
10. **`started_at`** - Test timing
11. **`completed_at`** - Test completion
12. **`answers`** - User responses
13. **`status`** - Test state tracking

### ❌ **Unused Columns**:
1. **`created_at`** - Never referenced in code
2. **`updated_at`** - Never referenced in code

## Data Flow Analysis

### Insert Operations:
- **Test start**: `planLimitsService.recordTestAttempt()` - Creates initial attempt
- **Test completion**: `comprehensiveStatsService.submitTestAttempt()` - Updates existing attempt

### Update Operations:
- **Test completion**: Updates score, answers, completed_at, status
- **Retry handling**: Updates status to 'in_progress'

### Read Operations:
- **Statistics**: `comprehensiveStatsService.getComprehensiveStats()`
- **Plan limits**: `planLimitsService` checks for existing attempts
- **Test history**: Various services read attempt history

## Issues Found

### 1. **Schema Mismatch** 🚨
- **Problem**: TypeScript types don't include `status`, `created_at`, `updated_at` columns
- **Impact**: Type errors, missing functionality
- **Evidence**: Code uses `status` column but types don't include it

### 2. **Duplicate Data Creation** 🚨 (FIXED)
- **Problem**: Multiple services creating test attempts
- **Impact**: Duplicate records for same test
- **Status**: ✅ Fixed in comprehensiveStatsService

### 3. **Unused Columns** ⚠️
- **Problem**: `created_at` and `updated_at` are never used
- **Impact**: Unnecessary storage, confusion

### 4. **Missing Indexes** ⚠️
- **Problem**: No composite indexes for common queries
- **Impact**: Slow queries on large datasets

### 5. **Data Consistency Issues** 🚨
- **Problem**: `status` column has inconsistent values
- **Evidence**: Code expects 'in_progress' but default is 'completed'
- **Impact**: Logic errors in test flow

## Data Patterns Analysis

### Expected Flow:
1. **Test Start**: Insert with `status='in_progress'`, `score=0`, `completed_at=null`
2. **Test Completion**: Update with actual `score`, `completed_at`, `status='completed'`

### Actual Flow (After Fixes):
1. **Test Start**: `planLimitsService` creates attempt with `status='in_progress'`
2. **Test Completion**: `comprehensiveStatsService` updates existing attempt

## Recommendations

### Immediate Fixes:
1. **Update TypeScript types** to include all columns
2. **Remove unused columns** (`created_at`, `updated_at`)
3. **Add proper indexes** for performance
4. **Standardize status values**

### Schema Updates Needed:
```sql
-- Update TypeScript types to match actual schema
-- Add missing columns to types:
-- status: string
-- created_at: string | null  
-- updated_at: string | null

-- Remove unused columns
ALTER TABLE test_attempts DROP COLUMN created_at;
ALTER TABLE test_attempts DROP COLUMN updated_at;

-- Add performance indexes
CREATE INDEX idx_test_attempts_user_exam ON test_attempts(user_id, exam_id);
CREATE INDEX idx_test_attempts_user_type ON test_attempts(user_id, test_type);
CREATE INDEX idx_test_attempts_status ON test_attempts(status);
```

### Code Fixes Needed:
1. **Update TypeScript types** in `types.ts`
2. **Remove references** to `created_at` and `updated_at`
3. **Standardize status values** across all services

## Performance Analysis

### Current Indexes:
- `idx_test_attempts_user_id` - Good
- `idx_test_attempts_status` - Good  
- `idx_test_attempts_created_at` - Unused column
- `idx_test_attempts_user_status` - Good

### Missing Indexes:
- `(user_id, exam_id)` - For exam-specific queries
- `(user_id, test_type)` - For test type filtering
- `(user_id, completed_at)` - For recent attempts

## Next Steps
1. **Update TypeScript types** to match actual schema
2. **Remove unused columns** from database
3. **Add missing indexes** for performance
4. **Analyze test_completions table** next
5. **Check for data inconsistencies** in existing records
