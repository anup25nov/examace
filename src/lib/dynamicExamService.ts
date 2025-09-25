// Dynamic Exam Service - Centralized exam management
import { supabase } from '@/integrations/supabase/client';

export interface ExamSection {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  enabled: boolean;
  order: number;
  config: {
    // PYQ specific config
    years?: string[];
    defaultYear?: string;
    // Mock specific config
    freeCount?: number;
    premiumCount?: number;
    // Practice specific config
    subjects?: string[];
    comingSoon?: boolean;
  };
}

export interface ExamConfig {
  id: string;
  name: string;
  fullName: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  logo: string;
  bannerImage?: string;
  stats: {
    enrolled: string;
    tests: string;
    questions: string;
  };
  sections: ExamSection[];
  isActive: boolean;
  isPremium: boolean;
  examPattern: {
    totalQuestions: number;
    duration: number; // in minutes
    subjects: string[];
    markingScheme: {
      correct: number;
      incorrect: number;
      unattempted: number;
    };
  };
  metadata: {
    created_at: string;
    updated_at: string;
    version: string;
  };
}

export interface TestData {
  id: string;
  name: string;
  description: string;
  duration: number;
  questions: number;
  subjects: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  isPremium: boolean;
  price: number;
  order: number;
  metadata: any;
}

export interface QuestionData {
  id: string;
  questionEn: string;
  questionHi: string;
  options: string[] | Array<{text: string; image?: string}>;
  correct: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  marks: number;
  negativeMarks: number;
  duration: number; // in seconds
  explanation?: string;
  questionImage?: string;
  explanationImage?: string;
  metadata?: any;
}

export class DynamicExamService {
  private static instance: DynamicExamService;
  private examConfigs: Map<string, ExamConfig> = new Map();
  private testDataCache: Map<string, TestData[]> = new Map();
  private questionDataCache: Map<string, QuestionData[]> = new Map();

  private constructor() {
    this.initializeDefaultConfigs();
  }

  static getInstance(): DynamicExamService {
    if (!DynamicExamService.instance) {
      DynamicExamService.instance = new DynamicExamService();
    }
    return DynamicExamService.instance;
  }

  private initializeDefaultConfigs(): void {
    // SSC CGL Configuration
    this.examConfigs.set('ssc-cgl', {
      id: 'ssc-cgl',
      name: 'SSC CGL',
      fullName: 'Staff Selection Commission Combined Graduate Level',
      shortName: 'SSC CGL',
      description: 'Comprehensive preparation for SSC CGL examination',
      icon: 'BookOpen',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      logo: '/logos/ssc-cgl-logo.svg',
      bannerImage: '/logos/examace-logo.svg',
      stats: { enrolled: '2.5M+', tests: '150+', questions: '5000+' },
      sections: [
        {
          id: 'pyq',
          name: 'Previous Year Questions',
          displayName: 'PYQ',
          icon: 'FileText',
          color: 'warning',
          enabled: true,
          order: 1,
          config: {
            years: ['2024', '2023', '2022', '2021', '2020'],
            defaultYear: '2024'
          }
        },
        {
          id: 'mock',
          name: 'Full Mock Tests',
          displayName: 'Mock Tests',
          icon: 'Trophy',
          color: 'success',
          enabled: true,
          order: 2,
          config: {
            freeCount: 2,
            premiumCount: 2
          }
        },
        {
          id: 'practice',
          name: 'Practice Sets',
          displayName: 'Practice',
          icon: 'BookOpen',
          color: 'primary',
          enabled: false,
          order: 3,
          config: {
            subjects: ['Quantitative Aptitude', 'English Language', 'General Intelligence', 'General Awareness'],
            comingSoon: true
          }
        }
      ],
      isActive: true,
      isPremium: false,
      examPattern: {
        totalQuestions: 100,
        duration: 180,
        subjects: ['Quantitative Aptitude', 'English Language', 'General Intelligence', 'General Awareness'],
        markingScheme: { correct: 2, incorrect: -0.5, unattempted: 0 }
      },
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: '1.0.0'
      }
    });

