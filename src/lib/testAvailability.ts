// Test Availability Service
// This service checks which test files actually exist and returns only available tests

import { TestConfig } from "@/config/examConfig";

interface AvailableTests {
  mock: (TestConfig & { isPremium?: boolean })[];
  pyq: { year: string; papers: (TestConfig & { isPremium?: boolean })[] }[];
  practice: (TestConfig & { isPremium?: boolean })[];
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
  async getAvailableMockTests(examId: string, allMockTests: TestConfig[]): Promise<TestConfig[]> {
    const availableTests: TestConfig[] = [];
    
    for (const test of allMockTests) {
      const exists = await this.checkTestFileExists(examId, 'mock', test.id);
      if (exists) {
        availableTests.push(test);
      }
    }
    
    return availableTests;
  }

  // Filter available PYQ tests by year
  async getAvailablePYQTests(examId: string, allPYQTests: { year: string; papers: TestConfig[] }[]): Promise<{ year: string; papers: TestConfig[] }[]> {
    const availableYears: { year: string; papers: TestConfig[] }[] = [];
    
    for (const yearData of allPYQTests) {
      const availablePapers: TestConfig[] = [];
      
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
  async getAvailablePracticeTests(examId: string, allPracticeTests: TestConfig[]): Promise<TestConfig[]> {
    const availableTests: TestConfig[] = [];
    
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
    mock: TestConfig[];
    pyq: { year: string; papers: TestConfig[] }[];
    practice: TestConfig[];
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
        { id: 'mock-test-1', name: 'SSC CGL Mock Test 1', duration: 180, questions: [], breakdown: 'General Intelligence, English, Quantitative Aptitude, General Awareness', isPremium: false },
        { id: 'mock-test-2', name: 'SSC CGL Mock Test 2', duration: 180, questions: [], breakdown: 'General Intelligence, English, Quantitative Aptitude, General Awareness', isPremium: false },
        { id: 'mock-test-3', name: 'SSC CGL Mock Test 3', duration: 180, questions: [], breakdown: 'General Intelligence, English, Quantitative Aptitude, General Awareness', isPremium: true },
        { id: 'mock-test-4', name: 'SSC CGL Premium Mock Test 1', duration: 180, questions: [], breakdown: 'Advanced General Intelligence, English, Quantitative Aptitude, General Awareness', isPremium: true },
        { id: 'mock-test-5', name: 'SSC CGL Premium Mock Test 2', duration: 180, questions: [], breakdown: 'Advanced General Intelligence, English, Quantitative Aptitude, General Awareness', isPremium: true }
      ],
      pyq: [
        {
          year: '2024',
          papers: [
            { id: '2024-set-1', name: 'SSC CGL 2024 Set 1', duration: 180, questions: [], breakdown: 'General Intelligence, English, Quantitative Aptitude, General Awareness' },
            { id: '2024-set-2', name: 'SSC CGL 2024 Set 2', duration: 180, questions: [], breakdown: 'General Intelligence, English, Quantitative Aptitude, General Awareness' }
          ]
        },
        {
          year: '2023',
          papers: [
            { id: '2023-set-1', name: 'SSC CGL 2023 Set 1', duration: 180, questions: [], breakdown: 'General Intelligence, English, Quantitative Aptitude, General Awareness' }
          ]
        }
      ],
      practice: [
        { id: 'maths-algebra', name: 'Mathematics - Algebra', duration: 60, questions: [], breakdown: 'Algebra fundamentals and practice' },
        { id: 'english-grammar', name: 'English - Grammar', duration: 45, questions: [], breakdown: 'Grammar rules and practice' },
        { id: 'general-awareness', name: 'General Awareness', duration: 30, questions: [], breakdown: 'Current affairs and general knowledge' }
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
