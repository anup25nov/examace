import { supabase } from '@/integrations/supabase/client';

export interface SupabaseUserProfile {
  id: string;
  phone: string;
  pin?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseExamStats {
  id: string;
  user_id: string;
  exam_id: string;
  total_tests: number;
  best_score: number;
  average_score: number;
  rank?: number;
  last_test_date: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseTestAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken?: number;
  completed_at: string;
  answers?: any;
}

export interface SupabaseTestCompletion {
  id: string;
  user_id: string;
  exam_id: string;
  test_type: string;
  test_id: string;
  topic_id?: string;
  total_questions: number;
  correct_answers: number;
  time_taken?: number;
  completed_at: string;
  answers?: any;
}

export interface SupabaseUserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  total_tests_taken: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseIndividualTestScore {
  id: string;
  user_id: string;
  exam_id: string;
  test_type: string;
  test_id: string;
  score: number;
  rank?: number;
  total_participants: number;
  completed_at: string;
}

export interface TestSubmissionData {
  examId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  answers: any;
  testType?: string;
  testId?: string;
  topicId?: string;
}

class SupabaseStatsService {
  private cacheKey = 'examace_cache';
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  private getCache(): { data: any; timestamp: number } | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private setCache(data: any) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch {
      // Ignore cache errors
    }
  }

  private isCacheValid(cache: { timestamp: number } | null): boolean {
    return cache ? (Date.now() - cache.timestamp) < this.cacheExpiry : false;
  }

  async getCurrentUser() {
    // Get user ID from localStorage (Supabase auth)
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    
    // Return a user object with the Supabase user ID
    return {
      id: userId,
      email: localStorage.getItem('userEmail') || ''
    };
  }

