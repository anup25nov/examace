/**
 * Fixed Test System Service
 * Complete test system with all scenarios handled
 */

import { supabase } from '@/integrations/supabase/client';
import { comprehensiveStatsService } from './comprehensiveStatsService';
import { errorHandlingService } from './errorHandlingService';
import { securityService } from './securityService';

export interface TestSubmission {
  examId: string;
  testType: 'pyq' | 'mock' | 'practice';
  testId: string;
  topicId?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  answers: any;
}

export interface TestAvailability {
  available: boolean;
  reason?: string;
  membershipRequired?: boolean;
  planRequired?: string;
}

export interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  testAttemptId?: string;
}

export class TestSystemFixed {
  private static instance: TestSystemFixed;

  public static getInstance(): TestSystemFixed {
    if (!TestSystemFixed.instance) {
      TestSystemFixed.instance = new TestSystemFixed();
    }
    return TestSystemFixed.instance;
  }

  /**
   * Check if user can take a specific test
   */
  async checkTestAvailability(
    userId: string,
    examId: string,
    testType: 'pyq' | 'mock' | 'practice',
    testId: string
  ): Promise<TestAvailability> {
    try {
      // Validate input
      if (!userId || !examId || !testType || !testId) {
        return {
          available: false,
          reason: 'Missing required parameters'
        };
      }

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('id, membership_plan, membership_expiry')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return {
          available: false,
          reason: 'User not found'
        };
      }

      // Check membership status
      const isMembershipActive = user.membership_expiry && 
        new Date(user.membership_expiry) > new Date();

      // Check if test type requires membership
      if (testType === 'mock' || testType === 'pyq') {
        if (!isMembershipActive) {
          return {
            available: false,
            reason: 'Active membership required for this test type',
            membershipRequired: true,
            planRequired: 'pro'
          };
        }
      }

      // Check if user has already completed this test
      const { data: existingCompletion, error: completionError } = await supabase
        .from('test_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('exam_id', examId)
        .eq('test_type', testType)
        .eq('test_id', testId)
        .eq('topic_id', testType === 'practice' ? testId : null)
        .single();

      if (completionError && completionError.code !== 'PGRST116') {
        return {
          available: false,
          reason: 'Error checking test completion status'
        };
      }

      if (existingCompletion) {
        return {
          available: false,
          reason: 'Test already completed'
        };
      }

      // Check if there's an incomplete attempt
      const { data: incompleteAttempt, error: attemptError } = await supabase
        .from('test_attempts')
        .select('id, status')
        .eq('user_id', userId)
        .eq('exam_id', examId)
        .eq('test_type', testType)
        .eq('test_id', testId)
        .eq('status', 'in_progress')
        .single();

      if (attemptError && attemptError.code !== 'PGRST116') {
        return {
          available: false,
          reason: 'Error checking incomplete attempts'
        };
      }

      if (incompleteAttempt) {
        return {
          available: false,
          reason: 'Test already in progress'
        };
      }

      return {
        available: true
      };

    } catch (error) {
      errorHandlingService.handleError(error, {
        action: 'check_test_availability',
        resource: 'test_system',
        userId
      });
      return {
        available: false,
        reason: 'System error occurred'
      };
    }
  }

