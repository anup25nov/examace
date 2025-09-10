// Service to handle dynamic exam configurations
export interface ExamTypeConfig {
  id: string;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  logo?: string;
  stats: {
    enrolled: string;
    tests: string;
  };
  sections: {
    pyq: {
      enabled: boolean;
      years: string[];
      defaultYear: string;
    };
    mock: {
      enabled: boolean;
      freeCount: number;
      premiumCount: number;
    };
    practice: {
      enabled: boolean;
      comingSoon: boolean;
      subjects: string[];
    };
  };
  tabOrder: ('pyq' | 'mock' | 'practice')[];
}

export class ExamConfigService {
  private static instance: ExamConfigService;
  private configs: Map<string, ExamTypeConfig> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  static getInstance(): ExamConfigService {
    if (!ExamConfigService.instance) {
      ExamConfigService.instance = new ExamConfigService();
    }
    return ExamConfigService.instance;
  }

  private initializeConfigs(): void {
    // SSC CGL Configuration
    this.configs.set('ssc-cgl', {
      id: 'ssc-cgl',
      name: 'SSC CGL',
      fullName: 'Staff Selection Commission Combined Graduate Level',
      icon: 'BookOpen',
      color: 'from-blue-500 to-blue-600',
      logo: '/logos/alternate_image.png',
      stats: { enrolled: '2.5M+', tests: '150+' },
      sections: {
        pyq: {
          enabled: true,
          years: ['2024', '2023', '2022', '2021', '2020'],
          defaultYear: '2024'
        },
        mock: {
          enabled: true,
          freeCount: 2,
          premiumCount: 2
        },
        practice: {
          enabled: false,
          comingSoon: true,
          subjects: ['Quantitative Aptitude', 'English Language', 'General Intelligence', 'General Awareness']
        }
      },
      tabOrder: ['pyq', 'mock', 'practice']
    });

    // SSC MTS Configuration
    this.configs.set('ssc-mts', {
      id: 'ssc-mts',
      name: 'SSC MTS',
      fullName: 'Staff Selection Commission Multi Tasking Staff',
      icon: 'Users',
      color: 'from-green-500 to-green-600',
      logo: '/logos/alternate_image.png',
      stats: { enrolled: '1.8M+', tests: '120+' },
      sections: {
        pyq: {
          enabled: true,
          years: ['2024', '2023', '2022'],
          defaultYear: '2024'
        },
        mock: {
          enabled: true,
          freeCount: 1,
          premiumCount: 1
        },
        practice: {
          enabled: false,
          comingSoon: true,
          subjects: ['General Intelligence', 'General Awareness', 'English Language', 'Numerical Aptitude']
        }
      },
      tabOrder: ['pyq', 'mock', 'practice']
    });

    // Railway Configuration
    this.configs.set('railway', {
      id: 'railway',
      name: 'Railway',
      fullName: 'Railway Recruitment Board Examinations',
      icon: 'TrendingUp',
      color: 'from-purple-500 to-purple-600',
      logo: '/logos/alternate_image.png',
      stats: { enrolled: '3.2M+', tests: '200+' },
      sections: {
        pyq: {
          enabled: true,
          years: ['2024', '2023', '2022', '2021'],
          defaultYear: '2024'
        },
        mock: {
          enabled: true,
          freeCount: 1,
          premiumCount: 1
        },
        practice: {
          enabled: false,
          comingSoon: true,
          subjects: ['Mathematics', 'General Intelligence', 'General Awareness', 'Current Affairs']
        }
      },
      tabOrder: ['pyq', 'mock', 'practice']
    });

    // Bank PO Configuration
    this.configs.set('bank-po', {
      id: 'bank-po',
      name: 'Bank PO',
      fullName: 'Bank Probationary Officer',
      icon: 'Trophy',
      color: 'from-orange-500 to-orange-600',
      logo: '/logos/alternate_image.png',
      stats: { enrolled: '1.9M+', tests: '180+' },
      sections: {
        pyq: {
          enabled: true,
          years: ['2024', '2023', '2022', '2021', '2020'],
          defaultYear: '2024'
        },
        mock: {
          enabled: true,
          freeCount: 1,
          premiumCount: 1
        },
        practice: {
          enabled: false,
          comingSoon: true,
          subjects: ['Quantitative Aptitude', 'English Language', 'Reasoning Ability', 'General Awareness']
        }
      },
      tabOrder: ['pyq', 'mock', 'practice']
    });

    // Airforce Configuration
    this.configs.set('airforce', {
      id: 'airforce',
      name: 'Airforce',
      fullName: 'Indian Air Force Group X & Y',
      icon: 'Brain',
      color: 'from-red-500 to-red-600',
      logo: '/logos/alternate_image.png',
      stats: { enrolled: '850K+', tests: '90+' },
      sections: {
        pyq: {
          enabled: true,
          years: ['2024', '2023', '2022'],
          defaultYear: '2024'
        },
        mock: {
          enabled: true,
          freeCount: 1,
          premiumCount: 1
        },
        practice: {
          enabled: false,
          comingSoon: true,
          subjects: ['Mathematics', 'Physics', 'Chemistry', 'English', 'General Awareness']
        }
      },
      tabOrder: ['pyq', 'mock', 'practice']
    });
  }

  /**
   * Get configuration for a specific exam
   */
  getExamConfig(examId: string): ExamTypeConfig | null {
    return this.configs.get(examId) || null;
  }

  /**
   * Get all available exam configurations
   */
  getAllExamConfigs(): ExamTypeConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get available exam IDs
   */
  getAvailableExamIds(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Check if a section is enabled for an exam
   */
  isSectionEnabled(examId: string, section: 'pyq' | 'mock' | 'practice'): boolean {
    const config = this.getExamConfig(examId);
    if (!config) return false;

    switch (section) {
      case 'pyq':
        return config.sections.pyq.enabled;
      case 'mock':
        return config.sections.mock.enabled;
      case 'practice':
        return config.sections.practice.enabled;
      default:
        return false;
    }
  }

  /**
   * Get tab order for an exam
   */
  getTabOrder(examId: string): ('pyq' | 'mock' | 'practice')[] {
    const config = this.getExamConfig(examId);
    return config?.tabOrder || ['pyq', 'mock', 'practice'];
  }

  /**
   * Get default year for PYQ section
   */
  getDefaultYear(examId: string): string {
    const config = this.getExamConfig(examId);
    return config?.sections.pyq.defaultYear || '2024';
  }

  /**
   * Add or update exam configuration
   */
  setExamConfig(examId: string, config: ExamTypeConfig): void {
    this.configs.set(examId, config);
  }

  /**
   * Remove exam configuration
   */
  removeExamConfig(examId: string): boolean {
    return this.configs.delete(examId);
  }
}

// Export singleton instance
export const examConfigService = ExamConfigService.getInstance();
