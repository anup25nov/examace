import { supabase } from '@/integrations/supabase/client';

export interface ComprehensiveTestStats {
  totalTests: number;
  bestScore: number;
  averageScore: number; // Average of last 10 tests
  last10Average: number; // Explicit last 10 average
  totalScore: number;
  lastTestDate: string | null;
  testBreakdown: {
    pyq: {
      count: number;
      bestScore: number;
      averageScore: number;
    };
    mock: {
      count: number;
      bestScore: number;
      averageScore: number;
    };
    practice: {
      count: number;
      bestScore: number;
      averageScore: number;
    };
  };
  recentTests: Array<{
    testType: 'pyq' | 'mock' | 'practice';
    testId: string;
    score: number;
    completedAt: string;
  }>;
}

export interface TestAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  test_type?: 'pyq' | 'mock' | 'practice';
  test_id?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken?: number;
  completed_at: string;
  answers?: any;
}

class ComprehensiveStatsService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(userId: string, examId: string): string {
    return `stats_${userId}_${examId}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Get comprehensive test statistics for a user and exam
   */
  async getComprehensiveStats(examId: string): Promise<{ data: ComprehensiveTestStats | null; error: any }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const cacheKey = this.getCacheKey(user.id, examId);
      const cached = this.cache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log('Returning cached stats for exam:', examId);
        return { data: cached.data, error: null };
      }

      console.log('Fetching comprehensive stats for exam:', examId, 'user:', user.id);

      // Get all test attempts for this exam
      const { data: testAttempts, error: attemptsError } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_id', examId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      console.log('Test attempts query result:', { testAttempts, attemptsError });

      if (attemptsError) {
        console.error('Error fetching test attempts:', attemptsError);
        return { data: null, error: attemptsError };
      }

      if (!testAttempts || testAttempts.length === 0) {
        const emptyStats: ComprehensiveTestStats = {
          totalTests: 0,
          bestScore: 0,
          averageScore: 0,
          last10Average: 0,
          totalScore: 0,
          lastTestDate: null,
          testBreakdown: {
            pyq: { count: 0, bestScore: 0, averageScore: 0 },
            mock: { count: 0, bestScore: 0, averageScore: 0 },
            practice: { count: 0, bestScore: 0, averageScore: 0 }
          },
          recentTests: []
        };
        return { data: emptyStats, error: null };
      }

      // Calculate comprehensive statistics
      console.log('Calculating comprehensive stats for', testAttempts.length, 'test attempts');
      const stats = this.calculateComprehensiveStats(testAttempts as TestAttempt[]);
      console.log('Calculated stats:', stats);
      
      // Cache the result
      this.cache.set(cacheKey, { data: stats, timestamp: Date.now() });
      
      return { data: stats, error: null };
    } catch (error) {
      console.error('Error in getComprehensiveStats:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Calculate comprehensive statistics from test attempts
   */
  private calculateComprehensiveStats(testAttempts: TestAttempt[]): ComprehensiveTestStats {
    // Sort by completion date (most recent first)
    const sortedAttempts = testAttempts.sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );

    const totalTests = testAttempts.length;
    const scores = testAttempts.map(attempt => attempt.score);
    const bestScore = Math.max(...scores);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / totalTests;

    // Calculate last 10 average
    const last10Attempts = sortedAttempts.slice(0, 10);
    const last10Scores = last10Attempts.map(attempt => attempt.score);
    const last10Average = last10Scores.length > 0 
      ? last10Scores.reduce((sum, score) => sum + score, 0) / last10Scores.length 
      : 0;

    // Calculate breakdown by test type
    const testBreakdown = this.calculateTestBreakdown(testAttempts);

    // Get recent tests (last 10)
    const recentTests = last10Attempts.map(attempt => ({
      testType: (attempt.test_type || 'practice') as 'pyq' | 'mock' | 'practice',
      testId: attempt.test_id || 'unknown',
      score: attempt.score,
      completedAt: attempt.completed_at
    }));

    return {
      totalTests,
      bestScore,
      averageScore: Math.round(averageScore),
      last10Average: Math.round(last10Average),
      totalScore,
      lastTestDate: sortedAttempts[0]?.completed_at || null,
      testBreakdown,
      recentTests
    };
  }

  /**
   * Calculate breakdown by test type
   */
  private calculateTestBreakdown(testAttempts: TestAttempt[]) {
    const breakdown = {
      pyq: { count: 0, bestScore: 0, averageScore: 0, scores: [] as number[] },
      mock: { count: 0, bestScore: 0, averageScore: 0, scores: [] as number[] },
      practice: { count: 0, bestScore: 0, averageScore: 0, scores: [] as number[] }
    };

    // Group attempts by test type
    testAttempts.forEach(attempt => {
      const type = (attempt.test_type || 'practice') as 'pyq' | 'mock' | 'practice';
      if (breakdown[type]) {
        breakdown[type].count++;
        breakdown[type].scores.push(attempt.score);
      }
    });

    // Calculate stats for each type
    Object.keys(breakdown).forEach(type => {
      const typeData = breakdown[type as keyof typeof breakdown];
      if (typeData.scores.length > 0) {
        typeData.bestScore = Math.max(...typeData.scores);
        typeData.averageScore = Math.round(
          typeData.scores.reduce((sum, score) => sum + score, 0) / typeData.scores.length
        );
      }
      // Remove scores array as it's not needed in the final result
      delete typeData.scores;
    });

    return breakdown;
  }

  /**
   * Submit a test attempt and update statistics
   */
  async submitTestAttempt(submission: {
    examId: string;
    testType: 'pyq' | 'mock' | 'practice';
    testId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    answers?: any;
  }): Promise<{ data: any; error: any }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // Use the upsert function to handle both create and update in one call
      const { data: upsertResult, error: upsertError } = await supabase
        .rpc('upsert_test_attempt', {
          p_user_id: user.id,
          p_exam_id: submission.examId,
          p_test_type: submission.testType,
          p_test_id: submission.testId,
          p_score: submission.score,
          p_total_questions: submission.totalQuestions,
          p_correct_answers: submission.correctAnswers,
          p_time_taken: submission.timeTaken,
          p_answers: submission.answers,
          p_status: 'completed'
        });

      if (upsertError) {
        console.error('Error upserting test attempt:', upsertError);
        return { data: null, error: upsertError };
      }

      const attemptData = upsertResult && upsertResult.length > 0 ? upsertResult[0] : null;
      console.log('Test attempt upsert result:', { attemptData, upsertError });

      if (!attemptData || !attemptData.success) {
        return { data: null, error: attemptData?.message || 'Failed to save test attempt' };
      }

      // Get the full attempt data
      const { data: fullAttemptData, error: getError } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('id', attemptData.attempt_id)
        .single();

      if (getError) {
        console.error('Error getting full attempt data:', getError);
        return { data: null, error: getError };
      }


      // Clear cache to force refresh
      const cacheKey = this.getCacheKey(user.id, submission.examId);
      this.cache.delete(cacheKey);

      // Update exam stats using the comprehensive calculation
      await this.updateExamStats(user.id, submission.examId);

      return { data: fullAttemptData, error: null };
    } catch (error) {
      console.error('Error in submitTestAttempt:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update exam statistics in the database
   */
  private async updateExamStats(userId: string, examId: string): Promise<void> {
    try {
      // Get current comprehensive stats
      const { data: stats } = await this.getComprehensiveStats(examId);
      
      if (!stats) return;

      // Update exam_stats table
      const { error: statsError } = await supabase
        .from('exam_stats')
        .upsert({
          user_id: userId,
          exam_id: examId,
          total_tests: stats.totalTests,
          best_score: stats.bestScore,
          average_score: stats.last10Average, // Use last 10 average
          last_test_date: stats.lastTestDate
        }, {
          onConflict: 'user_id,exam_id'
        });

      if (statsError) {
        console.error('Error updating exam stats:', statsError);
      }
    } catch (error) {
      console.error('Error in updateExamStats:', error);
    }
  }

  /**
   * Get test attempts for a specific exam
   */
  async getTestAttempts(examId: string, limit = 20): Promise<{ data: TestAttempt[]; error: any }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { data: [], error: 'User not authenticated' };
      }

      const { data: attempts, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_id', examId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching test attempts:', error);
        return { data: [], error };
      }

      return { data: (attempts || []) as TestAttempt[], error: null };
    } catch (error) {
      console.error('Error in getTestAttempts:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Clear cache for a specific user and exam
   */
  clearCache(userId: string, examId: string): void {
    const cacheKey = this.getCacheKey(userId, examId);
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const comprehensiveStatsService = new ComprehensiveStatsService();
export default comprehensiveStatsService;
