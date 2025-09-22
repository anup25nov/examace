// Test Availability Service
// This service checks which test files actually exist and returns only available tests

import { TestData } from "@/lib/dynamicExamService";

interface AvailableTests {
  mock: (TestData & { isPremium?: boolean })[];
  pyq: { year: string; papers: (TestData & { isPremium?: boolean })[] }[];
  practice: (TestData & { isPremium?: boolean })[];
}

class TestAvailabilityService {
  private cache = new Map<string, boolean>();

  // Check if a test file exists by trying to import it
  private async checkTestFileExists(examId: string, testType: string, testId: string): Promise<boolean> {
    const cacheKey = `${examId}-${testType}-${testId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Check if test exists in the static mapping
    const staticKey = `${examId}-${testType}-${testId}`;
    const exists = staticKey in {
      'ssc-cgl-mock-mock-test-1': true,
      'ssc-cgl-pyq-2024-set-1': true,
      'ssc-cgl-pyq-2024-set-2': true,
      'ssc-cgl-pyq-2023-set-1': true,
    };
    
    this.cache.set(cacheKey, exists);
    return exists;
  }

  // Filter available mock tests
  async getAvailableMockTests(examId: string, allMockTests: TestData[]): Promise<TestData[]> {
    const availableTests: TestData[] = [];
    
    for (const test of allMockTests) {
      const exists = await this.checkTestFileExists(examId, 'mock', test.id);
      if (exists) {
        availableTests.push(test);
      }
    }
    
    return availableTests;
  }

  // Filter available PYQ tests by year
  async getAvailablePYQTests(examId: string, allPYQTests: { year: string; papers: TestData[] }[]): Promise<{ year: string; papers: TestData[] }[]> {
    const availableYears: { year: string; papers: TestData[] }[] = [];
    
    for (const yearData of allPYQTests) {
      const availablePapers: TestData[] = [];
      
      for (const paper of yearData.papers) {
        const exists = await this.checkTestFileExists(examId, 'pyq', paper.id);
        if (exists) {
          availablePapers.push(paper);
        }
      }
      
      // Only include year if it has at least one available paper
      if (availablePapers.length > 0) {
        availableYears.push({
          year: yearData.year,
          papers: availablePapers
        });
      }
    }
    
    return availableYears;
  }

  // Filter available practice tests
  async getAvailablePracticeTests(examId: string, allPracticeTests: TestData[]): Promise<TestData[]> {
    const availableTests: TestData[] = [];
    
    for (const test of allPracticeTests) {
      const exists = await this.checkTestFileExists(examId, 'practice', test.id);
      if (exists) {
        availableTests.push(test);
      }
    }
    
    return availableTests;
  }

  // Get all available tests for an exam with custom test data
  async getAvailableTestsWithData(examId: string, allTests: {
    mock: TestData[];
    pyq: { year: string; papers: TestData[] }[];
    practice: TestData[];
  }): Promise<AvailableTests> {
    const [mock, pyq, practice] = await Promise.all([
      this.getAvailableMockTests(examId, allTests.mock),
      this.getAvailablePYQTests(examId, allTests.pyq),
      this.getAvailablePracticeTests(examId, allTests.practice)
    ]);

    return { mock, pyq, practice };
  }

  // Get available tests with default data
  async getAvailableTests(examId: string): Promise<AvailableTests> {
    // Return default test data for now
    return {
      mock: [
        { id: 'mock-test-1', name: 'SSC CGL Mock Test 1', description: 'Complete mock test covering all subjects', duration: 180, questions: 100, subjects: ['General Intelligence', 'English', 'Quantitative Aptitude', 'General Awareness'], difficulty: 'mixed', isPremium: false, price: 0, order: 1, metadata: {} },
        { id: 'mock-test-2', name: 'SSC CGL Mock Test 2', description: 'Complete mock test covering all subjects', duration: 180, questions: 100, subjects: ['General Intelligence', 'English', 'Quantitative Aptitude', 'General Awareness'], difficulty: 'mixed', isPremium: false, price: 0, order: 2, metadata: {} },
        { id: 'mock-test-3', name: 'SSC CGL Mock Test 3', description: 'Complete mock test covering all subjects', duration: 180, questions: 100, subjects: ['General Intelligence', 'English', 'Quantitative Aptitude', 'General Awareness'], difficulty: 'mixed', isPremium: true, price: 199, order: 3, metadata: {} },
        { id: 'mock-test-4', name: 'SSC CGL Premium Mock Test 1', description: 'Advanced mock test covering all subjects', duration: 180, questions: 100, subjects: ['General Intelligence', 'English', 'Quantitative Aptitude', 'General Awareness'], difficulty: 'hard', isPremium: true, price: 299, order: 4, metadata: {} },
        { id: 'mock-test-5', name: 'SSC CGL Premium Mock Test 2', description: 'Advanced mock test covering all subjects', duration: 180, questions: 100, subjects: ['General Intelligence', 'English', 'Quantitative Aptitude', 'General Awareness'], difficulty: 'hard', isPremium: true, price: 299, order: 5, metadata: {} }
      ],
      pyq: [
        {
          year: '2024',
          papers: [
            { id: '2024-set-1', name: 'SSC CGL 2024 Set 1', description: 'Previous Year Questions 2024 Set 1', duration: 180, questions: 100, subjects: ['General Intelligence', 'English', 'Quantitative Aptitude', 'General Awareness'], difficulty: 'mixed', isPremium: false, price: 0, order: 1, metadata: {} },
            { id: '2024-set-2', name: 'SSC CGL 2024 Set 2', description: 'Previous Year Questions 2024 Set 2', duration: 180, questions: 100, subjects: ['General Intelligence', 'English', 'Quantitative Aptitude', 'General Awareness'], difficulty: 'mixed', isPremium: false, price: 0, order: 2, metadata: {} },
            { id: '2021-set-1', name: 'SSC CGL 2021 27 June Set 1', description: 'Previous Year Questions 2021 Set 1', duration: 180, questions: 100, subjects: ['General Intelligence', 'English', 'Quantitative Aptitude', 'General Awareness'], difficulty: 'mixed', isPremium: false, price: 0, order: 3, metadata: {} }
          ]
        },
        {
          year: '2023',
          papers: [
            { id: '2023-set-1', name: 'SSC CGL 2023 Set 1', description: 'Previous Year Questions 2023 Set 1', duration: 180, questions: 100, subjects: ['General Intelligence', 'English', 'Quantitative Aptitude', 'General Awareness'], difficulty: 'mixed', isPremium: false, price: 0, order: 1, metadata: {} }
          ]
        }
      ],
      practice: [
        { id: 'maths-algebra', name: 'Mathematics - Algebra', description: 'Algebra fundamentals and practice', duration: 60, questions: 50, subjects: ['Quantitative Aptitude'], difficulty: 'mixed', isPremium: false, price: 0, order: 1, metadata: {} },
        { id: 'english-grammar', name: 'English - Grammar', description: 'Grammar rules and practice', duration: 45, questions: 50, subjects: ['English Language'], difficulty: 'mixed', isPremium: false, price: 0, order: 2, metadata: {} },
        { id: 'general-awareness', name: 'General Awareness', description: 'Current affairs and general knowledge', duration: 30, questions: 50, subjects: ['General Awareness'], difficulty: 'mixed', isPremium: false, price: 0, order: 3, metadata: {} }
      ]
    };
  }

  // Get test completions (mock implementation)
  async getTestCompletions(examId: string): Promise<{ data: any[] | null }> {
    // Return empty completions for now
    return { data: [] };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
export const testAvailabilityService = new TestAvailabilityService();
export type { AvailableTests };
