import { supabase } from '@/integrations/supabase/client';

export interface SupabaseUserProfile {
  id: string;
  email: string;
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
  total_tests_taken: number;
  last_activity_date: string;
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
  total_participants?: number;
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

  private clearTestCaches(userId: string, examId: string, testType: string, testId: string) {
    // Clear test completion cache
    localStorage.removeItem(`test_completed_${userId}_${examId}_${testType}_${testId}_null`);
    
    // Clear test score cache
    localStorage.removeItem(`test_score_${userId}_${examId}_${testType}_${testId}`);
    
    // Clear any other related caches
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes(`test_completed_${userId}_${examId}`) || key.includes(`test_score_${userId}_${examId}`))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  async getCurrentUser() {
    // Get user ID from localStorage (Supabase auth)
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    console.log('getCurrentUser - localStorage data:', {
      userId,
      userEmail,
      isAuthenticated
    });
    
    if (!userId) {
      console.error('No authenticated user found in localStorage');
      throw new Error('No authenticated user found');
    }
    
    // Return a user object with the Supabase user ID
    return {
      id: userId,
      email: userEmail || ''
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

    try {
      if (examId) {
        // Use the safe function for specific exam
        const { data, error } = await supabase.rpc('get_or_create_exam_stats', {
          user_uuid: user.id,
          exam_name: examId
        });

        if (error) {
          console.error('Error getting exam stats:', error);
          return { data: [], error };
        }

        const statsData = data && data.length > 0 ? [data[0]] : [];
        return { data: statsData, error: null };
      } else {
        // Get all exam stats
        const { data, error } = await supabase
          .from('exam_stats')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Handle the case where no exam stats exist yet
        if (error && error.code === 'PGRST116') {
          // No rows found - this is normal for new users
          console.log('No exam stats found yet for user:', user.id);
          return { data: [], error: null };
        }

        // Cache the results
        if (!error && data) {
          const cacheData = this.getCache()?.data || {};
          cacheData.examStats = data;
          this.setCache(cacheData);
        }

        return { data: data || [], error };
      }
    } catch (error) {
      console.error('Error getting exam stats:', error);
      return { data: [], error };
    }
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
    console.log('submitTestAttempt called with:', submission);
    
    const user = await this.getCurrentUser();
    console.log('Current user for test attempt:', user);
    
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
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

      console.log('Test attempt insert result:', { attemptData, attemptError });

      if (attemptError) {
        console.error('Error inserting test attempt:', attemptError);
        return { data: null, error: attemptError };
      }

    // Get existing stats
    const { data: existingStats } = await supabase
      .from('exam_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('exam_id', submission.examId)
      .single();

      console.log('Existing stats:', existingStats);

    const newTotalTests = (existingStats?.total_tests || 0) + 1;
    const newBestScore = Math.max(existingStats?.best_score || 0, submission.score);
    const newAverageScore = existingStats 
      ? Math.round(((existingStats.average_score * existingStats.total_tests) + submission.score) / newTotalTests)
      : submission.score;

      console.log('Calculated stats:', { newTotalTests, newBestScore, newAverageScore });

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

      console.log('Exam stats upsert result:', { statsData, statsError });

      if (statsError) {
        console.error('Error updating exam stats:', statsError);
        return { data: { attempt: attemptData }, error: statsError };
      }

      // Update exam stats properly (Mock + PYQ only)
      await supabase.rpc('update_exam_stats_properly', {
        user_uuid: user.id,
        exam_name: submission.examId,
        new_score: submission.score
      });

      // Clear cache to force refresh
      localStorage.removeItem(this.cacheKey);

      return { data: { attempt: attemptData, stats: statsData }, error: null };
    } catch (error) {
      console.error('Error in submitTestAttempt:', error);
      return { data: null, error };
    }
  }

  async getLeaderboard(examId: string, limit = 50): Promise<{ data: any[]; error: any }> {
    const { data, error } = await supabase
      .from('exam_stats')
      .select(`
        rank,
        best_score,
        average_score,
        total_tests,
        user_profiles!inner(email)
      `)
      .eq('exam_id', examId)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) return { data: [], error };

    const leaderboard = data?.map((item: any) => ({
      rank: item.rank,
      bestScore: item.best_score,
      averageScore: item.average_score,
      totalTests: item.total_tests,
      email: item.user_profiles?.email || 'Unknown'
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
    console.log('submitTestCompletion called with:', submission);
    
    const user = await this.getCurrentUser();
    console.log('Current user:', user);
    
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
      
      // Clear test completion and score caches for this user
      this.clearTestCaches(user.id, submission.examId, submission.testType || 'mock', submission.testId || 'default');

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

    // Check cache first
    const cacheKey = `test_completed_${user.id}_${examId}_${testType}_${testId}_${topicId || 'null'}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Cache for 2 minutes
      if (Date.now() - parsed.timestamp < 2 * 60 * 1000) {
        return parsed.result;
      }
    }

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

      const result = data || false;
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        result,
        timestamp: Date.now()
      }));

      return result;
    } catch (error) {
      console.error('Error checking test completion:', error);
      return false;
    }
  }

  async getUserStreak(): Promise<{ data: SupabaseUserStreak | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      // Use the safe function to get or create streak
      const { data, error } = await supabase.rpc('get_or_create_user_streak', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error getting user streak:', error);
        return { data: null, error };
      }

      // The function returns an array, get the first result
      const streakData = data && data.length > 0 ? data[0] : null;
      return { data: streakData, error: null };
    } catch (error) {
      console.error('Error getting user streak:', error);
      return { data: null, error };
    }
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

  async submitIndividualTestScore(
    examId: string,
    testType: string,
    testId: string,
    score: number
  ): Promise<{ data: SupabaseIndividualTestScore | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      // Use the new function that handles duplicates gracefully
      const { error } = await supabase.rpc('submitIndividualTestScore', {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId,
        new_score: score
      });

      if (error) {
        console.error('Error submitting individual test score:', error);
        return { data: null, error };
      }

      // Get the updated score data
      const { data: scoreData, error: scoreError } = await supabase
        .from('individual_test_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_id', examId)
        .eq('test_type', testType)
        .eq('test_id', testId)
        .single();

      return { data: scoreData, error: scoreError };
    } catch (error) {
      console.error('Error submitting individual test score:', error);
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

    // Check cache first
    const cacheKey = `test_score_${user.id}_${examId}_${testType}_${testId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Cache for 5 minutes
      if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
        return parsed.result;
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_user_test_score', {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId
      });

      if (error || !data || data.length === 0) {
        const result = { score: null, rank: null, totalParticipants: 0 };
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          result,
          timestamp: Date.now()
        }));
        return result;
      }

      const result = {
        score: data[0].score,
        rank: data[0].rank,
        totalParticipants: data[0].total_participants
      };
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        result,
        timestamp: Date.now()
      }));
      
      return result;
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

  // Update daily visit streak
  async updateDailyVisit(): Promise<{ success: boolean; error?: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase.rpc('update_daily_visit', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error updating daily visit:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating daily visit:', error);
      return { success: false, error };
    }
  }

  // Clear all caches
  clearAllCaches() {
    localStorage.removeItem(this.cacheKey);
  }
}

export const supabaseStatsService = new SupabaseStatsService();