  async createUserProfile(email: string): Promise<{ data: SupabaseUserProfile | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email
      })
      .select()
      .single();

    return { data, error };
  }

  async getUserProfile(): Promise<{ data: SupabaseUserProfile | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { data, error };
  }

  async getExamStats(examId?: string): Promise<{ data: SupabaseExamStats[]; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    // Check cache first for quick response
    const cache = this.getCache();
    if (this.isCacheValid(cache) && cache?.data?.examStats) {
      const cachedStats = cache.data.examStats;
      if (examId) {
        return { data: cachedStats.filter((s: SupabaseExamStats) => s.exam_id === examId), error: null };
      }
      return { data: cachedStats, error: null };
    }

    let query = supabase
      .from('exam_stats')
      .select('*')
      .eq('user_id', user.id);

    if (examId) {
      query = query.eq('exam_id', examId);
    }

    const { data, error } = await query.order('last_test_date', { ascending: false });

    if (data && !error) {
      // Update cache
      const cache = this.getCache();
      const newCache = {
        ...cache?.data,
        examStats: examId ? data : data,
        timestamp: Date.now()
      };
      this.setCache(newCache);
    }

    return { data: data || [], error };
  }

  async getTestAttempts(examId: string, limit = 20): Promise<{ data: SupabaseTestAttempt[]; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('exam_id', examId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    return { data: data || [], error };
  }

  async submitTestAttempt(submission: TestSubmissionData): Promise<{ data: any; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    // Create test attempt
    const { data: attemptData, error: attemptError } = await supabase
      .from('test_attempts')
      .insert({
        user_id: user.id,
        exam_id: submission.examId,
        score: submission.score,
        total_questions: submission.totalQuestions,
        correct_answers: submission.correctAnswers,
        time_taken: submission.timeTaken,
        answers: submission.answers
      })
      .select()
      .single();

    if (attemptError) return { data: null, error: attemptError };

    // Get existing stats
    const { data: existingStats } = await supabase
      .from('exam_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('exam_id', submission.examId)
      .single();

    const newTotalTests = (existingStats?.total_tests || 0) + 1;
    const newBestScore = Math.max(existingStats?.best_score || 0, submission.score);
    const newAverageScore = existingStats 
      ? Math.round(((existingStats.average_score * existingStats.total_tests) + submission.score) / newTotalTests)
      : submission.score;

    // Update or create exam stats
    const { data: statsData, error: statsError } = await supabase
      .from('exam_stats')
      .upsert({
        user_id: user.id,
        exam_id: submission.examId,
        total_tests: newTotalTests,
        best_score: newBestScore,
        average_score: newAverageScore,
        last_test_date: new Date().toISOString()
      })
      .select()
      .single();

    // Calculate ranks for this exam
    await supabase.rpc('calculate_exam_ranks', { exam_name: submission.examId });

    // Clear cache to force refresh
    localStorage.removeItem(this.cacheKey);

    return { data: { attempt: attemptData, stats: statsData }, error: statsError };
  }

  async getLeaderboard(examId: string, limit = 50): Promise<{ data: any[]; error: any }> {
    const { data, error } = await supabase
      .from('exam_stats')
      .select(`
        rank,
        best_score,
        user_id,
        user_profiles!inner(phone)
      `)
      .eq('exam_id', examId)
      .not('rank', 'is', null)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) return { data: [], error };

    const leaderboard = data?.map(item => ({
      rank: item.rank,
      phone: `****${item.user_profiles.phone.slice(-4)}`,
      score: item.best_score,
      examId,
      completedAt: new Date() // This could be enhanced with actual completion time
    })) || [];

    return { data: leaderboard, error: null };
  }

  async getUserRank(examId: string): Promise<{ rank: number | null; totalUsers: number }> {
    const user = await this.getCurrentUser();
    if (!user) return { rank: null, totalUsers: 0 };

    const { data: userStats } = await supabase
      .from('exam_stats')
      .select('rank')
      .eq('user_id', user.id)
      .eq('exam_id', examId)
      .single();

    const { count } = await supabase
      .from('exam_stats')
      .select('*', { count: 'exact' })
      .eq('exam_id', examId);

    return { 
      rank: userStats?.rank || null, 
      totalUsers: count || 0 
    };
  }

  // Test completion tracking methods
  async submitTestCompletion(submission: TestSubmissionData): Promise<{ data: any; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      // Create test completion record
      const { data: completionData, error: completionError } = await supabase
        .from('test_completions')
        .upsert({
          user_id: user.id,
          exam_id: submission.examId,
          test_type: submission.testType || 'mock',
          test_id: submission.testId || 'default',
          topic_id: submission.topicId,
          score: submission.score,
          total_questions: submission.totalQuestions,
          correct_answers: submission.correctAnswers,
          time_taken: submission.timeTaken,
          answers: submission.answers
        })
        .select()
        .single();

      if (completionError) return { data: null, error: completionError };

      // Update user streak
      await supabase.rpc('update_user_streak', { user_uuid: user.id });

      // Also update exam stats (existing functionality)
      await this.submitTestAttempt(submission);

      // Clear cache to force refresh
      localStorage.removeItem(this.cacheKey);

      return { data: completionData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async isTestCompleted(
    examId: string, 
    testType: string, 
    testId: string, 
    topicId?: string
  ): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('is_test_completed', {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId,
        topic_name: topicId || null
      });

      if (error) {
        console.error('Error checking test completion:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking test completion:', error);
      return false;
    }
  }

  async getUserStreak(): Promise<{ data: SupabaseUserStreak | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return { data, error };
  }

  async getTestCompletions(examId?: string): Promise<{ data: SupabaseTestCompletion[]; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    let query = supabase
      .from('test_completions')
      .select('*')
      .eq('user_id', user.id);

    if (examId) {
      query = query.eq('exam_id', examId);
    }

    const { data, error } = await query.order('completed_at', { ascending: false });

    return { data: data || [], error };
  }

  // Individual test score methods
  async submitIndividualTestScore(
    examId: string,
    testType: string,
    testId: string,
    score: number
  ): Promise<{ data: SupabaseIndividualTestScore | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      // Insert or update individual test score
      const { data: scoreData, error: scoreError } = await supabase
        .from('individual_test_scores')
        .upsert({
          user_id: user.id,
          exam_id: examId,
          test_type: testType,
          test_id: testId,
          score: score
        })
        .select()
        .single();

      if (scoreError) return { data: null, error: scoreError };

      // Calculate rank for this specific test
      await supabase.rpc('calculate_test_rank', {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId
      });

      // Update exam stats (Mock and PYQ only)
      await supabase.rpc('update_exam_stats_mock_pyq_only', { exam_name: examId });

      // Clear cache to force refresh
      localStorage.removeItem(this.cacheKey);

      return { data: scoreData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getIndividualTestScore(
    examId: string,
    testType: string,
    testId: string
  ): Promise<{ score: number | null; rank: number | null; totalParticipants: number }> {
    const user = await this.getCurrentUser();
    if (!user) return { score: null, rank: null, totalParticipants: 0 };

    try {
      const { data, error } = await supabase.rpc('get_user_test_score', {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId
      });

      if (error || !data || data.length === 0) {
        return { score: null, rank: null, totalParticipants: 0 };
      }

      const result = data[0];
      return {
        score: result.score,
        rank: result.rank,
        totalParticipants: result.total_participants
      };
    } catch (error) {
      console.error('Error getting individual test score:', error);
      return { score: null, rank: null, totalParticipants: 0 };
    }
  }

  async getAllIndividualTestScores(examId?: string): Promise<{ data: SupabaseIndividualTestScore[]; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    let query = supabase
      .from('individual_test_scores')
      .select('*')
      .eq('user_id', user.id);

    if (examId) {
      query = query.eq('exam_id', examId);
    }

    const { data, error } = await query.order('completed_at', { ascending: false });

    return { data: data || [], error };
  }

  // Clear cache method for manual refresh
  clearCache() {
    localStorage.removeItem(this.cacheKey);
  }
}

export const supabaseStatsService = new SupabaseStatsService();