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
  };
}

export interface QuestionData {
  id: string;
  questionEn: string;
  questionHi?: string;
  optionsEn: string[];
  optionsHi?: string[];
  correctAnswerIndex: number;
  explanationEn?: string;
  explanationHi?: string;
  marks: number;
  negativeMarks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  imageUrl?: string;
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
        id: 'mock-paper-4',
        name: 'SSC CGL Mock Test 4',
        description: 'Full-length mock test for SSC CGL preparation',
        duration: 120,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { type: 'mock', difficulty: 'mixed' }
      },
      {
        id: 'mock-paper-5',
        name: 'SSC CGL Mock Test 5',
        description: 'Comprehensive practice test for SSC CGL',
        duration: 120,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: false,
        price: 0,
        metadata: { type: 'mock', difficulty: 'mixed' }
      },
      {
        id: 'mock-paper-6',
        name: 'SSC CGL Premium Mock Test 1',
        description: 'Premium mock test with advanced questions',
        duration: 120,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: true,
        price: 199,
        metadata: { type: 'mock', difficulty: 'hard' }
      },
      {
        id: 'mock-paper-7',
        name: 'SSC CGL Premium Mock Test 2',
        description: 'Advanced premium mock test for SSC CGL',
        duration: 120,
        questions: 100,
        subjects: ['General Intelligence', 'English Language', 'Quantitative Aptitude', 'General Awareness'],
        isPremium: true,
        price: 299,
        metadata: { type: 'mock', difficulty: 'hard' }
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
      },
      {
        id: 'reasoning-paper-1',
        name: 'General Intelligence Practice',
        description: 'Practice questions for General Intelligence',
        duration: 60,
        questions: 50,
        subjects: ['General Intelligence'],
        isPremium: false,
        price: 0,
        metadata: { type: 'practice', subject: 'reasoning' }
      },
      {
        id: 'maths-geometry-paper-1',
        name: 'Maths Geometry Practice',
        description: 'Practice questions for Geometry',
        duration: 60,
        questions: 50,
        subjects: ['Quantitative Aptitude'],
        isPremium: false,
        price: 0,
        metadata: { type: 'practice', subject: 'geometry' }
      }
    ]);
  }

  private initializeQuestionData() {
    // Mock test questions
    this.questionData.set('ssc-cgl-mock-mock-paper-1', [
      {
        id: 'q1',
        questionEn: 'What is the capital of India?',
        questionHi: 'भारत की राजधानी क्या है?',
        optionsEn: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'],
        optionsHi: ['मुंबई', 'दिल्ली', 'कोलकाता', 'चेन्नई'],
        correctAnswerIndex: 1,
        explanationEn: 'Delhi is the capital of India. It is located in northern India and serves as the seat of the Government of India.',
        explanationHi: 'दिल्ली भारत की राजधानी है। यह उत्तरी भारत में स्थित है और भारत सरकार की सीट के रूप में कार्य करता है।',
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'easy',
        subject: 'general-awareness',
        topic: 'geography'
      },
      {
        id: 'q2',
        questionEn: 'What is 15 + 25?',
        questionHi: '15 + 25 क्या है?',
        optionsEn: ['35', '40', '45', '50'],
        optionsHi: ['35', '40', '45', '50'],
        correctAnswerIndex: 1,
        explanationEn: '15 + 25 = 40. This is a basic arithmetic addition problem.',
        explanationHi: '15 + 25 = 40. यह एक बुनियादी अंकगणितीय जोड़ की समस्या है।',
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'easy',
        subject: 'quantitative-aptitude',
        topic: 'arithmetic'
      }
    ]);

    // Add questions for other mock tests
    this.questionData.set('ssc-cgl-mock-mock-paper-2', [
      {
        id: 'q1',
        questionEn: 'Who wrote "Romeo and Juliet"?',
        questionHi: '"रोमियो और जूलियट" किसने लिखा?',
        optionsEn: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
        optionsHi: ['चार्ल्स डिकेंस', 'विलियम शेक्सपियर', 'जेन ऑस्टेन', 'मार्क ट्वेन'],
        correctAnswerIndex: 1,
        explanationEn: 'William Shakespeare wrote "Romeo and Juliet", one of his most famous tragedies.',
        explanationHi: 'विलियम शेक्सपियर ने "रोमियो और जूलियट" लिखा, जो उनकी सबसे प्रसिद्ध त्रासदियों में से एक है।',
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'medium',
        subject: 'english-language',
        topic: 'literature'
      }
    ]);

    this.questionData.set('ssc-cgl-mock-mock-paper-3', [
      {
        id: 'q1',
        questionEn: 'What is the square root of 64?',
        questionHi: '64 का वर्गमूल क्या है?',
        optionsEn: ['6', '7', '8', '9'],
        optionsHi: ['6', '7', '8', '9'],
        correctAnswerIndex: 2,
        explanationEn: 'The square root of 64 is 8, because 8 × 8 = 64.',
        explanationHi: '64 का वर्गमूल 8 है, क्योंकि 8 × 8 = 64।',
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'easy',
        subject: 'quantitative-aptitude',
        topic: 'arithmetic'
      }
    ]);

    this.questionData.set('ssc-cgl-mock-mock-paper-4', [
      {
        id: 'q1',
        questionEn: 'Which planetsssss is known as the Red Planet?',
        questionHi: 'किस ग्रह को लाल ग्रह के रूप में जाना जाता है?',
        optionsEn: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        optionsHi: ['वीनस', 'मंगल', 'बृहस्पति', 'शनि'],
        correctAnswerIndex: 1,
        explanationEn: 'Mars is known as the Red Planet due to its reddish appearance caused by iron oxide on its surface.',
        explanationHi: 'मंगल को लाल ग्रह के रूप में जाना जाता है क्योंकि इसकी सतह पर आयरन ऑक्साइड के कारण इसका रंग लाल दिखाई देता है।',
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'easy',
        subject: 'general-awareness',
        topic: 'science'
      }
    ]);

    this.questionData.set('ssc-cgl-mock-mock-paper-5', [
      {
        id: 'q1',
        questionEn: 'What is the next number in the series: 2, 4, 8, 16, ?',
        questionHi: 'श्रृंखला में अगली संख्या क्या है: 2, 4, 8, 16, ?',
        optionsEn: ['24', '32', '20', '28'],
        optionsHi: ['24', '32', '20', '28'],
        correctAnswerIndex: 1,
        explanationEn: 'The series follows the pattern of multiplying by 2: 2×2=4, 4×2=8, 8×2=16, 16×2=32.',
        explanationHi: 'श्रृंखला 2 से गुणा करने के पैटर्न का अनुसरण करती है: 2×2=4, 4×2=8, 8×2=16, 16×2=32।',
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'medium',
        subject: 'general-intelligence',
        topic: 'series'
      }
    ]);

    // PYQ questions
    this.questionData.set('ssc-cgl-pyq-2024-paper-1', [
      {
        id: 'q1',
        questionEn: 'What is the area of a circle with radius 7 cm?',
        questionHi: 'त्रिज्या 7 सेमी वाले वृत्त का क्षेत्रफल क्या है?',
        optionsEn: ['154 cm²', '44 cm²', '22 cm²', '88 cm²'],
        optionsHi: ['154 सेमी²', '44 सेमी²', '22 सेमी²', '88 सेमी²'],
        correctAnswerIndex: 0,
        explanationEn: 'Area of circle = πr² = π × 7² = 49π = 154 cm² (using π = 22/7)',
        explanationHi: 'वृत्त का क्षेत्रफल = πr² = π × 7² = 49π = 154 सेमी² (π = 22/7 का उपयोग करके)',
        marks: 1,
        negativeMarks: 0.25,
        difficulty: 'medium',
        subject: 'quantitative-aptitude',
        topic: 'geometry'
      }
    ]);

    // Practice questions
    this.questionData.set('ssc-cgl-practice-english-grammar-paper-1', [
      {
        id: 'q1',
        questionEn: 'Choose the correct form: "I _____ to school every day."',
        questionHi: 'सही रूप चुनें: "मैं हर दिन स्कूल _____ जाता हूं।"',
        optionsEn: ['go', 'goes', 'going', 'went'],
        optionsHi: ['go', 'goes', 'going', 'went'],
        correctAnswerIndex: 0,
        explanationEn: 'The correct form is "go" for first person singular present tense.',
        explanationHi: 'पहले व्यक्ति एकवचन वर्तमान काल के लिए सही रूप "go" है।',
        marks: 1,
        negativeMarks: 0.25,
        difficulty: 'easy',
        subject: 'english-language',
        topic: 'grammar'
      }
    ]);
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
