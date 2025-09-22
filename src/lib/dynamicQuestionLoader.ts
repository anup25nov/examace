// Dynamic Question Loader - Handles all question loading dynamically
import { dynamicExamService, QuestionData } from './dynamicExamService';

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

export class DynamicQuestionLoader {
  private static instance: DynamicQuestionLoader;
  private cache: Map<string, TestData> = new Map();

  private constructor() {}

  static getInstance(): DynamicQuestionLoader {
    if (!DynamicQuestionLoader.instance) {
      DynamicQuestionLoader.instance = new DynamicQuestionLoader();
    }
    return DynamicQuestionLoader.instance;
  }

  // Load questions for a test
  async loadQuestions(
    examId: string, 
    sectionId: string, 
    testId: string, 
    topicId?: string
  ): Promise<TestData | null> {
    const cacheKey = `${examId}-${sectionId}-${testId}-${topicId || ''}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

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

      this.cache.set(cacheKey, testData);
      return testData;
    } catch (error) {
      console.error('Error loading questions:', error);
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
    topicId?: string
  ): Promise<QuestionWithProps[]> {
    const loader = DynamicQuestionLoader.getInstance();
    const testData = await loader.loadQuestions(examId, sectionId, testId, topicId);
    return testData?.questions || [];
  }

  // Get test duration (legacy compatibility)
  static async getTestDuration(
    examId: string, 
    sectionId: string, 
    testId: string, 
    topicId?: string
  ): Promise<number> {
    const loader = DynamicQuestionLoader.getInstance();
    const testData = await loader.loadQuestions(examId, sectionId, testId, topicId);
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
}

// Export singleton instance
export const dynamicQuestionLoader = DynamicQuestionLoader.getInstance();

// Legacy exports for compatibility
export const QuestionLoader = {
  loadQuestions: DynamicQuestionLoader.getQuestionsForTest,
  getQuestionsForTest: DynamicQuestionLoader.getQuestionsForTest,
  getTestDuration: DynamicQuestionLoader.getTestDuration,
  calculateTotalDuration: DynamicQuestionLoader.calculateTotalDuration
};