    // Air Force Configuration
    this.examConfigs.set('airforce', {
      id: 'airforce',
      name: 'Air Force',
      fullName: 'Indian Air Force Airmen Group X & Y',
      shortName: 'IAF',
      description: 'Complete preparation for Indian Air Force Airmen recruitment',
      icon: 'Plane',
      color: 'sky',
      gradient: 'from-sky-500 to-sky-600',
      logo: '/logos/airforce-logo.svg',
      bannerImage: '/logos/examace-logo.svg',
      stats: { enrolled: '500K+', tests: '80+', questions: '2000+' },
      sections: [
        {
          id: 'pyq',
          name: 'Previous Year Questions',
          displayName: 'PYQ',
          icon: 'FileText',
          color: 'warning',
          enabled: true,
          order: 1,
          config: {
            years: ['2024', '2023', '2022', '2021'],
            defaultYear: '2024'
          }
        },
        {
          id: 'mock',
          name: 'Full Mock Tests',
          displayName: 'Mock Tests',
          icon: 'Trophy',
          color: 'success',
          enabled: true,
          order: 2,
          config: {
            freeCount: 1,
            premiumCount: 3
          }
        },
        {
          id: 'practice',
          name: 'Practice Sets',
          displayName: 'Practice',
          icon: 'BookOpen',
          color: 'primary',
          enabled: true,
          order: 3,
          config: {
            subjects: ['Mathematics', 'Physics', 'Chemistry', 'English', 'General Knowledge'],
            comingSoon: false
          }
        }
      ],
      isActive: true,
      isPremium: false,
      examPattern: {
        totalQuestions: 70,
        duration: 60,
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'English', 'General Knowledge'],
        markingScheme: { correct: 1, incorrect: -0.25, unattempted: 0 }
      },
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: '1.0.0'
      }
    });

    // Navy Configuration
    this.examConfigs.set('navy', {
      id: 'navy',
      name: 'Navy',
      fullName: 'Indian Navy Sailors Recruitment',
      shortName: 'Navy',
      description: 'Comprehensive preparation for Indian Navy Sailors recruitment',
      icon: 'Ship',
      color: 'blue',
      gradient: 'from-blue-600 to-blue-700',
      logo: '/logos/navy-logo.svg',
      bannerImage: '/logos/examace-logo.svg',
      stats: { enrolled: '300K+', tests: '60+', questions: '1500+' },
      sections: [
        {
          id: 'pyq',
          name: 'Previous Year Questions',
          displayName: 'PYQ',
          icon: 'FileText',
          color: 'warning',
          enabled: true,
          order: 1,
          config: {
            years: ['2024', '2023', '2022'],
            defaultYear: '2024'
          }
        },
        {
          id: 'mock',
          name: 'Full Mock Tests',
          displayName: 'Mock Tests',
          icon: 'Trophy',
          color: 'success',
          enabled: true,
          order: 2,
          config: {
            freeCount: 1,
            premiumCount: 2
          }
        },
        {
          id: 'practice',
          name: 'Practice Sets',
          displayName: 'Practice',
          icon: 'BookOpen',
          color: 'primary',
          enabled: false,
          order: 3,
          config: {
            subjects: ['Mathematics', 'Science', 'English', 'General Knowledge'],
            comingSoon: true
          }
        }
      ],
      isActive: true,
      isPremium: false,
      examPattern: {
        totalQuestions: 50,
        duration: 45,
        subjects: ['Mathematics', 'Science', 'English', 'General Knowledge'],
        markingScheme: { correct: 1, incorrect: -0.25, unattempted: 0 }
      },
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: '1.0.0'
      }
    });

    // Railway Configuration
    this.examConfigs.set('railway', {
      id: 'railway',
      name: 'Railway',
      fullName: 'Indian Railways Recruitment Board',
      shortName: 'Railway',
      description: 'Complete preparation for Railway recruitment examinations',
      icon: 'Train',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      logo: '/logos/railway-logo.svg',
      bannerImage: '/logos/examace-logo.svg',
      stats: { enrolled: '3.0M+', tests: '200+', questions: '4000+' },
      sections: [
        {
          id: 'pyq',
          name: 'Previous Year Questions',
          displayName: 'PYQ',
          icon: 'FileText',
          color: 'warning',
          enabled: true,
          order: 1,
          config: {
            years: ['2023', '2022', '2021'],
            defaultYear: '2023'
          }
        },
        {
          id: 'mock',
          name: 'Full Mock Tests',
          displayName: 'Mock Tests',
          icon: 'Trophy',
          color: 'success',
          enabled: true,
          order: 2,
          config: {
            freeCount: 1,
            premiumCount: 1
          }
        },
        {
          id: 'practice',
          name: 'Practice Sets',
          displayName: 'Practice',
          icon: 'BookOpen',
          color: 'primary',
          enabled: false,
          order: 3,
          config: {
            subjects: ['General Awareness', 'Mathematics', 'General Intelligence & Reasoning', 'General Science'],
            comingSoon: true
          }
        }
      ],
      isActive: true,
      isPremium: false,
      examPattern: {
        totalQuestions: 100,
        duration: 90,
        subjects: ['General Awareness', 'Mathematics', 'General Intelligence & Reasoning', 'General Science'],
        markingScheme: { correct: 1, incorrect: -0.25, unattempted: 0 }
      },
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  }

  // Get all available exams
  getAllExams(): ExamConfig[] {
    return Array.from(this.examConfigs.values()).filter(exam => exam.isActive);
  }

  // Get exam configuration by ID
  getExamConfig(examId: string): ExamConfig | null {
    return this.examConfigs.get(examId) || null;
  }

  // Get exam sections
  getExamSections(examId: string): ExamSection[] {
    const exam = this.getExamConfig(examId);
    return exam ? exam.sections.filter(section => section.enabled).sort((a, b) => a.order - b.order) : [];
  }

  // Get test data for a specific exam and section
  async getTestData(examId: string, sectionId: string): Promise<TestData[]> {
    const cacheKey = `${examId}-${sectionId}`;
    
    if (this.testDataCache.has(cacheKey)) {
      return this.testDataCache.get(cacheKey)!;
    }

    try {
      // For now, skip database and use static data directly
      // TODO: Implement database tables for exam_test_data and exam_questions
      const staticData = await this.loadStaticTestData(examId, sectionId);
      this.testDataCache.set(cacheKey, staticData);
      return staticData;
    } catch (error) {
      console.error('Error loading test data:', error);
      return [];
    }
  }

  // Load static test data as fallback - DISABLED FOR SECURITY
  private async loadStaticTestData(examId: string, sectionId: string): Promise<TestData[]> {
    console.warn('SECURITY: JSON loading disabled. Use secure services instead.');
    return [];
  }

  // Get question data for a specific test
  async getQuestionData(examId: string, sectionId: string, testId: string): Promise<QuestionData[]> {
    const cacheKey = `${examId}-${sectionId}-${testId}`;
    
    if (this.questionDataCache.has(cacheKey)) {
      return this.questionDataCache.get(cacheKey)!;
    }

    try {
      // For now, skip database and use static data directly
      // TODO: Implement database tables for exam_test_data and exam_questions
      const staticData = await this.loadStaticQuestionData(examId, sectionId, testId);
      this.questionDataCache.set(cacheKey, staticData);
      return staticData;
    } catch (error) {
      console.error('Error loading question data:', error);
      return [];
    }
  }

  // Load static question data as fallback - DISABLED FOR SECURITY
  private async loadStaticQuestionData(examId: string, sectionId: string, testId: string): Promise<QuestionData[]> {
    console.warn('SECURITY: JSON loading disabled. Use secure services instead.');
    return [];
  }

  // Add new exam configuration
  addExamConfig(config: ExamConfig): void {
    this.examConfigs.set(config.id, config);
  }

  // Update exam configuration
  updateExamConfig(examId: string, updates: Partial<ExamConfig>): boolean {
    const existing = this.examConfigs.get(examId);
    if (existing) {
      this.examConfigs.set(examId, { ...existing, ...updates });
      return true;
    }
    return false;
  }

  // Clear cache
  clearCache(): void {
    this.testDataCache.clear();
    this.questionDataCache.clear();
  }

  // Clear specific cache
  clearExamCache(examId: string): void {
    for (const key of this.testDataCache.keys()) {
      if (key.startsWith(examId)) {
        this.testDataCache.delete(key);
      }
    }
    for (const key of this.questionDataCache.keys()) {
      if (key.startsWith(examId)) {
        this.questionDataCache.delete(key);
      }
    }
  }
}

export const dynamicExamService = DynamicExamService.getInstance();
