import { useState, useEffect, useCallback } from 'react';
import { comprehensiveStatsService, ComprehensiveTestStats } from '@/lib/comprehensiveStatsService';

export interface UseComprehensiveStatsReturn {
  stats: ComprehensiveTestStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  submitTestAttempt: (submission: {
    examId: string;
    testType: 'pyq' | 'mock' | 'practice';
    testId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    answers?: any;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const useComprehensiveStats = (examId?: string): UseComprehensiveStatsReturn => {
  const [stats, setStats] = useState<ComprehensiveTestStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    console.log('🔍 [useComprehensiveStats] Loading stats for exam:', examId);
    
    if (!examId) {
      console.log('🔍 [useComprehensiveStats] No examId provided, setting stats to null');
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [useComprehensiveStats] Calling comprehensiveStatsService.getComprehensiveStats');
      const { data, error: statsError } = await comprehensiveStatsService.getComprehensiveStats(examId);
      
      console.log('🔍 [useComprehensiveStats] Service result:', { data, statsError });
      
      if (statsError) {
        console.error('❌ [useComprehensiveStats] Error loading stats:', statsError);
        setError(statsError.message || 'Failed to load statistics');
        setStats(null);
      } else {
        console.log('✅ [useComprehensiveStats] Stats loaded successfully:', data);
        setStats(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ [useComprehensiveStats] Exception loading stats:', err);
      setError(errorMessage);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const refreshStats = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  const submitTestAttempt = useCallback(async (submission: {
    examId: string;
    testType: 'pyq' | 'mock' | 'practice';
    testId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    answers?: any;
  }) => {
    try {
      console.log('🔍 [useComprehensiveStats] Submitting test attempt:', submission);
      
      const { data, error: submitError } = await comprehensiveStatsService.submitTestAttempt(submission);
      
      console.log('🔍 [useComprehensiveStats] Submit result:', { data, submitError });
      
      if (submitError) {
        console.error('❌ [useComprehensiveStats] Error submitting test attempt:', submitError);
        return { success: false, error: submitError.message || 'Failed to submit test attempt' };
      }

      console.log('✅ [useComprehensiveStats] Test attempt submitted successfully, refreshing stats');
      // Refresh stats after successful submission
      await refreshStats();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ [useComprehensiveStats] Exception submitting test attempt:', err);
      return { success: false, error: errorMessage };
    }
  }, [refreshStats]);

  // Load stats when examId changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    submitTestAttempt
  };
};
