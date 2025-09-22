// Dynamic Test Data Loader - Handles all test data loading dynamically
import { dynamicExamService, TestData, QuestionData } from './dynamicExamService';

export interface TestDataWithQuestions extends Omit<TestData, 'questions'> {
  questions: QuestionData[];
}

export interface YearData {
  year: string;
  papers: TestDataWithQuestions[];
}

export interface SubjectData {
  id: string;
  name: string;
  topics: {
    id: string;
    name: string;
    tests: TestDataWithQuestions[];
  }[];
}

export class DynamicTestDataLoader {
  private static instance: DynamicTestDataLoader;
  private cache: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): DynamicTestDataLoader {
    if (!DynamicTestDataLoader.instance) {
      DynamicTestDataLoader.instance = new DynamicTestDataLoader();
    }
    return DynamicTestDataLoader.instance;
  }

  // Get mock tests for an exam
  async getMockTests(examId: string): Promise<TestDataWithQuestions[]> {
    const cacheKey = `mock-${examId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const tests = await dynamicExamService.getTestData(examId, 'mock');
      const testsWithQuestions = await Promise.all(
        tests.map(async (test) => ({
          ...test,
          questions: await dynamicExamService.getQuestionData(examId, 'mock', test.id)
        }))
      );
      
      this.cache.set(cacheKey, testsWithQuestions);
      return testsWithQuestions;
    } catch (error) {
      console.error('Error loading mock tests:', error);
      return [];
    }
  }

  // Get PYQ data for an exam
  async getPYQData(examId: string): Promise<YearData[]> {
    const cacheKey = `pyq-${examId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const tests = await dynamicExamService.getTestData(examId, 'pyq');
      
      // Group tests by year
      const yearMap = new Map<string, TestData[]>();
      tests.forEach(test => {
        const year = test.id.split('-')[0];
        if (!yearMap.has(year)) {
          yearMap.set(year, []);
        }
        yearMap.get(year)!.push(test);
      });

      // Convert to YearData format with questions
      const yearData: YearData[] = [];
      for (const [year, yearTests] of yearMap) {
        const papersWithQuestions = await Promise.all(
          yearTests.map(async (test) => ({
            ...test,
            questions: await dynamicExamService.getQuestionData(examId, 'pyq', test.id)
          }))
        );
        
        yearData.push({
          year,
          papers: papersWithQuestions
        });
      }

      // Sort by year (newest first)
      yearData.sort((a, b) => parseInt(b.year) - parseInt(a.year));
      
      this.cache.set(cacheKey, yearData);
      return yearData;
    } catch (error) {
      console.error('Error loading PYQ data:', error);
      return [];
    }
  }

  // Get practice data for an exam
  async getPracticeData(examId: string): Promise<SubjectData[]> {
    const cacheKey = `practice-${examId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const tests = await dynamicExamService.getTestData(examId, 'practice');
      
      // Group tests by subject and topic
      const subjectMap = new Map<string, Map<string, TestData[]>>();
      
      tests.forEach(test => {
        const [subjectId, topicId] = test.id.split('-');
        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, new Map());
        }
        if (!subjectMap.get(subjectId)!.has(topicId)) {
          subjectMap.get(subjectId)!.set(topicId, []);
        }
        subjectMap.get(subjectId)!.get(topicId)!.push(test);
      });

      // Convert to SubjectData format with questions
      const subjectData: SubjectData[] = [];
      for (const [subjectId, topicMap] of subjectMap) {
        const topics = [];
        
        for (const [topicId, topicTests] of topicMap) {
          const testsWithQuestions = await Promise.all(
            topicTests.map(async (test) => ({
              ...test,
              questions: await dynamicExamService.getQuestionData(examId, 'practice', test.id)
            }))
          );
          
          topics.push({
            id: topicId,
            name: this.formatTopicName(topicId),
            tests: testsWithQuestions
          });
        }
        
        subjectData.push({
          id: subjectId,
          name: this.formatSubjectName(subjectId),
          topics
        });
      }

      this.cache.set(cacheKey, subjectData);
      return subjectData;
    } catch (error) {
      console.error('Error loading practice data:', error);
      return [];
    }
  }

  // Get all test data for an exam
  async getAllTestData(examId: string): Promise<{
    mock: TestDataWithQuestions[];
    pyq: YearData[];
    practice: SubjectData[];
  }> {
    const [mock, pyq, practice] = await Promise.all([
      this.getMockTests(examId),
      this.getPYQData(examId),
      this.getPracticeData(examId)
    ]);

    return { mock, pyq, practice };
  }

  // Get questions for a specific test
  async getQuestionsForTest(
    examId: string, 
    sectionId: string, 
    testId: string, 
    topicId?: string
  ): Promise<QuestionData[]> {
    const cacheKey = `questions-${examId}-${sectionId}-${testId}-${topicId || ''}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const questions = await dynamicExamService.getQuestionData(examId, sectionId, testId);
      this.cache.set(cacheKey, questions);
      return questions;
    } catch (error) {
      console.error('Error loading questions for test:', error);
      return [];
    }
  }

  // Get test duration
  async getTestDuration(
    examId: string, 
    sectionId: string, 
    testId: string, 
    topicId?: string
  ): Promise<number> {
    try {
      const tests = await dynamicExamService.getTestData(examId, sectionId);
      const test = tests.find(t => t.id === testId);
      return test?.duration || 60; // Default 60 minutes
    } catch (error) {
      console.error('Error getting test duration:', error);
      return 60;
    }
  }

  // Check if test exists
  async testExists(examId: string, sectionId: string, testId: string): Promise<boolean> {
    try {
      const tests = await dynamicExamService.getTestData(examId, sectionId);
      return tests.some(test => test.id === testId);
    } catch (error) {
      console.error('Error checking if test exists:', error);
      return false;
    }
  }

  // Get exam pattern (marking scheme, duration, etc.)
  getExamPattern(examId: string) {
    const exam = dynamicExamService.getExamConfig(examId);
    return exam?.examPattern || {
      totalQuestions: 100,
      duration: 60,
      subjects: [],
      markingScheme: { correct: 1, incorrect: 0, unattempted: 0 }
    };
  }

  // Helper methods
  private formatSubjectName(subjectId: string): string {
    const subjectNames: { [key: string]: string } = {
      'maths': 'Mathematics',
      'physics': 'Physics',
      'chemistry': 'Chemistry',
      'english': 'English',
      'gk': 'General Knowledge',
      'reasoning': 'Reasoning',
      'quantitative': 'Quantitative Aptitude',
      'general-awareness': 'General Awareness',
      'general-intelligence': 'General Intelligence'
    };
    
    return subjectNames[subjectId] || subjectId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private formatTopicName(topicId: string): string {
    const topicNames: { [key: string]: string } = {
      'algebra': 'Algebra',
      'geometry': 'Geometry',
      'arithmetic': 'Arithmetic',
      'trigonometry': 'Trigonometry',
      'mechanics': 'Mechanics',
      'thermodynamics': 'Thermodynamics',
      'organic': 'Organic Chemistry',
      'inorganic': 'Inorganic Chemistry',
      'grammar': 'Grammar',
      'vocabulary': 'Vocabulary',
      'comprehension': 'Reading Comprehension',
      'history': 'History',
      'geography': 'Geography',
      'science': 'Science',
      'logical': 'Logical Reasoning',
      'verbal': 'Verbal Reasoning',
      'non-verbal': 'Non-Verbal Reasoning'
    };
    
    return topicNames[topicId] || topicId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

export const dynamicTestDataLoader = DynamicTestDataLoader.getInstance();
