import { QuestionConfig } from '@/config/examConfig';

// Static imports for all test files to ensure they work in production
import mockTest1 from '@/data/questions/ssc-cgl/mock/mock-test-1.json';
import mockTest2 from '@/data/questions/ssc-cgl/mock/mock-test-2.json';
import pyq2024Day1Shift1 from '@/data/questions/ssc-cgl/pyq/2024-day1-shift1.json';
import pyq2024Day1Shift2 from '@/data/questions/ssc-cgl/pyq/2024-day1-shift2.json';
import pyq2024Day1Shift3 from '@/data/questions/ssc-cgl/pyq/2024-day1-shift3.json';
import practiceMathsAlgebra from '@/data/questions/ssc-cgl/practice/maths-algebra.json';
import practiceEnglishGrammar from '@/data/questions/ssc-cgl/practice/english-grammar.json';

// Static mapping of test files for reliable loading in production
const testFileMap: { [key: string]: TestData } = {
  'ssc-cgl-mock-mock-test-1': mockTest1 as unknown as TestData,
  'ssc-cgl-mock-mock-test-2': mockTest2 as unknown as TestData,
  'ssc-cgl-pyq-2024-day1-shift1': pyq2024Day1Shift1 as unknown as TestData,
  'ssc-cgl-pyq-2024-day1-shift2': pyq2024Day1Shift2 as unknown as TestData,
  'ssc-cgl-pyq-2024-day1-shift3': pyq2024Day1Shift3 as unknown as TestData,
  'ssc-cgl-practice-maths-algebra': practiceMathsAlgebra as unknown as TestData,
  'ssc-cgl-practice-english-grammar': practiceEnglishGrammar as unknown as TestData,
  // Add more test files as needed
};

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
      
      // First, try to get from static mapping (more reliable in production)
      const staticKey = `${examId}-${testType}-${testId}`;
      if (testFileMap[staticKey]) {
        console.log(`Using static mapping for ${staticKey}`);
        const testData = testFileMap[staticKey];
        this.cache.set(cacheKey, testData);
        return testData;
      }
      
      // Fallback to dynamic import for files not in static mapping
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

      // Import the JSON file dynamically with better error handling
      let testModule;
      try {
        // Try different import strategies for better compatibility
        testModule = await import(/* @vite-ignore */ filePath);
      } catch (importError) {
        console.warn(`Failed to import ${filePath}, trying alternative approach:`, importError);
        // Fallback: try without @vite-ignore
        try {
          testModule = await import(/* @vite-ignore */ filePath);
        } catch (fallbackError) {
          console.error(`Both import attempts failed for ${filePath}:`, fallbackError);
          throw new Error(`Cannot load test file: ${filePath}`);
        }
      }
      
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
        mock: ['mock-test-1', 'mock-test-2', 'mock-test-3', 'mock-test-4']
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

  // Get available tests for an exam using static configuration
  static async getAvailableTests(examId: string): Promise<{
    mock: Array<{ id: string; name: string; description: string }>;
    pyq: Array<{ id: string; name: string; description: string }>;
    practice: Array<{ id: string; name: string; description: string }>;
  }> {
    const tests = {
      mock: [] as Array<{ id: string; name: string; description: string }>,
      pyq: [] as Array<{ id: string; name: string; description: string }>,
      practice: [] as Array<{ id: string; name: string; description: string }>
    };

    try {
      // Static configuration for available tests - this is more reliable than dynamic discovery
      const testConfigs = {
        'ssc-cgl': {
          pyq: ['2024-day1-shift1', '2024-day1-shift2', '2024-day1-shift3'],
          practice: ['maths-algebra', 'english-grammar'],
          mock: ['mock-test-1', 'mock-test-2'] // Only include existing files
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
        console.warn(`No test configuration found for exam: ${examId}`);
        return tests;
      }

      // Load tests for each type
      const testTypes = ['mock', 'pyq', 'practice'] as const;
      
      for (const testType of testTypes) {
        const testIds = examConfig[testType];
        
        for (const testId of testIds) {
          try {
            const testData = await this.loadQuestions(examId, testType, testId);
            if (testData) {
              tests[testType].push({
                id: testId,
                name: testData.examInfo.testName,
                description: `${testData.examInfo.totalQuestions} questions • ${Math.round(this.calculateTotalDuration(testData.questions))} minutes • ${this.calculateTotalMarks(testData.questions)} marks`
              });
            }
          } catch (error) {
            console.warn(`Failed to load ${testType} test ${testId} for ${examId}:`, error);
          }
        }
      }
      
      return tests;
    } catch (error) {
      console.error('Error getting available tests:', error);
      return tests;
    }
  }

  // Discover test files by trying common patterns
  private static async discoverTestFiles(examId: string, testType: string): Promise<string[]> {
    const discoveredFiles: string[] = [];
    
    // Comprehensive patterns for different test types
    const patterns = {
      mock: this.generateMockTestPatterns(),
      pyq: this.generatePYQTestPatterns(),
      practice: this.generatePracticeTestPatterns()
    };

    const testPatterns = patterns[testType as keyof typeof patterns] || [];
    
    for (const pattern of testPatterns) {
      try {
        // Try to load the file to see if it exists
        const testData = await this.loadQuestions(examId, testType as 'pyq' | 'practice' | 'mock', pattern);
        if (testData) {
          discoveredFiles.push(pattern);
        }
      } catch (error) {
        // File doesn't exist, continue to next pattern
        continue;
      }
    }
    
    return discoveredFiles;
  }

  // Generate mock test patterns (mock-test-1, mock-test-2, etc.)
  private static generateMockTestPatterns(): string[] {
    const patterns: string[] = [];
    for (let i = 1; i <= 4; i++) { // Only support existing mock tests 1-4
      patterns.push(`mock-test-${i}`);
    }
    return patterns;
  }

  // Generate PYQ test patterns for different years and shifts
  private static generatePYQTestPatterns(): string[] {
    const patterns: string[] = [];
    const years = ['2024', '2023', '2022', '2021', '2020'];
    const days = ['day1', 'day2', 'day3'];
    const shifts = ['shift1', 'shift2', 'shift3'];
    
    for (const year of years) {
      for (const day of days) {
        for (const shift of shifts) {
          patterns.push(`${year}-${day}-${shift}`);
        }
      }
    }
    return patterns;
  }

  // Generate practice test patterns for different subjects and topics
  private static generatePracticeTestPatterns(): string[] {
    const patterns: string[] = [];
    const subjects = ['maths', 'english', 'general-knowledge', 'reasoning', 'science'];
    const topics = {
      'maths': ['algebra', 'geometry', 'arithmetic', 'trigonometry', 'statistics'],
      'english': ['grammar', 'vocabulary', 'comprehension', 'literature'],
      'general-knowledge': ['history', 'geography', 'politics', 'economics', 'science'],
      'reasoning': ['logical', 'analytical', 'verbal', 'non-verbal'],
      'science': ['physics', 'chemistry', 'biology']
    };
    
    for (const subject of subjects) {
      const subjectTopics = topics[subject as keyof typeof topics] || [];
      for (const topic of subjectTopics) {
        patterns.push(`${subject}-${topic}`);
      }
    }
    return patterns;
  }
}
