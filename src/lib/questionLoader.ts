import { QuestionConfig } from '@/config/examConfig';

export interface ExamInfo {
  examId: string;
  examName: string;
  testType: string;
  testId: string;
  testName: string;
  totalQuestions: number;
  languages: string[];
  defaultLanguage: string;
}

export interface QuestionWithProps extends QuestionConfig {
  marks: number;
  negativeMarks: number;
  duration: number;
  topic: string; // Make topic required
}

export interface TestData {
  examInfo: ExamInfo;
  questions: QuestionWithProps[];
}

// Question loader utility for dynamic question loading
export class QuestionLoader {
  private static cache = new Map<string, TestData>();

  static async loadQuestions(
    examId: string, 
    testType: 'pyq' | 'practice' | 'mock', 
    testId: string
  ): Promise<TestData | null> {
    const cacheKey = `${examId}-${testType}-${testId}`;
    
    console.log('loadQuestions called with:', { examId, testType, testId, cacheKey });
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`Using cached test data for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    try {
      // Validate parameters
      if (!examId || !testType || !testId) {
        throw new Error(`Missing required parameters: examId=${examId}, testType=${testType}, testId=${testId}`);
      }
      
      // Construct the file path based on exam, test type, and test ID
      let filePath = '';
      
      if (testType === 'pyq') {
        // For PYQ: examId/pyq/year-day-shift.json
        filePath = `/src/data/questions/${examId}/pyq/${testId}.json`;
      } else if (testType === 'practice') {
        // For Practice: examId/practice/subject-topic.json
        filePath = `/src/data/questions/${examId}/practice/${testId}.json`;
      } else if (testType === 'mock') {
        // For Mock: examId/mock/mock-test-N.json
        filePath = `/src/data/questions/${examId}/mock/${testId}.json`;
      } else {
        throw new Error(`Invalid test type: ${testType}`);
      }

      console.log(`Loading test data from: ${filePath}`);

      // Import the JSON file dynamically
      const testModule = await import(/* @vite-ignore */ filePath);
      const testData: TestData = testModule.default || testModule;
      
      console.log(`Successfully loaded test data:`, testData);
      
      // Cache the result
      this.cache.set(cacheKey, testData);
      
      return testData;
    } catch (error) {
      console.error(`Failed to load test data for ${cacheKey}:`, error);
      return null;
    }
  }

  static async loadAllQuestionsForExam(examId: string): Promise<{
    pyq: { [testId: string]: TestData };
    practice: { [testId: string]: TestData };
    mock: { [testId: string]: TestData };
  }> {
    const result = {
      pyq: {} as { [testId: string]: TestData },
      practice: {} as { [testId: string]: TestData },
      mock: {} as { [testId: string]: TestData }
    };

    // Define test IDs for each exam and test type
    const testConfigs = {
      'ssc-cgl': {
        pyq: ['2024-day1-shift1', '2024-day1-shift2'],
        practice: ['maths-algebra'],
        mock: ['mock-test-1']
      },
      'ssc-mts': {
        pyq: ['2024-day1-shift1'],
        practice: ['maths-algebra'],
        mock: ['mock-test-1']
      },
      'railway': {
        pyq: ['2024-day1-shift1'],
        practice: ['maths-algebra'],
        mock: ['mock-test-1']
      },
      'bank-po': {
        pyq: ['2024-day1-shift1'],
        practice: ['maths-algebra'],
        mock: ['mock-test-1']
      },
      'airforce': {
        pyq: ['2024-day1-shift1'],
        practice: ['maths-algebra'],
        mock: ['mock-test-1']
      }
    };

    const examConfig = testConfigs[examId as keyof typeof testConfigs];
    if (!examConfig) {
      return result;
    }

    // Load PYQ questions
    for (const testId of examConfig.pyq) {
      try {
        const testData = await this.loadQuestions(examId, 'pyq', testId);
        if (testData) {
          result.pyq[testId] = testData;
        }
      } catch (error) {
        console.error(`Failed to load PYQ ${testId} for ${examId}:`, error);
      }
    }

    // Load Practice questions
    for (const testId of examConfig.practice) {
      try {
        const testData = await this.loadQuestions(examId, 'practice', testId);
        if (testData) {
          result.practice[testId] = testData;
        }
      } catch (error) {
        console.error(`Failed to load Practice ${testId} for ${examId}:`, error);
      }
    }

    // Load Mock questions
    for (const testId of examConfig.mock) {
      try {
        const testData = await this.loadQuestions(examId, 'mock', testId);
        if (testData) {
          result.mock[testId] = testData;
        }
      } catch (error) {
        console.error(`Failed to load Mock ${testId} for ${examId}:`, error);
      }
    }

    return result;
  }

  // Utility functions for dynamic calculations
  static calculateTotalDuration(questions: QuestionWithProps[]): number {
    return questions.reduce((total, question) => total + question.duration, 0);
  }

  static calculateTotalMarks(questions: QuestionWithProps[]): number {
    return questions.reduce((total, question) => total + question.marks, 0);
  }

  static calculateMaxNegativeMarks(questions: QuestionWithProps[]): number {
    return questions.reduce((total, question) => total + question.negativeMarks, 0);
  }

  static getLanguageOptions(testData: TestData): string[] {
    return testData.examInfo.languages;
  }

  static getDefaultLanguage(testData: TestData): string {
    return testData.examInfo.defaultLanguage;
  }

  static clearCache() {
    this.cache.clear();
  }

  static getCacheSize() {
    return this.cache.size;
  }
}
