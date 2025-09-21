import { comprehensiveStatsService } from './comprehensiveStatsService';
import { supabase } from '@/integrations/supabase/client';

export interface TestSubmissionData {
  examId: string;
  testType: 'pyq' | 'mock' | 'practice';
  testId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  answers?: any;
  topicId?: string;
}

export interface TestSubmissionResult {
  success: boolean;
  message?: string;
  error?: string;
  stats?: {
    totalTests: number;
    bestScore: number;
    averageScore: number;
    last10Average: number;
  };
}

class TestSubmissionService {
  /**
   * Submit a test attempt and update comprehensive statistics
   */
  async submitTestAttempt(submission: TestSubmissionData): Promise<TestSubmissionResult> {
    try {
      // Submit to comprehensive stats service
      const { data: attemptData, error: attemptError } = await comprehensiveStatsService.submitTestAttempt({
        examId: submission.examId,
        testType: submission.testType,
        testId: submission.testId,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        correctAnswers: submission.correctAnswers,
        timeTaken: submission.timeTaken,
        answers: submission.answers
      });

      if (attemptError) {
        console.error('Error submitting test attempt:', attemptError);
        return {
          success: false,
          error: attemptError.message || 'Failed to submit test attempt'
        };
      }

      // Also update test_completions table for UI consistency
      await this.updateTestCompletions(submission);

      // Get updated stats
      const { data: updatedStats } = await comprehensiveStatsService.getComprehensiveStats(submission.examId);
      
      return {
        success: true,
        message: 'Test submitted successfully',
        stats: updatedStats ? {
          totalTests: updatedStats.totalTests,
          bestScore: updatedStats.bestScore,
          averageScore: updatedStats.averageScore,
          last10Average: updatedStats.last10Average
        } : undefined
      };
    } catch (error) {
      console.error('Error in submitTestAttempt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update test_completions table for UI consistency
   */
  private async updateTestCompletions(submission: TestSubmissionData): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return;

      const completionKey = submission.topicId 
        ? `${submission.testType}-${submission.testId}-${submission.topicId}`
        : `${submission.testType}-${submission.testId}`;

      // Upsert test completion
      const { error } = await supabase
        .from('test_completions')
        .upsert({
          user_id: user.id,
          exam_id: submission.examId,
          test_type: submission.testType,
          test_id: submission.testId,
          topic_id: submission.topicId,
          score: submission.score,
          total_questions: submission.totalQuestions,
          correct_answers: submission.correctAnswers,
          time_taken: submission.timeTaken,
          completed_at: new Date().toISOString(),
          answers: submission.answers
        }, {
          onConflict: 'user_id,exam_id,test_type,test_id,topic_id'
        });

      if (error) {
        console.error('Error updating test completions:', error);
      }
    } catch (error) {
      console.error('Error in updateTestCompletions:', error);
    }
  }

  /**
   * Get current user
   */
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Get comprehensive statistics for an exam
   */
  async getExamStats(examId: string) {
    return await comprehensiveStatsService.getComprehensiveStats(examId);
  }

  /**
   * Get test attempts for an exam
   */
  async getTestAttempts(examId: string, limit = 20) {
    return await comprehensiveStatsService.getTestAttempts(examId, limit);
  }
}

// Export singleton instance
export const testSubmissionService = new TestSubmissionService();
export default testSubmissionService;
