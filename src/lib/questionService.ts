// Question Service - Handles loading and managing questions for tests
// This service provides proper question data structure and loading

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  marks?: number;
}

export interface TestData {
  id: string;
  name: string;
  duration: number; // in minutes
  totalMarks: number;
  questions: Question[];
  instructions?: string;
  subjects?: string[];
}

class QuestionService {
  // Generate sample questions for different test types
  private generateSampleQuestions(testType: string, testId: string): Question[] {
    const questions: Question[] = [];
    
    if (testType === 'mock') {
      // Mock test questions
      for (let i = 1; i <= 100; i++) {
        questions.push({
          id: i,
          question: `Mock Test Question ${i}: What is the capital of India?`,
          options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'],
          correctAnswer: 1,
          explanation: 'Delhi is the capital of India.',
          subject: i <= 25 ? 'General Intelligence' : i <= 50 ? 'English' : i <= 75 ? 'Quantitative Aptitude' : 'General Awareness',
          difficulty: i % 3 === 0 ? 'hard' : i % 2 === 0 ? 'medium' : 'easy',
          marks: 2
        });
      }
    } else if (testType === 'pyq') {
      // PYQ questions
      for (let i = 1; i <= 100; i++) {
        questions.push({
          id: i,
          question: `PYQ Question ${i}: Which of the following is a prime number?`,
          options: ['4', '6', '7', '8'],
          correctAnswer: 2,
          explanation: '7 is a prime number as it has only two factors: 1 and 7.',
          subject: i <= 25 ? 'General Intelligence' : i <= 50 ? 'English' : i <= 75 ? 'Quantitative Aptitude' : 'General Awareness',
          difficulty: 'medium',
          marks: 2
        });
      }
    } else if (testType === 'practice') {
      // Practice questions
      for (let i = 1; i <= 50; i++) {
        questions.push({
          id: i,
          question: `Practice Question ${i}: What is 2 + 2?`,
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          explanation: '2 + 2 = 4',
          subject: 'Mathematics',
          difficulty: 'easy',
          marks: 1
        });
      }
    }
    
    return questions;
  }

  // Load questions for a specific test
  async loadQuestions(examId: string, testType: string, testId: string): Promise<TestData | null> {
    try {
      // Generate test data based on test type and ID
      const questions = this.generateSampleQuestions(testType, testId);
      
      const testData: TestData = {
        id: testId,
        name: this.getTestName(testType, testId),
        duration: this.getTestDuration(testType),
        totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
        questions,
        instructions: this.getTestInstructions(testType),
        subjects: this.getTestSubjects(testType)
      };

      return testData;
    } catch (error) {
      console.error('Error loading questions:', error);
      return null;
    }
  }

  // Get test name based on type and ID
  private getTestName(testType: string, testId: string): string {
    if (testType === 'mock') {
      return `SSC CGL Mock Test ${testId.split('-').pop()}`;
    } else if (testType === 'pyq') {
      return `SSC CGL ${testId.replace('-', ' ').toUpperCase()}`;
    } else if (testType === 'practice') {
      return `Practice Test - ${testId.replace('-', ' ').toUpperCase()}`;
    }
    return 'Test';
  }

  // Get test duration based on type
  private getTestDuration(testType: string): number {
    switch (testType) {
      case 'mock':
        return 180; // 3 hours
      case 'pyq':
        return 180; // 3 hours
      case 'practice':
        return 60; // 1 hour
      default:
        return 60;
    }
  }

  // Get test instructions
  private getTestInstructions(testType: string): string {
    switch (testType) {
      case 'mock':
        return 'This is a comprehensive mock test. Read each question carefully and select the best answer. You have 3 hours to complete the test.';
      case 'pyq':
        return 'These are actual previous year questions. Practice with real exam patterns and improve your performance.';
      case 'practice':
        return 'This is a practice test to help you understand concepts better. Take your time and learn from explanations.';
      default:
        return 'Please read each question carefully and select the best answer.';
    }
  }

  // Get test subjects
  private getTestSubjects(testType: string): string[] {
    switch (testType) {
      case 'mock':
      case 'pyq':
        return ['General Intelligence', 'English', 'Quantitative Aptitude', 'General Awareness'];
      case 'practice':
        return ['Mathematics', 'English', 'General Knowledge'];
      default:
        return ['General'];
    }
  }

  // Validate test access
  async validateTestAccess(userId: string, testType: string, testId: string): Promise<boolean> {
    try {
      // For now, allow access to all tests
      // In the future, this can check membership status, payment, etc.
      return true;
    } catch (error) {
      console.error('Error validating test access:', error);
      return false;
    }
  }

  // Get test statistics
  async getTestStats(testId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    difficulty: string;
  }> {
    try {
      // Return mock statistics
      return {
        totalAttempts: Math.floor(Math.random() * 1000) + 100,
        averageScore: Math.floor(Math.random() * 40) + 60,
        bestScore: Math.floor(Math.random() * 20) + 80,
        difficulty: 'Medium'
      };
    } catch (error) {
      console.error('Error getting test stats:', error);
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        difficulty: 'Unknown'
      };
    }
  }
}

export const questionService = new QuestionService();
