// Test Availability Service
// This service checks which test files actually exist and returns only available tests

import { TestConfig } from "@/config/examConfig";

interface AvailableTests {
  mock: TestConfig[];
  pyq: { year: string; papers: TestConfig[] }[];
  practice: TestConfig[];
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

  // Get all available tests for an exam
  async getAvailableTests(examId: string, allTests: {
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

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
export const testAvailabilityService = new TestAvailabilityService();
export type { AvailableTests };
