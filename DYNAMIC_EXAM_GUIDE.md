# Dynamic Exam System Guide

This guide explains how to add new exams and exam types to the application with minimal changes.

## 🎯 Overview

The dynamic exam system allows you to add new exams (like Air Force, Navy, Railway, etc.) and new exam types (MOCK, PYQ, Practice) without modifying the UI components. Everything is handled dynamically through configuration files.

## 📁 File Structure

```
src/
├── lib/
│   ├── dynamicExamService.ts          # Main exam configuration service
│   ├── dynamicTestDataLoader.ts       # Test data loading service
│   └── dynamicQuestionLoader.ts       # Question loading service
├── data/
│   └── questions/
│       └── {exam-id}/
│           ├── mock/
│           │   ├── index.json         # Mock test list
│           │   └── {test-id}.json     # Individual test questions
│           ├── pyq/
│           │   ├── index.json         # PYQ test list
│           │   └── {test-id}.json     # Individual test questions
│           └── practice/
│               ├── index.json         # Practice test list
│               └── {test-id}.json     # Individual test questions
```

## 🚀 Adding a New Exam

### Step 1: Add Exam Configuration

Edit `src/lib/dynamicExamService.ts` and add your exam configuration:

```typescript
// Add to the initializeDefaultConfigs() method
this.examConfigs.set('your-exam-id', {
  id: 'your-exam-id',
  name: 'Your Exam',
  fullName: 'Your Full Exam Name',
  shortName: 'YE',
  description: 'Description of your exam',
  icon: 'YourIcon', // Lucide icon name
  color: 'blue', // Tailwind color
  gradient: 'from-blue-500 to-blue-600',
  logo: '/logos/your-exam-logo.svg',
  bannerImage: '/logos/your-exam-banner.png',
  stats: { enrolled: '1M+', tests: '100+', questions: '2000+' },
  sections: [
    {
      id: 'pyq',
      name: 'Previous Year Questions',
      displayName: 'PYQ',
      icon: 'FileText',
      color: 'warning',
      enabled: true,
      order: 1,
      config: {
        years: ['2024', '2023', '2022'],
        defaultYear: '2024'
      }
    },
    {
      id: 'mock',
      name: 'Full Mock Tests',
      displayName: 'Mock Tests',
      icon: 'Trophy',
      color: 'success',
      enabled: true,
      order: 2,
      config: {
        freeCount: 2,
        premiumCount: 3
      }
    },
    {
      id: 'practice',
      name: 'Practice Sets',
      displayName: 'Practice',
      icon: 'BookOpen',
      color: 'primary',
      enabled: true,
      order: 3,
      config: {
        subjects: ['Subject 1', 'Subject 2', 'Subject 3'],
        comingSoon: false
      }
    }
  ],
  isActive: true,
  isPremium: false,
  examPattern: {
    totalQuestions: 100,
    duration: 120, // in minutes
    subjects: ['Subject 1', 'Subject 2', 'Subject 3'],
    markingScheme: { correct: 2, incorrect: -0.5, unattempted: 0 }
  },
  metadata: {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: '1.0.0'
  }
});
```

### Step 2: Create Data Files

Create the following directory structure and files:

#### Mock Tests
Create `src/data/questions/{exam-id}/mock/index.json`:

```json
{
  "tests": [
    {
      "id": "mock-test-1",
      "name": "Mock Test 1",
      "description": "Complete mock test description",
      "duration": 120,
      "questions": 100,
      "subjects": ["Subject 1", "Subject 2", "Subject 3"],
      "difficulty": "mixed",
      "isPremium": false,
      "price": 0,
      "order": 1,
      "metadata": {
        "created_at": "2024-01-15T00:00:00Z",
        "updated_at": "2024-01-15T00:00:00Z"
      }
    }
  ]
}
```

Create `src/data/questions/{exam-id}/mock/mock-test-1.json`:

```json
{
  "questions": [
    {
      "id": "q1",
      "questionEn": "Your question in English",
      "questionHi": "आपका प्रश्न हिंदी में",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct": 1,
      "difficulty": "easy",
      "subject": "subject-1",
      "topic": "topic-1",
      "marks": 2,
      "negativeMarks": 0.5,
      "duration": 60,
      "explanation": "Explanation of the answer",
      "questionImage": "path/to/question-image.png",
      "explanationImage": "path/to/explanation-image.png"
    }
  ]
}
```

#### PYQ Tests
Create `src/data/questions/{exam-id}/pyq/index.json`:

```json
{
  "tests": [
    {
      "id": "2024-set-1",
      "name": "PYQ 2024 Set 1",
      "description": "Previous Year Questions 2024 Set 1",
      "duration": 120,
      "questions": 100,
      "subjects": ["Subject 1", "Subject 2", "Subject 3"],
      "difficulty": "mixed",
      "isPremium": false,
      "price": 0,
      "order": 1,
      "metadata": {
        "year": "2024",
        "created_at": "2024-01-15T00:00:00Z",
        "updated_at": "2024-01-15T00:00:00Z"
      }
    }
  ]
}
```

