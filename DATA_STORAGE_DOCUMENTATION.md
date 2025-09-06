# 📊 Data Storage Documentation

## Overview
This application uses a hybrid data storage approach with **Firebase** for authentication and **Supabase** for all other data storage. Both development and production environments use the same database tables for consistency.

## 🔥 Firebase Storage

### Collections
1. **`users`** - User authentication data
   - `id`: User ID (Firebase UID)
   - `phone`: Phone number (without +91 prefix)
   - `createdAt`: Timestamp
   - `updatedAt`: Timestamp

2. **`users_by_phone`** - Phone number lookup
   - `userId`: Reference to user ID
   - `phone`: Phone number (without +91 prefix)
   - `pin`: 6-digit PIN (encrypted)
   - `updatedAt`: Timestamp

3. **`test_attempts`** - Test attempt records
   - `userId`: User ID
   - `examId`: Exam identifier
   - `score`: Score achieved
   - `totalQuestions`: Total questions in test
   - `correctAnswers`: Number of correct answers
   - `timeTaken`: Time taken in seconds
   - `completedAt`: Completion timestamp
   - `answers`: User's answers (JSONB)

4. **`exam_stats`** - User exam statistics
   - `userId`: User ID
   - `examId`: Exam identifier
   - `totalTests`: Total tests taken
   - `bestScore`: Best score achieved
   - `averageScore`: Average score
   - `lastTestDate`: Last test date
   - `createdAt`: Creation timestamp
   - `updatedAt`: Last update timestamp

## 🐘 Supabase Storage

### Tables

#### 1. **`user_profiles`**
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  phone VARCHAR(10) UNIQUE NOT NULL,
  pin VARCHAR(6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Purpose**: User profile information
- **Data**: Phone number, PIN, timestamps
- **RLS**: Users can only access their own profile

#### 2. **`exam_stats`**
```sql
CREATE TABLE exam_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  total_tests INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  average_score INTEGER DEFAULT 0,
  rank INTEGER,
  last_test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id)
);
```
- **Purpose**: User statistics for each exam
- **Data**: Tests taken, scores, ranks
- **RLS**: Users can only access their own stats

#### 3. **`test_attempts`**
```sql
CREATE TABLE test_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answers JSONB
);
```
- **Purpose**: Individual test attempt records
- **Data**: Scores, answers, timing
- **RLS**: Users can only access their own attempts

#### 4. **`test_completions`**
```sql
CREATE TABLE test_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL,
  test_id VARCHAR(100) NOT NULL,
  topic_id VARCHAR(100),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answers JSONB,
  UNIQUE(user_id, exam_id, test_type, test_id, topic_id)
);
```
- **Purpose**: Track completion of specific tests
- **Data**: Test completion status, scores
- **RLS**: Users can only access their own completions

#### 5. **`user_streaks`**
```sql
CREATE TABLE user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_tests_taken INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```
- **Purpose**: Track user daily streaks
- **Data**: Current streak, longest streak, activity dates
- **RLS**: Users can only access their own streaks

#### 6. **`individual_test_scores`**
```sql
CREATE TABLE individual_test_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL,
  test_id VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER,
  total_participants INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id, test_type, test_id)
);
```
- **Purpose**: Individual test scores and ranks
- **Data**: Scores, ranks, participant counts
- **RLS**: Users can only access their own scores

### Functions

#### 1. **`calculate_exam_ranks(exam_name)`**
- **Purpose**: Calculate ranks for all users in an exam
- **Usage**: Called after test completion
- **Returns**: Updates rank column in exam_stats

#### 2. **`update_user_streak(user_uuid)`**
- **Purpose**: Update user's daily streak
- **Usage**: Called after test completion
- **Returns**: Updates streak data

#### 3. **`is_test_completed(user_uuid, exam_name, test_type, test_name, topic_name)`**
- **Purpose**: Check if a specific test is completed
- **Usage**: UI to show completion status
- **Returns**: Boolean

#### 4. **`calculate_test_rank(user_uuid, exam_name, test_type, test_name)`**
- **Purpose**: Calculate rank for a specific test
- **Usage**: Called after test completion
- **Returns**: User's rank in that test

#### 5. **`get_user_test_score(user_uuid, exam_name, test_type, test_name)`**
- **Purpose**: Get user's score and rank for a specific test
- **Usage**: Display individual test results
- **Returns**: Score, rank, total participants

#### 6. **`update_exam_stats_mock_pyq_only(exam_name)`**
- **Purpose**: Update exam stats based only on Mock and PYQ tests
- **Usage**: Called after Mock/PYQ test completion
- **Returns**: Updates exam_stats table

## 🔐 Row Level Security (RLS)

All Supabase tables have RLS enabled with policies ensuring:
- Users can only view their own data
- Users can only insert/update their own data
- No cross-user data access

## 📱 Data Flow

### Authentication Flow
1. **Phone Input** → Firebase OTP
2. **OTP Verification** → Firebase Auth
3. **PIN Setup/Login** → Firebase Firestore + Supabase
4. **User Profile** → Stored in both Firebase and Supabase

### Test Flow
1. **Test Start** → Load questions from local files
2. **Test Completion** → Store in Supabase
3. **Statistics Update** → Update exam_stats, streaks, ranks
4. **UI Update** → Show completion status, scores, ranks

## 🚀 Environment Configuration

### Development & Production
- **Same Database**: Both environments use identical Supabase tables
- **Same Firebase**: Both environments use same Firebase project
- **No Mock Data**: All authentication is real Firebase OTP/PIN
- **Consistent Data**: Dev data persists in same tables as production

### Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

## 📊 Data Consistency

### Firebase ↔ Supabase Sync
- User creation in Firebase automatically creates Supabase profile
- PIN updates sync between both systems
- Authentication state managed by Firebase
- All test data stored in Supabase

### Data Integrity
- Foreign key constraints ensure data consistency
- RLS policies prevent data leakage
- Unique constraints prevent duplicate entries
- Timestamps track all data changes

## 🔧 Maintenance

### Regular Tasks
1. **Rank Calculation**: Run `calculate_exam_ranks()` for each exam
2. **Streak Updates**: Automatically handled by `update_user_streak()`
3. **Statistics Updates**: Automatically handled by `update_exam_stats_mock_pyq_only()`

### Monitoring
- Check Supabase logs for RLS violations
- Monitor Firebase authentication logs
- Track data consistency between Firebase and Supabase
- Monitor performance of rank calculation functions

## 🎯 Key Benefits

1. **Unified Data**: Dev and production use same tables
2. **Real Authentication**: No mock data, real Firebase OTP/PIN
3. **Data Security**: RLS ensures user data isolation
4. **Performance**: Optimized queries and indexes
5. **Scalability**: Both Firebase and Supabase scale automatically
6. **Consistency**: Data integrity maintained across systems
