/**
 * Centralized Exam Data Source
 * Single point of truth for all exam, test, and question data
 */

export interface ExamConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  sections: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    icon?: string;
    color?: string;
  }[];
  metadata: {
    totalTests: number;
    totalQuestions: number;
    difficulty: string;
    duration: number;
  };
}

export interface TestData {
  id: string;
  name: string;
  description: string;
  duration: number;
  questions: number;
  subjects: string[];
  isPremium: boolean;
  price: number;
  metadata: {
    year?: string;
    day?: number;
    shift?: number;
    paper?: number;
    date?: string;
    type?: string;
    difficulty?: string;
    subject?: string;
    hasImages?: boolean;
  };
}

export interface QuestionData {
  id: string;
  questionEn: string;
  questionHi?: string;
  options: Array<{en: string; hi?: string}> | string[];
  correctAnswerIndex: number;
  explanationEn?: string;
  explanationHi?: string;
  marks: number;
  negativeMarks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  imageUrl?: string;
  hasImages?: boolean;
  questionImage?: {en: string; hi?: string};
  optionImages?: Array<{en: string; hi?: string}>;
  explanationImage?: {en: string; hi?: string};
}

class ExamDataService {
  private static instance: ExamDataService;
  private examConfigs: Map<string, ExamConfig> = new Map();
  private testData: Map<string, TestData[]> = new Map();
  private questionData: Map<string, QuestionData[]> = new Map();

  private constructor() {
    this.initializeData();
  }

  static getInstance(): ExamDataService {
    if (!ExamDataService.instance) {
      ExamDataService.instance = new ExamDataService();
    }
    return ExamDataService.instance;
  }

  private initializeData() {
    // SSC CGL Configuration
    this.examConfigs.set('ssc-cgl', {
      id: 'ssc-cgl',
      name: 'SSC CGL',
      displayName: 'SSC Combined Graduate Level',
      description: 'Staff Selection Commission Combined Graduate Level Examination',
      sections: [
        {
          id: 'mock',
          name: 'Mock Tests',
          displayName: 'Mock Tests',
          description: 'Practice mock tests for SSC CGL preparation',
          icon: '🎯',
          color: 'blue'
        },
        {
          id: 'pyq',
          name: 'Previous Year Questions',
          displayName: 'PYQ',
          description: 'Previous year question papers',
          icon: '📚',
          color: 'green'
        },
        {
          id: 'practice',
          name: 'Practice Tests',
          displayName: 'Practice',
          description: 'Subject-wise practice tests',
          icon: '💪',
          color: 'purple'
        }
      ],
      metadata: {
        totalTests: 20,
        totalQuestions: 2000,
        difficulty: 'mixed',
        duration: 180
      }
    });

    // Initialize test data
    this.initializeTestData();
    this.initializeQuestionData();
  }

