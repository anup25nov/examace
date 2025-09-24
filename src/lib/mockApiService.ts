// Mock API Service for Development
// This service simulates the secure API endpoints for development

export interface MockApiResponse {
  examInfo: {
    testName: string;
    duration: number;
    totalQuestions: number;
    subjects: string[];
    markingScheme: {
      correct: number;
      incorrect: number;
      unattempted: number;
    };
    defaultLanguage: string;
  };
  questions: any[];
  _security: {
    obfuscated: boolean;
    timestamp: number;
    expires: number;
  };
}

export class MockApiService {
  private static instance: MockApiService;
  private cache: Map<string, MockApiResponse> = new Map();

  private constructor() {}

  static getInstance(): MockApiService {
    if (!MockApiService.instance) {
      MockApiService.instance = new MockApiService();
    }
    return MockApiService.instance;
  }

  // Mock secure questions API
  async getSecureQuestions(
    examId: string,
    sectionId: string,
    testId: string,
    timestamp: number
  ): Promise<MockApiResponse | null> {
    const cacheKey = `${examId}-${sectionId}-${testId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      // Check if cache is still valid (5 minutes)
      if (Date.now() - cached._security.timestamp < 300000) {
        return cached;
      }
    }

    try {
      // Validate timestamp to prevent replay attacks
      if (!timestamp || Date.now() - timestamp > 300000) { // 5 minutes
        throw new Error('Invalid or expired request');
      }

      // Load questions from JSON file using dynamic import to avoid direct exposure
      let jsonData;
      try {
        // Use dynamic import to load the JSON data
        const jsonModule = await import(`@/data/questions/${examId}/${sectionId}/${testId}.json`);
        jsonData = jsonModule.default || jsonModule;
      } catch (importError) {
        console.error(`Failed to import JSON file: ${examId}/${sectionId}/${testId}.json`, importError);
        return null;
      }
      
      // Obfuscate questions to prevent direct access to answers
      const obfuscatedQuestions = (jsonData.questions || []).map((question: any, index: number) => {
        // Create obfuscated question data
        const obfuscatedQuestion = {
          id: question.id,
          questionEn: question.questionEn,
          questionHi: question.questionHi,
          options: question.options || [],
          // Don't include correct answer in the response
          difficulty: question.difficulty || 'medium',
          subject: question.subject || 'general',
          topic: question.topic || 'general',
          marks: question.marks || 1,
          negativeMarks: question.negativeMarks || 0.25,
          duration: question.duration || 60,
          hasImages: question.hasImages || false,
          questionImage: question.questionImage,
          optionImages: question.optionImages,
          explanationImage: question.explanationImage
        };
        
        // Add obfuscation layer
        return {
          ...obfuscatedQuestion,
          _obfuscated: true,
          _timestamp: Date.now(),
          _index: index
        };
      });

      // Return obfuscated data without correct answers
      const obfuscatedData: MockApiResponse = {
        examInfo: {
          testName: `${examId} ${sectionId} ${testId}`,
          duration: jsonData.duration || 180,
          totalQuestions: jsonData.totalQuestions || obfuscatedQuestions.length,
          subjects: jsonData.subjects || ['General Knowledge'],
          markingScheme: {
            correct: 1,
            incorrect: 0.25,
            unattempted: 0
          },
          defaultLanguage: 'english'
        },
        questions: obfuscatedQuestions,
        _security: {
          obfuscated: true,
          timestamp: Date.now(),
          expires: Date.now() + 300000 // 5 minutes
        }
      };

      // Cache the result
      this.cache.set(cacheKey, obfuscatedData);
      return obfuscatedData;
      
    } catch (error) {
      console.error('Error in mock API service:', error);
      return null;
    }
  }

  // Mock answer validation API
  async validateAnswers(
    examId: string,
    sectionId: string,
    testId: string,
    userAnswers: { [key: number]: number },
    questionIds: string[],
    timestamp: number
  ): Promise<{
    correctAnswers: number;
    incorrectAnswers: number;
    score: number;
    totalMarks: number;
    obtainedMarks: number;
    _security: {
      validated: boolean;
      timestamp: number;
      expires: number;
    };
  } | null> {
    try {
      // Validate timestamp to prevent replay attacks
      if (!timestamp || Date.now() - timestamp > 300000) { // 5 minutes
        throw new Error('Invalid or expired request');
      }

      // Load correct answers from JSON file using dynamic import
      let jsonData;
      try {
        // Use dynamic import to load the JSON data
        const jsonModule = await import(`@/data/questions/${examId}/${sectionId}/${testId}.json`);
        jsonData = jsonModule.default || jsonModule;
      } catch (importError) {
        console.error(`Failed to import JSON file: ${examId}/${sectionId}/${testId}.json`, importError);
        return null;
      }
      const questions = jsonData.questions || [];

      // Validate answers
      let correctAnswers = 0;
      let incorrectAnswers = 0;
      let totalMarks = 0;
      let obtainedMarks = 0;

      questions.forEach((question: any, index: number) => {
        const questionMarks = question.marks || 1;
        const negativeMarks = question.negativeMarks || 0.25;
        totalMarks += questionMarks;

        if (userAnswers[index] !== undefined) {
          if (userAnswers[index] === question.correct) {
            correctAnswers++;
            obtainedMarks += questionMarks;
          } else {
            incorrectAnswers++;
            obtainedMarks -= negativeMarks;
          }
        }
      });

      const score = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

      return {
        correctAnswers,
        incorrectAnswers,
        score: Math.max(0, score), // Ensure score is not negative
        totalMarks,
        obtainedMarks: Math.max(0, obtainedMarks), // Ensure obtained marks is not negative
        _security: {
          validated: true,
          timestamp: Date.now(),
          expires: Date.now() + 300000 // 5 minutes
        }
      };
      
    } catch (error) {
      console.error('Error in mock validation service:', error);
      return null;
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const mockApiService = MockApiService.getInstance();