Create `src/data/questions/{exam-id}/pyq/2024-set-1.json` with the same question format as above.

#### Practice Tests
Create `src/data/questions/{exam-id}/practice/index.json`:

```json
{
  "tests": [
    {
      "id": "subject-1-topic-1",
      "name": "Practice Set 1",
      "description": "Practice questions for Subject 1 Topic 1",
      "duration": 60,
      "questions": 50,
      "subjects": ["Subject 1"],
      "difficulty": "easy",
      "isPremium": false,
      "price": 0,
      "order": 1,
      "metadata": {
        "subject": "subject-1",
        "topic": "topic-1",
        "created_at": "2024-01-15T00:00:00Z",
        "updated_at": "2024-01-15T00:00:00Z"
      }
    }
  ]
}
```

Create `src/data/questions/{exam-id}/practice/subject-1-topic-1.json` with the same question format as above.

## 🔧 Configuration Options

### Exam Configuration

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique exam identifier |
| `name` | string | Short exam name |
| `fullName` | string | Full exam name |
| `shortName` | string | Abbreviation |
| `description` | string | Exam description |
| `icon` | string | Lucide icon name |
| `color` | string | Tailwind color name |
| `gradient` | string | Tailwind gradient classes |
| `logo` | string | Path to logo image |
| `bannerImage` | string | Path to banner image |
| `stats` | object | Enrollment and test statistics |
| `sections` | array | Available test sections |
| `isActive` | boolean | Whether exam is active |
| `isPremium` | boolean | Whether exam requires premium |
| `examPattern` | object | Exam pattern configuration |

### Section Configuration

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Section identifier (mock, pyq, practice) |
| `name` | string | Section name |
| `displayName` | string | Short display name |
| `icon` | string | Lucide icon name |
| `color` | string | Tailwind color name |
| `enabled` | boolean | Whether section is enabled |
| `order` | number | Display order |
| `config` | object | Section-specific configuration |

### Test Configuration

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique test identifier |
| `name` | string | Test name |
| `description` | string | Test description |
| `duration` | number | Duration in minutes |
| `questions` | number | Number of questions |
| `subjects` | array | Subject names |
| `difficulty` | string | Difficulty level (easy, medium, hard, mixed) |
| `isPremium` | boolean | Whether test is premium |
| `price` | number | Price in rupees |
| `order` | number | Display order |
| `metadata` | object | Additional metadata |

### Question Configuration

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique question identifier |
| `questionEn` | string | Question in English |
| `questionHi` | string | Question in Hindi |
| `options` | array | Answer options |
| `correct` | number | Index of correct option (0-based) |
| `difficulty` | string | Difficulty level (easy, medium, hard) |
| `subject` | string | Subject identifier |
| `topic` | string | Topic identifier |
| `marks` | number | Marks for correct answer |
| `negativeMarks` | number | Negative marks for incorrect answer |
| `duration` | number | Time per question in seconds |
| `explanation` | string | Answer explanation |
| `questionImage` | string | Path to question image |
| `explanationImage` | string | Path to explanation image |

## 🎨 UI Customization

The system automatically handles:
- ✅ Exam selection and navigation
- ✅ Test listing and filtering
- ✅ Question display and navigation
- ✅ Timer and progress tracking
- ✅ Score calculation and submission
- ✅ Solutions display
- ✅ Rank and statistics

## 📊 Marking Scheme

Configure marking scheme in the exam pattern:

```typescript
examPattern: {
  totalQuestions: 100,
  duration: 120,
  subjects: ['Subject 1', 'Subject 2'],
  markingScheme: { 
    correct: 2,      // +2 marks for correct answer
    incorrect: -0.5, // -0.5 marks for incorrect answer
    unattempted: 0   // 0 marks for unattempted
  }
}
```

## 🔄 Adding New Exam Types

To add a new exam type (e.g., "Quick Tests"):

1. Add the section configuration to your exam
2. Create the data directory: `src/data/questions/{exam-id}/quick-tests/`
3. Create `index.json` and individual test files
4. The UI will automatically render the new section

## 🚀 Benefits

- **Minimal Code Changes**: Add new exams by just adding configuration and data files
- **Consistent UI**: All exams use the same UI components
- **Easy Maintenance**: Centralized configuration management
- **Scalable**: Add unlimited exams and test types
- **Type Safe**: Full TypeScript support
- **Cached**: Automatic caching for better performance

## 📝 Example: Adding Air Force Exam

1. Add configuration to `dynamicExamService.ts`
2. Create data files in `src/data/questions/airforce/`
3. Add logo to `public/logos/airforce-logo.svg`
4. The exam will automatically appear in the exam selection

That's it! No UI changes required. 🎉
