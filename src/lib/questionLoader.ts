import { QuestionConfig } from '@/config/examConfig';
import { testDataLoader } from './testDataLoader';

// Convert our new data structure to the expected TestData format
const convertToTestData = (test: any, examId: string, testType: string, testId: string): TestData => {
  return {
    examInfo: {
      examId,
      examName: test.name || 'Test',
      testType,
      testId,
      testName: test.name || 'Test',
      totalQuestions: test.questions || 0,
      languages: ['en', 'hi'],
      defaultLanguage: 'en'
    },
    questions: (test.questionData || []).map((q: any, index: number) => ({
      id: q.id || `q${index + 1}`,
      questionEn: q.questionEn || '',
      questionHi: q.questionHi || '',
      options: q.options || [],
      correct: q.correct || 0,
      difficulty: q.difficulty || 'medium',
      subject: q.subject || 'general',
      topic: q.topic || 'general',
      marks: 1,
      negativeMarks: 0.25,
      duration: 60
    }))
  };
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
      
      // Use our new testDataLoader to get the test data
      const examData = testDataLoader.getExamTestData(examId);
      if (!examData) {
        throw new Error(`No data found for exam: ${examId}`);
      }

      let test: any = null;

      if (testType === 'mock') {
        // Look in both free and premium mock tests
        const allMockTests = [...examData.mock.free, ...examData.mock.premium];
        test = allMockTests.find(t => t.id === testId);
      } else if (testType === 'pyq') {
        // Look in PYQ data by year
        for (const year in examData.pyq) {
          const yearData = examData.pyq[year];
          test = yearData.find((t: any) => t.id === testId);
          if (test) break;
        }
      } else if (testType === 'practice') {
        // Look in practice data
        for (const subject in examData.practice) {
          const subjectData = examData.practice[subject];
          if (subjectData.topics) {
            for (const topic in subjectData.topics) {
              const topicData = subjectData.topics[topic];
              if (topicData.sets) {
                test = topicData.sets.find((t: any) => t.id === testId);
                if (test) break;
              }
            }
          }
          if (test) break;
        }
      }

      if (!test) {
        throw new Error(`Test not found: ${testId} in ${testType} for ${examId}`);
      }

      // Convert to TestData format
      const testData = convertToTestData(test, examId, testType, testId);
      this.cache.set(cacheKey, testData);
      console.log(`Successfully loaded test data for ${cacheKey}`);
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

    try {
      const examData = testDataLoader.getExamTestData(examId);
      if (!examData) {
        return result;
      }

      // Load Mock tests
      const allMockTests = [...examData.mock.free, ...examData.mock.premium];
      for (const test of allMockTests) {
        const testData = convertToTestData(test, examId, 'mock', test.id);
        result.mock[test.id] = testData;
      }

      // Load PYQ tests
      for (const year in examData.pyq) {
        const yearData = examData.pyq[year];
        for (const test of yearData) {
          const testData = convertToTestData(test, examId, 'pyq', test.id);
          result.pyq[test.id] = testData;
        }
      }

      // Load Practice tests
      for (const subject in examData.practice) {
        const subjectData = examData.practice[subject];
        if (subjectData.topics) {
          for (const topic in subjectData.topics) {
            const topicData = subjectData.topics[topic];
            if (topicData.sets) {
              for (const test of topicData.sets) {
                const testData = convertToTestData(test, examId, 'practice', test.id);
                result.practice[test.id] = testData;
              }
            }
          }
        }
      }

    } catch (error) {
      console.error(`Failed to load all questions for ${examId}:`, error);
    }

    return result;
  }

  /**
   * Clear cache (for testing or data refresh)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size for debugging
   */
  static getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Calculate total duration for a set of questions
   */
  static calculateTotalDuration(questions: QuestionWithProps[]): number {
    if (!questions || questions.length === 0) {
      return 0;
    }
    
    // Sum up all question durations (in seconds) and convert to minutes
    const totalSeconds = questions.reduce((total, question) => {
      return total + (question.duration || 60); // Default 60 seconds per question
    }, 0);
    
    // Convert to minutes and round to nearest integer
    return Math.round(totalSeconds / 60);
  }
}