  /**
   * Start a test attempt
   */
  async startTestAttempt(
    userId: string,
    examId: string,
    testType: 'pyq' | 'mock' | 'practice',
    testId: string,
    topicId?: string
  ): Promise<TestResult> {
    try {
      // Check availability first
      const availability = await this.checkTestAvailability(userId, examId, testType, testId);
      if (!availability.available) {
        return {
          success: false,
          error: availability.reason
        };
      }

      // Check permissions
      const permission = await securityService.checkPermissions(userId, 'test', 'take');
      if (!permission.allowed) {
        return {
          success: false,
          error: permission.reason || 'Permission denied'
        };
      }

      // Create test attempt record
      const { data: testAttempt, error: attemptError } = await supabase
        .from('test_attempts')
        .insert({
          user_id: userId,
          exam_id: examId,
          test_type: testType,
          test_id: testId,
          score: 0,
          total_questions: 0,
          correct_answers: 0,
          time_taken: 0,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (attemptError) {
        return {
          success: false,
          error: 'Failed to create test attempt'
        };
      }

      // Log security event
      await securityService.logSecurityEvent({
        userId,
        action: 'test_started',
        resource: 'test_system',
        success: true,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: testAttempt,
        testAttemptId: testAttempt.id
      };

    } catch (error) {
      errorHandlingService.handleError(error, {
        action: 'start_test_attempt',
        resource: 'test_system',
        userId
      });
      return {
        success: false,
        error: 'System error occurred'
      };
    }
  }

  /**
   * Submit test attempt with complete validation
   */
  async submitTestAttempt(submission: TestSubmission): Promise<TestResult> {
    try {
      // Validate submission data
      const validation = this.validateTestSubmission(submission);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Get current user using custom authentication
      const userId = localStorage.getItem('userId');
      const userPhone = localStorage.getItem('userPhone');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      
      if (!userId || !userPhone || isAuthenticated !== 'true') {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }
      
      const user = { id: userId, phone: userPhone };

      // Check if test is still available
      const availability = await this.checkTestAvailability(
        user.id,
        submission.examId,
        submission.testType,
        submission.testId
      );

      if (!availability.available) {
        return {
          success: false,
          error: availability.reason
        };
      }

      // Find existing incomplete attempt
      const { data: existingAttempt, error: findError } = await supabase
        .from('test_attempts')
        .select('id')
        .eq('user_id', user.id)
        .eq('exam_id', submission.examId)
        .eq('test_type', submission.testType)
        .eq('test_id', submission.testId)
        .eq('status', 'in_progress')
        .single();

      if (findError && findError.code !== 'PGRST116') {
        return {
          success: false,
          error: 'Error finding test attempt'
        };
      }

      let testAttemptId: string;

      if (existingAttempt) {
        // Update existing attempt
        const { data: updatedAttempt, error: updateError } = await supabase
          .from('test_attempts')
          .update({
            score: submission.score,
            total_questions: submission.totalQuestions,
            correct_answers: submission.correctAnswers,
            time_taken: submission.timeTaken,
            answers: submission.answers,
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAttempt.id)
          .select()
          .single();

        if (updateError) {
          return {
            success: false,
            error: 'Failed to update test attempt'
          };
        }

        testAttemptId = updatedAttempt.id;
      } else {
        // Create new attempt
        const { data: newAttempt, error: createError } = await supabase
          .from('test_attempts')
          .insert({
            user_id: user.id,
            exam_id: submission.examId,
            test_type: submission.testType,
            test_id: submission.testId,
            score: submission.score,
            total_questions: submission.totalQuestions,
            correct_answers: submission.correctAnswers,
            time_taken: submission.timeTaken,
            answers: submission.answers,
            status: 'completed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          return {
            success: false,
            error: 'Failed to create test attempt'
          };
        }

        testAttemptId = newAttempt.id;
      }

      // Update test completion
      await supabase.rpc('upsert_test_completion_simple', {
        p_user_id: user.id,
        p_exam_id: submission.examId,
        p_test_type: submission.testType,
        p_test_id: submission.testId,
        p_topic_id: submission.topicId || null,
        p_score: submission.score,
        p_total_questions: submission.totalQuestions,
        p_correct_answers: submission.correctAnswers,
        p_time_taken: submission.timeTaken,
        p_answers: submission.answers
      });

      // Update exam stats
      await supabase.rpc('update_exam_stats_properly', {
        user_uuid: user.id,
        exam_name: submission.examId,
        new_score: submission.score
      });

      // Update user streak
      await supabase.rpc('update_user_streak', {
        user_uuid: user.id
      });

      // Log security event
      await securityService.logSecurityEvent({
        userId: user.id,
        action: 'test_completed',
        resource: 'test_system',
        success: true,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          testAttemptId,
          score: submission.score,
          totalQuestions: submission.totalQuestions,
          correctAnswers: submission.correctAnswers,
          timeTaken: submission.timeTaken
        }
      };

    } catch (error) {
      errorHandlingService.handleError(error, {
        action: 'submit_test_attempt',
        resource: 'test_system'
      });
      return {
        success: false,
        error: 'System error occurred'
      };
    }
  }

  /**
   * Get test results for a user
   */
  async getTestResults(
    userId: string,
    examId: string,
    limit: number = 20
  ): Promise<TestResult> {
    try {
      const { data: results, error } = await supabase
        .from('test_completions')
        .select(`
          id,
          test_type,
          test_id,
          topic_id,
          score,
          total_questions,
          correct_answers,
          time_taken,
          completed_at,
          answers
        `)
        .eq('user_id', userId)
        .eq('exam_id', examId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: 'Failed to fetch test results'
        };
      }

      return {
        success: true,
        data: results || []
      };

    } catch (error) {
      errorHandlingService.handleError(error, {
        action: 'get_test_results',
        resource: 'test_system',
        userId
      });
      return {
        success: false,
        error: 'System error occurred'
      };
    }
  }

  /**
   * Get test statistics for a user
   */
  async getTestStatistics(userId: string, examId: string): Promise<TestResult> {
    try {
      const { data: stats, error } = await comprehensiveStatsService.getComprehensiveStats(examId);
      
      if (error) {
        return {
          success: false,
          error: 'Failed to fetch test statistics'
        };
      }

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      errorHandlingService.handleError(error, {
        action: 'get_test_statistics',
        resource: 'test_system',
        userId
      });
      return {
        success: false,
        error: 'System error occurred'
      };
    }
  }

  /**
   * Validate test submission data
   */
  private validateTestSubmission(submission: TestSubmission): { valid: boolean; error?: string } {
    if (!submission.examId || !submission.testType || !submission.testId) {
      return {
        valid: false,
        error: 'Missing required fields'
      };
    }

    if (submission.score < 0 || submission.score > 100) {
      return {
        valid: false,
        error: 'Invalid score range'
      };
    }

    if (submission.totalQuestions <= 0) {
      return {
        valid: false,
        error: 'Invalid total questions count'
      };
    }

    if (submission.correctAnswers < 0 || submission.correctAnswers > submission.totalQuestions) {
      return {
        valid: false,
        error: 'Invalid correct answers count'
      };
    }

    if (submission.timeTaken < 0) {
      return {
        valid: false,
        error: 'Invalid time taken'
      };
    }

    if (!['pyq', 'mock', 'practice'].includes(submission.testType)) {
      return {
        valid: false,
        error: 'Invalid test type'
      };
    }

    return { valid: true };
  }

  /**
   * Get test attempt by ID
   */
  async getTestAttempt(attemptId: string): Promise<TestResult> {
    try {
      const { data: attempt, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (error) {
        return {
          success: false,
          error: 'Test attempt not found'
        };
      }

      return {
        success: true,
        data: attempt
      };

    } catch (error) {
      errorHandlingService.handleError(error, {
        action: 'get_test_attempt',
        resource: 'test_system'
      });
      return {
        success: false,
        error: 'System error occurred'
      };
    }
  }

  /**
   * Resume incomplete test attempt
   */
  async resumeTestAttempt(attemptId: string): Promise<TestResult> {
    try {
      const { data: attempt, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('id', attemptId)
        .eq('status', 'in_progress')
        .single();

      if (error) {
        return {
          success: false,
          error: 'No incomplete test attempt found'
        };
      }

      return {
        success: true,
        data: attempt
      };

    } catch (error) {
      errorHandlingService.handleError(error, {
        action: 'resume_test_attempt',
        resource: 'test_system'
      });
      return {
        success: false,
        error: 'System error occurred'
      };
    }
  }
}

export const testSystemFixed = TestSystemFixed.getInstance();