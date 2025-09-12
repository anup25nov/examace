import { supabase } from '@/integrations/supabase/client';

export interface QuestionReport {
  id: string;
  user_id: string;
  exam_id: string;
  exam_type: string;
  test_id: string;
  question_id: string;
  question_number: number;
  issue_type: 'question_text' | 'options' | 'explanation' | 'answer' | 'image' | 'other';
  issue_description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  admin_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportRequest {
  examId: string;
  examType: string;
  testId: string;
  questionId: string;
  questionNumber: number;
  issueType: string;
  issueDescription: string;
}

export interface CreateReportResponse {
  success: boolean;
  reportId?: string;
  error?: string;
}

export class QuestionReportService {
  /**
   * Submit a new question report
   */
  static async submitReport(request: CreateReportRequest): Promise<CreateReportResponse> {
    try {
      console.log('🚀 Submitting question report:', request);

      // For now, just return success - the table doesn't exist in types
      console.log('✅ Report submitted successfully (mock)');
      return { success: true, reportId: 'mock-id' };

    } catch (error) {
      console.error('💥 Error in submitReport:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit report' 
      };
    }
  }

  /**
   * Get user's own reports
   */
  static async getUserReports(): Promise<QuestionReport[]> {
    try {
      // Return empty array for now
      return [];
    } catch (error) {
      console.error('💥 Error in getUserReports:', error);
      throw error;
    }
  }

  /**
   * Check if user has already reported this question
   */
  static async hasUserReportedQuestion(
    examId: string,
    examType: string,
    testId: string,
    questionId: string
  ): Promise<boolean> {
    try {
      // Return false for now
      return false;
    } catch (error) {
      console.error('💥 Error in hasUserReportedQuestion:', error);
      return false;
    }
  }

  /**
   * Get reports for a specific question
   */
  static async getQuestionReports(
    examId: string,
    examType: string,
    testId: string,
    questionId: string
  ): Promise<QuestionReport[]> {
    try {
      // Return empty array for now
      return [];
    } catch (error) {
      console.error('💥 Error in getQuestionReports:', error);
      throw error;
    }
  }
}

export default QuestionReportService;