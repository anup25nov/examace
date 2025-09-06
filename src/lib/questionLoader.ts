import { QuestionConfig } from '@/config/examConfig';

// Question loader utility for dynamic question loading
export class QuestionLoader {
  private static cache = new Map<string, QuestionConfig[]>();

  static async loadQuestions(
    examId: string, 
    testType: 'pyq' | 'practice' | 'mock', 
    testId: string
  ): Promise<QuestionConfig[]> {
    const cacheKey = `${examId}-${testType}-${testId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
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
      }

      // Import the JSON file dynamically
      const questionsModule = await import(/* @vite-ignore */ filePath);
      const questions: QuestionConfig[] = questionsModule.default || questionsModule;
      
      // Cache the result
      this.cache.set(cacheKey, questions);
      
      return questions;
    } catch (error) {
      console.error(`Failed to load questions for ${cacheKey}:`, error);
      return [];
    }
  }

  static async loadAllQuestionsForExam(examId: string): Promise<{
    pyq: { [testId: string]: QuestionConfig[] };
    practice: { [testId: string]: QuestionConfig[] };
    mock: { [testId: string]: QuestionConfig[] };
  }> {
    const result = {
      pyq: {} as { [testId: string]: QuestionConfig[] },
      practice: {} as { [testId: string]: QuestionConfig[] },
      mock: {} as { [testId: string]: QuestionConfig[] }
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
        result.pyq[testId] = await this.loadQuestions(examId, 'pyq', testId);
      } catch (error) {
        console.error(`Failed to load PYQ ${testId} for ${examId}:`, error);
        result.pyq[testId] = [];
      }
    }

    // Load Practice questions
    for (const testId of examConfig.practice) {
      try {
        result.practice[testId] = await this.loadQuestions(examId, 'practice', testId);
      } catch (error) {
        console.error(`Failed to load Practice ${testId} for ${examId}:`, error);
        result.practice[testId] = [];
      }
    }

    // Load Mock questions
    for (const testId of examConfig.mock) {
      try {
        result.mock[testId] = await this.loadQuestions(examId, 'mock', testId);
      } catch (error) {
        console.error(`Failed to load Mock ${testId} for ${examId}:`, error);
        result.mock[testId] = [];
      }
    }

    return result;
  }

  static clearCache() {
    this.cache.clear();
  }

  static getCacheSize() {
    return this.cache.size;
  }
}