  private initializeTestData() {
    // SSC CGL Mock Tests
    this.testData.set('ssc-cgl-mock', [
      {
        id: 'mock-paper-1',
        name: 'SSC CGL Mock Test 1',
        description: 'Comprehensive mock test for SSC CGL preparation',
        duration: 120,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { type: 'mock', difficulty: 'mixed' }
      },
      {
        id: 'mock-paper-2',
        name: 'SSC CGL Mock Test 2',
        description: 'Advanced mock test for SSC CGL preparation',
        duration: 120,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { type: 'mock', difficulty: 'mixed' }
      },
      {
        id: 'mock-paper-3',
        name: 'SSC CGL Mock Test 3',
        description: 'Practice mock test for SSC CGL preparation',
        duration: 120,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { type: 'mock', difficulty: 'mixed' }
      },
      {
        id: 'mock-paper-9',
        name: 'SSC CGL Mock Test 9',
        description: 'Comprehensive Mock Test with Visual Questions - Includes diagrams, charts, and images',
        duration: 180,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { type: 'mock', difficulty: 'mixed', hasImages: true }
      }
    ]);

    // SSC CGL PYQ Tests
    this.testData.set('ssc-cgl-pyq', [
      {
        id: '2024-paper-1',
        name: 'SSC CGL 2024 Paper 1',
        description: 'Previous Year Questions 2024 Day 1 Shift 1',
        duration: 180,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { year: '2024', day: 1, shift: 1, paper: 1, date: '2024-01-15' }
      },
      {
        id: '2024-paper-2',
        name: 'SSC CGL 2024 Paper 2',
        description: 'Previous Year Questions 2024 Day 1 Shift 2',
        duration: 180,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { year: '2024', day: 1, shift: 2, paper: 2, date: '2024-01-15' }
      },
      {
        id: '2024-paper-3',
        name: 'SSC CGL 2024 Paper 3',
        description: 'Previous Year Questions 2024 Day 1 Shift 3',
        duration: 180,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { year: '2024', day: 1, shift: 3, paper: 3, date: '2024-01-15' }
      },
      {
        id: '2024-paper-4',
        name: 'SSC CGL 2024 Paper 4',
        description: 'Previous Year Questions 2024 Day 2 Shift 1',
        duration: 180,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { year: '2024', day: 2, shift: 1, paper: 4, date: '2024-01-16' }
      },
      {
        id: '2023-paper-1',
        name: 'SSC CGL 2023 Paper 1**',
        description: 'Previous Year Questions 2023 Day 1 Shift 1',
        duration: 180,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { year: '2023', day: 1, shift: 1, paper: 1, date: '2023-01-15' }
      },
      {
        id: '2024-paper-5',
        name: 'SSC CGL 2024 Paper 5',
        description: 'Previous Year Questions 2024 Set 2 (Premium)',
        duration: 180,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: true,
        price: 99,
        metadata: { year: '2024', paper: 5, date: '2024-01-15' }
      }
    ]);

    // SSC CGL Practice Tests
    this.testData.set('ssc-cgl-practice', [
      {
        id: 'english-grammar-paper-1',
        name: 'English Grammar Practice',
        description: 'Practice questions for English Grammar',
        duration: 60,
        questions: 50,
        subjects: ['English Language'],
        isPremium: false,
        price: 0,
        metadata: { type: 'practice', subject: 'grammar' }
      },
      {
        id: 'maths-algebra-paper-1',
        name: 'Maths Algebra Practice',
        description: 'Practice questions for Algebra',
        duration: 60,
        questions: 50,
        subjects: ['Quantitative Aptitude'],
        isPremium: false,
        price: 0,
        metadata: { type: 'practice', subject: 'algebra' }
      },
      {
        id: 'general-awareness-paper-1',
        name: 'General Awareness Practice',
        description: 'Practice questions for General Awareness',
        duration: 45,
        questions: 50,
        subjects: ['General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { type: 'practice', subject: 'general-awareness' }
      }
    ]);
  }

  private initializeQuestionData() {
    // Question data is now loaded dynamically from JSON files
    // This method is kept for future extensibility
  }

  // Public methods
  getExamConfig(examId: string): ExamConfig | null {
    return this.examConfigs.get(examId) || null;
  }

  getAllExams(): ExamConfig[] {
    return Array.from(this.examConfigs.values());
  }

  getTestData(examId: string, sectionId: string): TestData[] {
    const key = `${examId}-${sectionId}`;
    console.log('🔍 [examDataService] Looking for key:', key);
    const data = this.testData.get(key) || [];
    console.log('📊 [examDataService] Found', data.length, 'tests for key:', key);
    return data;
  }

  getAllTestData(examId: string): { mock: TestData[], pyq: TestData[], practice: TestData[] } {
    console.log('🔄 [examDataService] Loading test data for exam:', examId);
    
    const mockData = this.getTestData(examId, 'mock');
    const pyqData = this.getTestData(examId, 'pyq');
    const practiceData = this.getTestData(examId, 'practice');
    
    console.log('📊 [examDataService] Test data loaded:', {
      mock: mockData.length,
      pyq: pyqData.length,
      practice: practiceData.length
    });
    
    return {
      mock: mockData,
      pyq: pyqData,
      practice: practiceData
    };
  }

  getQuestionData(examId: string, sectionId: string, testId: string): QuestionData[] {
    const key = `${examId}-${sectionId}-${testId}`;
    return this.questionData.get(key) || [];
  }

  // Add new data methods
  addExamConfig(config: ExamConfig): void {
    this.examConfigs.set(config.id, config);
  }

  addTestData(examId: string, sectionId: string, tests: TestData[]): void {
    const key = `${examId}-${sectionId}`;
    this.testData.set(key, tests);
  }

  addQuestionData(examId: string, sectionId: string, testId: string, questions: QuestionData[]): void {
    const key = `${examId}-${sectionId}-${testId}`;
    this.questionData.set(key, questions);
  }
}

export const examDataService = ExamDataService.getInstance();
