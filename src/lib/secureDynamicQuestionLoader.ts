// Secure Dynamic Question Loader - Handles all question loading with security
import { secureExamService } from './secureExamService';
import { secureQuestionService, SecureQuestionData, SecureTestData } from './secureQuestionService';
import { premiumTestService } from './premiumTestService';
import { examDataService } from '@/data/examData';
import { dynamicExamService } from './dynamicExamService';
import { mockApiService } from './mockApiService';

export interface QuestionData {
  id: string;
  questionEn: string;
  questionHi?: string;
  options: Array<{en: string; hi?: string}> | string[];
  correctAnswerIndex: number;
  explanationEn?: string;
  explanationHi?: string;
  marks?: number;
  negativeMarks?: number;
  difficulty?: string;
  subject?: string;
  topic?: string;
  imageUrl?: string;
  hasImages?: boolean;
  questionImage?: {en: string; hi?: string};
  optionImages?: Array<{en: string; hi?: string}>;
  explanationImage?: {en: string; hi?: string};
}

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
      // Determine premium status dynamically if not provided
      let actualIsPremium = isPremium;
      if (actualIsPremium === undefined && userId) {
        const premiumInfo = await premiumTestService.checkPremiumAccess(examId, sectionId, testId, userId);
        actualIsPremium = premiumInfo.isPremium;
      }
      
      // If security is enabled and we have user info, use secure service
      if (this.securityEnabled && userId) {
        const secureData = await secureQuestionService.loadQuestions(
          examId, 
          sectionId, 
          testId, 
          userId, 
          actualIsPremium || false
        );
        
        if (secureData) {
          // Convert secure data to our format
          const testData: TestData = {
            examInfo: secureData.examInfo,
            questions: secureData.questions.map(q => ({
              id: q.id,
              questionEn: q.questionEn,
              questionHi: q.questionHi,
              options: q.options || [],
              correctAnswerIndex: q.correct || q.correctAnswerIndex || 0,
              difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
              subject: q.subject,
              topic: q.topic,
              marks: q.marks || 1,
              negativeMarks: q.negativeMarks || 0.25,
              duration: q.duration || 60,
              explanationEn: q.explanation || q.explanationEn,
              explanationHi: q.explanationHi,
              imageUrl: q.questionImage || q.imageUrl
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

  // Load questions from secure API endpoint (using mock service for development)
  private async loadQuestionsFromSecureAPI(
    examId: string, 
    sectionId: string, 
    testId: string
  ): Promise<{ questions: SecureQuestionData[]; duration: number; totalQuestions: number; subjects: string[]; } | null> {
    try {
      console.log(`🔒 Loading questions from secure API (mock): ${examId}/${sectionId}/${testId}`);
      
      // Use mock API service for development
      const apiData = await mockApiService.getSecureQuestions(examId, sectionId, testId, Date.now());
      
      if (!apiData) {
        console.error('Failed to load from mock API service');
        // Try fallback to JSON loading as last resort
        console.log('🔄 Falling back to JSON loading...');
        return await this.loadQuestionsFromJson(examId, sectionId, testId);
      }

      console.log(`✅ Loaded from mock API:`, apiData);
      
      if (!apiData || !apiData.questions || !Array.isArray(apiData.questions)) {
        console.error('Invalid data structure from mock API');
        return null;
      }

      return {
        questions: apiData.questions,
        duration: apiData.examInfo.duration || 180,
        totalQuestions: apiData.examInfo.totalQuestions || apiData.questions.length,
        subjects: apiData.examInfo.subjects || ['General Knowledge']
      };
      
    } catch (error) {
      console.error('Error loading questions from mock API:', error);
      return null;
    }
  }

  // Load questions directly from JSON files (development fallback) - DEPRECATED
  private async loadQuestionsFromJson(
    examId: string, 
    sectionId: string, 
    testId: string
  ): Promise<{ questions: SecureQuestionData[]; duration: number; totalQuestions: number; subjects: string[]; } | null> {
    try {
      console.log(`📁 Loading questions from JSON (secure import): ${examId}/${sectionId}/${testId}`);
      
      // Use dynamic import to avoid direct file exposure
      let jsonData;
      try {
        const jsonModule = await import(`@/data/questions/${examId}/${sectionId}/${testId}.json`);
        jsonData = jsonModule.default || jsonModule;
      } catch (importError) {
        console.error(`Failed to import JSON file: ${examId}/${sectionId}/${testId}.json`, importError);
        return null;
      }
      
      const questions = jsonData.questions || jsonData;
      
      if (!Array.isArray(questions) || questions.length === 0) {
        console.error('No questions found in JSON file');
        return null;
      }
      
      console.log(`✅ Loaded ${questions.length} questions from JSON`);
      console.log(`✅ JSON duration:`, jsonData.duration);
      console.log(`✅ JSON subjects:`, jsonData.subjects);
      
      // Return both questions and metadata
      return {
        questions,
        duration: jsonData.duration || 180,
        totalQuestions: jsonData.totalQuestions || questions.length,
        subjects: jsonData.subjects || ['General Knowledge']
      };
      
    } catch (error) {
      console.error('Error loading questions from JSON:', error);
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

      // Use secure API endpoint instead of direct JSON loading
      console.log(`🔍 Loading questions via secure API for: ${examId}/${sectionId}/${testId}`);
      const secureApiData = await this.loadQuestionsFromSecureAPI(examId, sectionId, testId);
      console.log(`🔍 Secure API returned:`, secureApiData ? `${secureApiData.questions?.length || 0} questions` : 'null/empty');
      
      if (secureApiData && secureApiData.questions && secureApiData.questions.length > 0) {
        // Create test data from secure API response
        const testDataFromAPI = this.createTestDataFromQuestionsWithMetadata(examId, sectionId, testId, secureApiData);
        console.log(`🔍 Created test data from secure API:`, testDataFromAPI);
        console.log(`🔍 Test duration:`, testDataFromAPI?.examInfo?.duration);
        return testDataFromAPI;
      } else {
        console.error('No questions found for test:', { examId, sectionId, testId, topicId });
        return null;
      }
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

  // Create test data from questions with metadata
  private createTestDataFromQuestionsWithMetadata(examId: string, sectionId: string, testId: string, jsonData: any): TestData {
    const exam = dynamicExamService.getExamConfig(examId);
    const testName = this.getTestName(examId, sectionId, testId);
    
    // Convert raw JSON questions to QuestionWithProps format
    const questionsWithProps: QuestionWithProps[] = jsonData.questions.map(q => ({
      id: q.id,
      questionEn: q.questionEn,
      questionHi: q.questionHi,
      options: q.options || [],
      correctAnswerIndex: q.correct || q.correctAnswerIndex || 0,
      explanationEn: q.explanationEn,
      explanationHi: q.explanationHi,
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0.25,
      duration: q.duration || 60,
      subject: q.subject || 'general',
      topic: q.topic || 'general',
      difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
      imageUrl: q.imageUrl,
      hasImages: q.hasImages,
      questionImage: q.questionImage,
      optionImages: q.optionImages,
      explanationImage: q.explanationImage
    }));
    
    // Use duration from JSON metadata
    const totalDuration = jsonData.duration || 180;
    
    // Get subjects from JSON metadata or questions
    const subjects = jsonData.subjects || [...new Set(questionsWithProps.map(q => q.subject).filter(Boolean))];
    
    // Get marking scheme from first question
    const firstQuestion = questionsWithProps[0];
    const markingScheme = {
      correct: firstQuestion?.marks || 1,
      incorrect: firstQuestion?.negativeMarks || 0.25,
      unattempted: 0
    };

    return {
      examInfo: {
        testName,
        duration: totalDuration,
        totalQuestions: jsonData.totalQuestions || questionsWithProps.length,
        subjects: subjects.length > 0 ? subjects : ['General Knowledge'],
        markingScheme,
        defaultLanguage: 'english'
      },
      questions: questionsWithProps
    };
  }

  // Create test data from questions
  private createTestDataFromQuestions(examId: string, sectionId: string, testId: string, questions: any[]): TestData {
    const exam = dynamicExamService.getExamConfig(examId);
    const testName = this.getTestName(examId, sectionId, testId);
    
    // Convert raw JSON questions to QuestionWithProps format
    const questionsWithProps: QuestionWithProps[] = questions.map(q => ({
      id: q.id,
      questionEn: q.questionEn,
      questionHi: q.questionHi,
      options: q.options || [],
      correctAnswerIndex: q.correct || q.correctAnswerIndex || 0,
      explanationEn: q.explanationEn,
      explanationHi: q.explanationHi,
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0.25,
      duration: q.duration || 60,
      subject: q.subject || 'general',
      topic: q.topic || 'general',
      difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
      imageUrl: q.imageUrl,
      hasImages: q.hasImages,
      questionImage: q.questionImage,
      optionImages: q.optionImages,
      explanationImage: q.explanationImage
    }));
    
    // Calculate total duration
    const totalDuration = Math.max(SecureDynamicQuestionLoader.calculateTotalDuration(questionsWithProps), 60);
    
    // Get subjects from questions
    const subjects = [...new Set(questionsWithProps.map(q => q.subject).filter(Boolean))];
    
    // Get marking scheme from first question
    const firstQuestion = questionsWithProps[0];
    const markingScheme = {
      correct: firstQuestion?.marks || 1,
      incorrect: firstQuestion?.negativeMarks || 0.25,
      unattempted: 0
    };

    return {
      examInfo: {
        testName,
        duration: totalDuration,
        totalQuestions: questionsWithProps.length,
        subjects: subjects.length > 0 ? subjects : ['General Knowledge'],
        markingScheme,
        defaultLanguage: 'english'
      },
      questions: questionsWithProps
    };
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
  static calculateTotalDuration(questions: any[]): number {
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
