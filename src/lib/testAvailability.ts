// Test Availability Service
// This service checks which test files actually exist and returns only available tests

import { SecureTestData } from "@/lib/secureTestDataLoader";

interface TestData {
  id: string;
  name: string;
  duration: number;
  questions: any[];
  breakdown?: string;
  isPremium?: boolean;
}

interface AvailableTests {
  mock: TestData[];
  pyq: { year: string; papers: TestData[] }[];
  practice: TestData[];
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
        { id: 'mock-test-1', name: 'SSC CGL Mock Test 1', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: false },
        { id: 'mock-test-2', name: 'SSC CGL Mock Test 2', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: false },
        { id: 'mock-test-3', name: 'SSC CGL Mock Test 3', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: true },
        { id: 'mock-test-4', name: 'SSC CGL Premium Mock Test 1', duration: 180, questions: Array(100).fill(null), breakdown: 'Advanced mock test covering all subjects', isPremium: true },
        { id: 'mock-test-5', name: 'SSC CGL Premium Mock Test 2', duration: 180, questions: Array(100).fill(null), breakdown: 'Advanced mock test covering all subjects', isPremium: true },
        { id: 'mock-test-6', name: 'SSC CGL Mock Test 6', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: false },
        { id: 'mock-test-7', name: 'SSC CGL Mock Test 7', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: false },
        { id: 'mock-test-8', name: 'SSC CGL Mock Test 8', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: true },
        { id: 'mock-test-9', name: 'SSC CGL Mock Test 9', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: true },
        { id: 'mock-test-10', name: 'SSC CGL Mock Test 10', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: false },
        { id: 'mock-test-11', name: 'SSC CGL Mock Test 11', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: false },
        { id: 'mock-test-12', name: 'SSC CGL Mock Test 12', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: true },
        { id: 'mock-test-13', name: 'SSC CGL Mock Test 13', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: true },
        { id: 'mock-test-14', name: 'SSC CGL Mock Test 14', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: false },
        { id: 'mock-test-15', name: 'SSC CGL Mock Test 15', duration: 180, questions: Array(100).fill(null), breakdown: 'Complete mock test covering all subjects', isPremium: true }
      ],
      pyq: [
        {
          year: '2024',
          papers: [
            { id: '2024-set-1', name: 'SSC CGL 2024 Set 1', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2024 Set 1', isPremium: false },
            { id: '2024-set-2', name: 'SSC CGL 2024 Set 2', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2024 Set 2', isPremium: false },
            { id: '2024-set-3', name: 'SSC CGL 2024 Set 3', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2024 Set 3', isPremium: false },
            { id: '2024-set-4', name: 'SSC CGL 2024 Set 4', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2024 Set 4', isPremium: false },
            { id: '2024-set-5', name: 'SSC CGL 2024 Set 5', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2024 Set 5', isPremium: false }
          ]
        },
        {
          year: '2023',
          papers: [
            { id: '2023-set-1', name: 'SSC CGL 2023 Set 1', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2023 Set 1', isPremium: false },
            { id: '2023-set-2', name: 'SSC CGL 2023 Set 2', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2023 Set 2', isPremium: false },
            { id: '2023-set-3', name: 'SSC CGL 2023 Set 3', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2023 Set 3', isPremium: false },
            { id: '2023-set-4', name: 'SSC CGL 2023 Set 4', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2023 Set 4', isPremium: false },
            { id: '2023-set-5', name: 'SSC CGL 2023 Set 5', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2023 Set 5', isPremium: false }
          ]
        },
        {
          year: '2022',
          papers: [
            { id: '2022-set-1', name: 'SSC CGL 2022 Set 1', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2022 Set 1', isPremium: false },
            { id: '2022-set-2', name: 'SSC CGL 2022 Set 2', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2022 Set 2', isPremium: false },
            { id: '2022-set-3', name: 'SSC CGL 2022 Set 3', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2022 Set 3', isPremium: false },
            { id: '2022-set-4', name: 'SSC CGL 2022 Set 4', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2022 Set 4', isPremium: false },
            { id: '2022-set-5', name: 'SSC CGL 2022 Set 5', duration: 180, questions: Array(100).fill(null), breakdown: 'Previous Year Questions 2022 Set 5', isPremium: false }
          ]
        }
      ],
      practice: [
        { id: 'maths-algebra', name: 'Mathematics - Algebra', duration: 60, questions: Array(50).fill(null), breakdown: 'Algebra fundamentals and practice', isPremium: false },
        { id: 'english-grammar', name: 'English - Grammar', duration: 45, questions: Array(50).fill(null), breakdown: 'Grammar rules and practice', isPremium: false },
        { id: 'general-awareness', name: 'General Awareness', duration: 30, questions: Array(50).fill(null), breakdown: 'Current affairs and general knowledge', isPremium: false }
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
