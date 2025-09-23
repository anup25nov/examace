// Secure Dynamic Question Loader - Handles all question loading with security
import { secureExamService } from './secureExamService';
import { secureQuestionService, SecureQuestionData, SecureTestData } from './secureQuestionService';
import { premiumTestService } from './premiumTestService';
import { examDataService } from '@/data/examData';
import { dynamicExamService } from './dynamicExamService';

export interface QuestionData {
  id: string;
  questionEn: string;
  questionHi?: string;
  optionsEn: string[];
  optionsHi?: string[];
  correctAnswerIndex: number;
  explanationEn?: string;
  explanationHi?: string;
  marks?: number;
  negativeMarks?: number;
  difficulty?: string;
  subject?: string;
  topic?: string;
  imageUrl?: string;
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
              optionsEn: q.options || q.optionsEn || [],
              optionsHi: q.optionsHi || [],
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

      // Get questions from secure service
      console.log(`🔍 Attempting to load questions for: ${examId}/${sectionId}/${testId}`);
      const questions = await secureQuestionService.getQuestionData(examId, sectionId, testId);
      console.log(`🔍 Secure service returned:`, questions ? `${questions.length} questions` : 'null/empty');
      if (!questions || questions.length === 0) {
        console.log('No questions found in secure service, trying direct JSON loading...');
        // Try to load questions directly from JSON file
        const directQuestions = await this.loadQuestionsFromJson(examId, sectionId, testId);
        if (directQuestions && directQuestions.length > 0) {
          console.log(`✅ Loaded ${directQuestions.length} questions directly from JSON file`);
          const convertedQuestions: QuestionWithProps[] = directQuestions.map(q => ({
            id: q.id,
            questionEn: q.questionEn,
            questionHi: q.questionHi,
            optionsEn: q.options || [],
            optionsHi: q.options || [],
            correctAnswerIndex: q.correct,
            explanationEn: q.explanation,
            explanationHi: q.explanation,
            marks: q.marks || 1,
            negativeMarks: q.negativeMarks || 0.25,
            duration: q.duration || 60,
            difficulty: q.difficulty || 'medium',
            subject: q.subject || 'general',
            topic: q.topic || 'general',
            imageUrl: q.imageUrl
          }));
          
          // Create test data with loaded questions
          const testData: TestData = {
            examInfo: {
              testName: this.getTestName(examId, sectionId, testId),
              duration: this.calculateTestDuration(convertedQuestions, exam.examPattern?.duration || 60),
              totalQuestions: convertedQuestions.length,
              subjects: exam.examPattern?.subjects || ['General'],
              markingScheme: exam.examPattern?.markingScheme || { correct: 1, incorrect: -0.25, unattempted: 0 },
              defaultLanguage: 'english'
            },
            questions: convertedQuestions
          };
          
          return testData;
        }
        
        console.log('No questions found in JSON file, using centralized data...');
        // Use centralized data if direct loading fails
        const centralizedQuestions = examDataService.getQuestionData(examId, sectionId, testId);
        if (centralizedQuestions.length === 0) {
          console.error('No questions found for test:', { examId, sectionId, testId, topicId });
          return null;
        }
        // Convert centralized questions to our format
        const convertedQuestions: QuestionWithProps[] = centralizedQuestions.map(q => ({
          id: q.id,
          questionEn: q.questionEn,
          questionHi: q.questionHi,
          optionsEn: q.optionsEn,
          optionsHi: q.optionsHi,
          correctAnswerIndex: q.correctAnswerIndex,
          explanationEn: q.explanationEn,
          explanationHi: q.explanationHi,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          duration: 60, // Default duration
          difficulty: q.difficulty,
          subject: q.subject,
          topic: q.topic,
          imageUrl: q.imageUrl
        }));
        return this.createTestDataFromQuestions(examId, sectionId, testId, convertedQuestions);
      }

      // Convert to QuestionWithProps format
      const questionsWithProps: QuestionWithProps[] = questions.map(q => ({
        id: q.id,
        questionEn: q.questionEn,
        questionHi: q.questionHi,
        optionsEn: q.options || q.optionsEn || [],
        optionsHi: q.optionsHi || [],
        correctAnswerIndex: q.correct || q.correctAnswerIndex || 0,
        explanationEn: q.explanationEn,
        explanationHi: q.explanationHi,
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks || 0.25,
        duration: q.duration || 60,
        subject: q.subject || 'general',
        topic: q.topic || 'general',
        difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        imageUrl: q.imageUrl
      }));

      // Get test duration from exam pattern or calculate from questions
      const testDuration = this.calculateTestDuration(questionsWithProps, exam.examPattern?.duration || 60);

      // Create test data
      const testData: TestData = {
        examInfo: {
          testName: this.getTestName(examId, sectionId, testId),
          duration: testDuration,
          totalQuestions: questionsWithProps.length,
          subjects: exam.examPattern?.subjects || ['General'],
          markingScheme: exam.examPattern?.markingScheme || { correct: 1, incorrect: -0.25, unattempted: 0 },
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

  // Create test data from questions
  private createTestDataFromQuestions(examId: string, sectionId: string, testId: string, questions: QuestionWithProps[]): TestData {
    const exam = dynamicExamService.getExamConfig(examId);
    const testName = this.getTestName(examId, sectionId, testId);
    
    // Calculate total duration
    const totalDuration = SecureDynamicQuestionLoader.calculateTotalDuration(questions);
    
    // Get subjects from questions
    const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
    
    // Get marking scheme from first question
    const firstQuestion = questions[0];
    const markingScheme = {
      correct: firstQuestion?.marks || 1,
      incorrect: firstQuestion?.negativeMarks || 0.25,
      unattempted: 0
    };

    return {
      examInfo: {
        testName,
        duration: totalDuration,
        totalQuestions: questions.length,
        subjects: subjects.length > 0 ? subjects : ['General Knowledge'],
        markingScheme,
        defaultLanguage: 'english'
      },
      questions: questions.map(q => ({
        ...q,
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks || 0.25,
        duration: 60, // Default 1 minute per question
        subject: q.subject || 'General Knowledge',
        topic: q.topic || '',
        difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium'
      }))
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

  // Load questions directly from JSON file
  private async loadQuestionsFromJson(examId: string, sectionId: string, testId: string): Promise<any[] | null> {
    try {
      const filePath = `/src/data/questions/${examId}/${sectionId}/${testId}.json`;
      console.log(`📁 Attempting to load questions from: ${filePath}`);
      
      const response = await fetch(filePath);
      if (!response.ok) {
        console.log(`❌ File not found: ${filePath}`);
        return null;
      }
      
      const data = await response.json();
      if (data.questions && Array.isArray(data.questions)) {
        console.log(`✅ Successfully loaded ${data.questions.length} questions from JSON`);
        return data.questions;
      }
      
      console.log('❌ Invalid JSON structure - no questions array found');
      return null;
    } catch (error) {
      console.error('❌ Error loading questions from JSON:', error);
      return null;
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
