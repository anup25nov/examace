import { supabase } from './supabase';

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

export interface ReportStats {
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  rejected_reports: number;
  reports_by_issue_type: Record<string, number>;
  reports_by_exam: Record<string, number>;
}

export interface AdminReport extends QuestionReport {
  user_email?: string;
}

export class QuestionReportService {
  /**
   * Submit a new question report
   */
  static async submitReport(request: CreateReportRequest): Promise<CreateReportResponse> {
    try {
      console.log('🚀 Submitting question report:', request);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('question_reports')
        .insert({
          user_id: user.id,
          exam_id: request.examId,
          exam_type: request.examType,
          test_id: request.testId,
          question_id: request.questionId,
          question_number: request.questionNumber,
          issue_type: request.issueType,
          issue_description: request.issueDescription,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error submitting report:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Report submitted successfully:', data);
      return { success: true, reportId: data.id };

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .rpc('get_user_question_reports', { p_user_id: user.id });

      if (error) {
        console.error('❌ Error fetching user reports:', error);
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('💥 Error in getUserReports:', error);
      throw error;
    }
  }

  /**
   * Get report statistics (admin only)
   */
  static async getReportStats(): Promise<ReportStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_question_report_stats');

      if (error) {
        console.error('❌ Error fetching report stats:', error);
        throw new Error(error.message);
      }

      return data[0] || {
        total_reports: 0,
        pending_reports: 0,
        resolved_reports: 0,
        rejected_reports: 0,
        reports_by_issue_type: {},
        reports_by_exam: {}
      };

    } catch (error) {
      console.error('💥 Error in getReportStats:', error);
      throw error;
    }
  }

  /**
   * Get reports for admin panel
   */
  static async getAdminReports(
    status?: string,
    examId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AdminReport[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_admin_question_reports', {
          p_status: status || null,
          p_exam_id: examId || null,
          p_limit: limit,
          p_offset: offset
        });

      if (error) {
        console.error('❌ Error fetching admin reports:', error);
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('💥 Error in getAdminReports:', error);
      throw error;
    }
  }

  /**
   * Update report status (admin only)
   */
  static async updateReportStatus(
    reportId: string,
    status: string,
    adminNotes?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('update_question_report_status', {
          p_report_id: reportId,
          p_status: status,
          p_admin_notes: adminNotes || null
        });

      if (error) {
        console.error('❌ Error updating report status:', error);
        return { success: false, error: error.message };
      }

      return data;

    } catch (error) {
      console.error('💥 Error in updateReportStatus:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update report status' 
      };
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('question_reports')
        .select('id')
        .eq('user_id', user.id)
        .eq('exam_id', examId)
        .eq('exam_type', examType)
        .eq('test_id', testId)
        .eq('question_id', questionId)
        .limit(1);

      if (error) {
        console.error('❌ Error checking if user reported:', error);
        return false;
      }

      return data && data.length > 0;

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
      const { data, error } = await supabase
        .from('question_reports')
        .select('*')
        .eq('exam_id', examId)
        .eq('exam_type', examType)
        .eq('test_id', testId)
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching question reports:', error);
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('💥 Error in getQuestionReports:', error);
      throw error;
    }
  }
}

export default QuestionReportService;
