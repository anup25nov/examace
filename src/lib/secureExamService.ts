/**
 * Secure Exam Service
 * Provides exam configuration using centralized data source
 */

import { examDataService, ExamConfig } from '@/data/examData';

export interface SecureExamConfig extends ExamConfig {
  examPattern?: any;
}

class SecureExamService {
  private static instance: SecureExamService;

  private constructor() {}

  static getInstance(): SecureExamService {
    if (!SecureExamService.instance) {
      SecureExamService.instance = new SecureExamService();
    }
    return SecureExamService.instance;
  }

  /**
   * Get all available exams
   */
  getAllExams(): SecureExamConfig[] {
    return examDataService.getAllExams() as SecureExamConfig[];
  }

  /**
   * Get exam configuration by ID
   */
  getExamConfig(examId: string): SecureExamConfig | null {
    return examDataService.getExamConfig(examId) as SecureExamConfig | null;
  }

  /**
   * Get section configuration
   */
  getSectionConfig(examId: string, sectionId: string) {
    const exam = this.getExamConfig(examId);
    if (!exam) return null;
    
    return exam.sections.find(section => section.id === sectionId) || null;
  }

  /**
   * Check if exam exists
   */
  hasExam(examId: string): boolean {
    return examDataService.getExamConfig(examId) !== null;
  }

  /**
   * Get exam metadata
   */
  getExamMetadata(examId: string) {
    const exam = this.getExamConfig(examId);
    return exam?.metadata || null;
  }
}

export const secureExamService = SecureExamService.getInstance();
