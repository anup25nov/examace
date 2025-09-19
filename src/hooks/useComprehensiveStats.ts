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
    if (!examId) {
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: statsError } = await comprehensiveStatsService.getComprehensiveStats(examId);
      
      if (statsError) {
        setError(statsError.message || 'Failed to load statistics');
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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
      const { data, error: submitError } = await comprehensiveStatsService.submitTestAttempt(submission);
      
      if (submitError) {
        return { success: false, error: submitError.message || 'Failed to submit test attempt' };
      }

      // Refresh stats after successful submission
      await refreshStats();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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
