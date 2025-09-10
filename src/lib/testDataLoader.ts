import { PremiumTest } from './premiumService';
import testData from '../data/testData.json';

export interface YearData {
  year: string;
  papers: PremiumTest[];
}

export interface MockData {
  free: PremiumTest[];
  premium: PremiumTest[];
}

export interface PracticeTopic {
  name: string;
  sets: PremiumTest[];
}

export interface PracticeSubject {
  name: string;
  description: string;
  topics: { [key: string]: PracticeTopic };
}

export interface ExamTestData {
  mock: MockData;
  pyq: { [year: string]: PremiumTest[] };
  practice: { [subjectId: string]: PracticeSubject };
}

export class TestDataLoader {
  private static instance: TestDataLoader;
  private cache: Map<string, ExamTestData> = new Map();

  static getInstance(): TestDataLoader {
    if (!TestDataLoader.instance) {
      TestDataLoader.instance = new TestDataLoader();
    }
    return TestDataLoader.instance;
  }

  /**
   * Load test data for a specific exam
   */
  getExamTestData(examId: string): ExamTestData | null {
    if (this.cache.has(examId)) {
      return this.cache.get(examId)!;
    }

    const examData = (testData as any)[examId];
    if (!examData) {
      return null;
    }

    const processedData: ExamTestData = {
      mock: examData.mock || { free: [], premium: [] },
      pyq: examData.pyq || {},
      practice: examData.practice || {}
    };

    this.cache.set(examId, processedData);
    return processedData;
  }

  /**
   * Get all mock tests (free + premium)
   */
  getAllMockTests(examId: string): PremiumTest[] {
    const examData = this.getExamTestData(examId);
    if (!examData) return [];

    return [...examData.mock.free, ...examData.mock.premium];
  }

  /**
   * Get free mock tests only
   */
  getFreeMockTests(examId: string): PremiumTest[] {
    const examData = this.getExamTestData(examId);
    if (!examData) return [];

    return examData.mock.free || [];
  }

  /**
   * Get premium mock tests only
   */
  getPremiumMockTests(examId: string): PremiumTest[] {
    const examData = this.getExamTestData(examId);
    if (!examData) return [];

    return examData.mock.premium || [];
  }

  /**
   * Get PYQ data organized by years
   */
  getPYQData(examId: string): YearData[] {
    const examData = this.getExamTestData(examId);
    if (!examData) return [];

    return Object.entries(examData.pyq).map(([year, papers]) => ({
      year,
      papers: papers as PremiumTest[]
    })).sort((a, b) => b.year.localeCompare(a.year)); // Sort by year descending
  }

  /**
   * Get practice data organized by subjects
   */
  getPracticeData(examId: string): PracticeSubject[] {
    const examData = this.getExamTestData(examId);
    if (!examData) return [];

    return Object.entries(examData.practice).map(([subjectId, subject]) => ({
      ...subject,
      id: subjectId
    } as PracticeSubject & { id: string }));
  }

  /**
   * Get a specific test by ID
   */
  getTestById(examId: string, testId: string): PremiumTest | null {
    const examData = this.getExamTestData(examId);
    if (!examData) return null;

    // Search in mock tests
    const allMockTests = [...examData.mock.free, ...examData.mock.premium];
    const mockTest = allMockTests.find(test => test.id === testId);
    if (mockTest) return mockTest;

    // Search in PYQ tests
    for (const yearData of Object.values(examData.pyq)) {
      const pyqTest = yearData.find(test => test.id === testId);
      if (pyqTest) return pyqTest;
    }

    // Search in practice tests
    for (const subject of Object.values(examData.practice)) {
      for (const topic of Object.values(subject.topics)) {
        const practiceTest = topic.sets.find(test => test.id === testId);
        if (practiceTest) return practiceTest;
      }
    }

    return null;
  }

  /**
   * Get available exam IDs
   */
  getAvailableExams(): string[] {
    return Object.keys(testData as any);
  }

  /**
   * Clear cache (for testing or data refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const testDataLoader = TestDataLoader.getInstance();
