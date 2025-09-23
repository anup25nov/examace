// Secure Dynamic Question Loader - Handles all question loading with security
import { dynamicExamService, QuestionData } from './dynamicExamService';
import { secureQuestionService, SecureQuestionData, SecureTestData } from './secureQuestionService';

export interface QuestionWithProps extends QuestionData {
  marks: number;
  negativeMarks: number;
  duration: number;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TestData {
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
  questions: QuestionWithProps[];
}

export class SecureDynamicQuestionLoader {
  private static instance: SecureDynamicQuestionLoader;
  private cache: Map<string, TestData> = new Map();
  private securityEnabled: boolean = true;

  private constructor() {}

  static getInstance(): SecureDynamicQuestionLoader {
    if (!SecureDynamicQuestionLoader.instance) {
      SecureDynamicQuestionLoader.instance = new SecureDynamicQuestionLoader();
    }
    return SecureDynamicQuestionLoader.instance;
  }

  // Enable/disable security (for development)
  setSecurityEnabled(enabled: boolean): void {
    this.securityEnabled = enabled;
  }

  // Load questions for a test with security
  async loadQuestions(
    examId: string, 
    sectionId: string, 
    testId: string, 
    topicId?: string,
    userId?: string,
    isPremium?: boolean
  ): Promise<TestData | null> {
    const cacheKey = `${examId}-${sectionId}-${testId}-${topicId || ''}-${userId || 'anonymous'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // If security is enabled and we have user info, use secure service
      if (this.securityEnabled && userId) {
        const secureData = await secureQuestionService.loadQuestions(
          examId, 
          sectionId, 
          testId, 
          userId, 
          isPremium || false
        );
        
        if (secureData) {
          // Convert secure data to our format
          const testData: TestData = {
            examInfo: secureData.examInfo,
            questions: secureData.questions.map(q => ({
              id: q.id,
              questionEn: q.questionEn,
              questionHi: q.questionHi,
              options: q.options,
              correct: q.correct,
              difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
              subject: q.subject,
              topic: q.topic,
              marks: q.marks,
              negativeMarks: q.negativeMarks,
              duration: q.duration,
              explanation: q.explanation,
              questionImage: q.questionImage,
              optionsImages: q.optionsImages,
              explanationImage: q.explanationImage
            }))
          };
          
          this.cache.set(cacheKey, testData);
          return testData;
        }
      }

      // Fallback to insecure method for development
      console.warn('⚠️ SECURITY WARNING: Loading questions without authentication. This should only happen in development.');
      return await this.loadQuestionsInsecure(examId, sectionId, testId, topicId);

    } catch (error) {
      console.error('Error loading secure questions:', error);
      return null;
    }
  }

  // Insecure fallback method (for development only)
  private async loadQuestionsInsecure(
    examId: string, 
    sectionId: string, 
    testId: string, 
    topicId?: string
  ): Promise<TestData | null> {
    try {
      // Get exam configuration
      const exam = dynamicExamService.getExamConfig(examId);
      if (!exam) {
        console.error('Exam not found:', examId);
        return null;
      }

      // Get questions
      const questions = await dynamicExamService.getQuestionData(examId, sectionId, testId);
      if (!questions || questions.length === 0) {
        console.error('No questions found for test:', { examId, sectionId, testId, topicId });
        return null;
      }

      // Convert to QuestionWithProps format
      const questionsWithProps: QuestionWithProps[] = questions.map(q => ({
        ...q,
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks || 0,
        duration: q.duration || 60,
        subject: q.subject || 'general',
        topic: q.topic || 'general',
        difficulty: q.difficulty || 'medium'
      }));

      // Get test duration from exam pattern or calculate from questions
      const testDuration = this.calculateTestDuration(questionsWithProps, exam.examPattern.duration);

      // Create test data
      const testData: TestData = {
        examInfo: {
          testName: this.getTestName(examId, sectionId, testId),
          duration: testDuration,
          totalQuestions: questionsWithProps.length,
          subjects: exam.examPattern.subjects,
          markingScheme: exam.examPattern.markingScheme,
          defaultLanguage: 'english'
        },
        questions: questionsWithProps
      };

      this.cache.set(`${examId}-${sectionId}-${testId}-${topicId || ''}-insecure`, testData);
      return testData;
    } catch (error) {
      console.error('Error loading questions (insecure fallback):', error);
      return null;
    }
  }

  // Calculate total duration from questions
  private calculateTestDuration(questions: QuestionWithProps[], defaultDuration: number): number {
    if (questions.length === 0) return defaultDuration;
    
    const totalSeconds = questions.reduce((total, q) => total + (q.duration || 60), 0);
    const totalMinutes = Math.ceil(totalSeconds / 60);
    
    // Use the larger of calculated duration or default duration
    return Math.max(totalMinutes, defaultDuration);
  }

  // Get test name
  private getTestName(examId: string, sectionId: string, testId: string): string {
    const exam = dynamicExamService.getExamConfig(examId);
    if (!exam) return testId;

    const section = exam.sections.find(s => s.id === sectionId);
    if (!section) return testId;

    // Format test name based on section type
    switch (sectionId) {
      case 'mock':
        return `Mock Test ${testId.split('-').pop()}`;
      case 'pyq':
        return `PYQ ${testId}`;
      case 'practice':
        return `Practice Set ${testId}`;
      default:
        return testId;
    }
  }

  // Get questions for a specific test (legacy compatibility)
  static async getQuestionsForTest(
    examId: string, 
    sectionId: string, 
    testId: string, 
    topicId?: string,
    userId?: string,
    isPremium?: boolean
  ): Promise<QuestionWithProps[]> {
    const loader = SecureDynamicQuestionLoader.getInstance();
    const testData = await loader.loadQuestions(examId, sectionId, testId, topicId, userId, isPremium);
    return testData?.questions || [];
  }

  // Get test duration (legacy compatibility)
  static async getTestDuration(
    examId: string, 
    sectionId: string, 
    testId: string, 
    topicId?: string,
    userId?: string,
    isPremium?: boolean
  ): Promise<number> {
    const loader = SecureDynamicQuestionLoader.getInstance();
    const testData = await loader.loadQuestions(examId, sectionId, testId, topicId, userId, isPremium);
    return testData?.examInfo.duration || 60;
  }

  // Calculate total duration from questions (legacy compatibility)
  static calculateTotalDuration(questions: QuestionWithProps[]): number {
    if (!questions || questions.length === 0) return 60;
    
    const totalSeconds = questions.reduce((total, q) => total + (q.duration || 60), 0);
    return Math.ceil(totalSeconds / 60);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear specific cache
  clearExamCache(examId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(examId)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear user-specific cache
  clearUserCache(userId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const secureDynamicQuestionLoader = SecureDynamicQuestionLoader.getInstance();

// Legacy exports for compatibility
export const SecureQuestionLoader = {
  loadQuestions: SecureDynamicQuestionLoader.getQuestionsForTest,
  getQuestionsForTest: SecureDynamicQuestionLoader.getQuestionsForTest,
  getTestDuration: SecureDynamicQuestionLoader.getTestDuration,
  calculateTotalDuration: SecureDynamicQuestionLoader.calculateTotalDuration
};
