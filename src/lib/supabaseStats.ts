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


  async getCurrentUser() {
    // Get user ID from localStorage (Supabase auth)
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    
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
      .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

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
        const filteredStats = cachedStats.filter((s: SupabaseExamStats) => s.exam_id === examId);
        return { data: filteredStats, error: null };
      }
      return { data: cachedStats, error: null };
    }

    try {
      let query = supabase
        .from('exam_stats')
        .select('*')
        .eq('user_id', user.id);

      if (examId) {
        query = query.eq('exam_id', examId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });


      if (error) {
        console.error('Error getting exam stats:', error);
        return { data: [], error };
      }

      // If no data found, create default stats
      if (!data || data.length === 0) {
        
        if (examId) {
          // Create default stats for specific exam
          const defaultStats = {
            user_id: user.id,
            exam_id: examId,
            total_tests: 0,
            best_score: 0,
            average_score: 0,
            last_test_date: null,
            rank: null
          };

          const { data: insertData, error: insertError } = await supabase
            .from('exam_stats')
            .insert(defaultStats)
            .select()
            .single();

          if (insertError) {
            console.error('Error creating default exam stats:', insertError);
            return { data: [], error: insertError };
          }

          return { data: [insertData], error: null };
        } else {
          // Create default stats for all exams
          const examIds = ['ssc-cgl', 'ssc-mts', 'railway', 'bank-po', 'airforce'];
          const defaultStatsArray = examIds.map(examId => ({
            user_id: user.id,
            exam_id: examId,
            total_tests: 0,
            best_score: 0,
            average_score: 0,
            last_test_date: null,
            rank: null
          }));

          const { data: insertData, error: insertError } = await supabase
            .from('exam_stats')
            .insert(defaultStatsArray)
            .select();

          if (insertError) {
            console.error('Error creating default exam stats:', insertError);
            return { data: [], error: insertError };
          }

          
          // Cache the results
          if (insertData) {
            const cacheData = this.getCache()?.data || {};
            cacheData.examStats = insertData;
            this.setCache(cacheData);
          }

          return { data: insertData || [], error: null };
        }
      }

      // Cache the results
      if (data) {
        const cacheData = this.getCache()?.data || {};
        cacheData.examStats = data;
        this.setCache(cacheData);
      }

      return { data: data || [], error: null };
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
    const user = await this.getCurrentUser();
    
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


    const newTotalTests = (existingStats?.total_tests || 0) + 1;
    const newBestScore = Math.max(existingStats?.best_score || 0, submission.score);
    const newAverageScore = existingStats 
      ? Math.round(((existingStats.average_score * existingStats.total_tests) + submission.score) / newTotalTests)
      : submission.score;


    // Update or create exam stats with proper conflict resolution
    const { data: statsData, error: statsError } = await supabase
      .from('exam_stats')
      .upsert({
        user_id: user.id,
        exam_id: submission.examId,
        total_tests: newTotalTests,
        best_score: newBestScore,
        average_score: newAverageScore,
        last_test_date: new Date().toISOString()
      }, {
        onConflict: 'user_id,exam_id'
      })
      .select()
      .single();


      if (statsError) {
        console.error('Error updating exam stats:', statsError);
        return { data: { attempt: attemptData }, error: statsError };
      }

      // Update exam stats properly (Mock + PYQ only)
      
      const { error: statsUpdateError } = await supabase.rpc('update_exam_stats_properly', {
        user_uuid: user.id,
        exam_name: submission.examId,
        new_score: submission.score
      });
      
      if (statsUpdateError) {
        console.error('Error in update_exam_stats_properly:', statsUpdateError);
      }

      // Clear cache to force refresh
      localStorage.removeItem(this.cacheKey);

      // Clear test completion and score caches for this user
      this.clearTestCaches(user.id, submission.examId, submission.testType || 'mock', submission.testId || 'default');

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
    const user = await this.getCurrentUser();
    
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      // Use the RPC function for test completion
      const { data: completionData, error: completionError } = await (supabase as any).rpc('upsert_test_completion_simple', {
        p_user_id: user.id,
        p_exam_id: submission.examId,
        p_test_type: submission.testType || 'mock',
        p_test_id: submission.testId || 'default',
        p_topic_id: submission.topicId || null,
        p_score: submission.score,
        p_total_questions: submission.totalQuestions,
        p_correct_answers: submission.correctAnswers,
        p_time_taken: submission.timeTaken,
        p_answers: submission.answers
      });

      if (completionError) {
        console.error('Error upserting test completion:', completionError);
        return { data: null, error: completionError };
      }

      // Update user streak
      await (supabase as any).rpc('update_user_streak', { user_uuid: user.id });

      // Also update exam stats (existing functionality)
      await this.submitTestAttempt(submission);

      // Clear cache to force refresh
      localStorage.removeItem(this.cacheKey);
      
      // Clear test completion and score caches for this user
      this.clearTestCaches(user.id, submission.examId, submission.testType || 'mock', submission.testId || 'default');

      return { data: completionData, error: null };
    } catch (error) {
      console.error('Error in submitTestCompletion:', error);
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
      const { data, error } = await (supabase as any).rpc('is_test_completed', {
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
      console.error('Error in isTestCompleted:', error);
      return false;
    }
  }

  async getUserStreak(): Promise<{ data: SupabaseUserStreak | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const { data, error } = await (supabase as any).rpc('get_or_create_user_streak', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error getting user streak:', error);
        return { data: null, error };
      }

      return { data: data?.[0] as any || null, error: null };
    } catch (error) {
      console.error('Error in getUserStreak:', error);
      return { data: null, error };
    }
  }

  async getTestCompletions(examId?: string): Promise<{ data: SupabaseTestCompletion[]; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    try {
      let query = supabase
        .from('test_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (examId) {
        query = query.eq('exam_id', examId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting test completions:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getTestCompletions:', error);
      return { data: [], error };
    }
  }

  async submitIndividualTestScore(
    examId: string,
    testType: string,
    testId: string,
    score: number
  ): Promise<{ data: any; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const { data, error } = await (supabase as any).rpc('submitindividualtestscore', {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId,
        score_value: score
      });

      if (error) {
        console.error('Error submitting individual test score:', error);
        return { data: null, error };
      }

      // Clear cache to force refresh
      this.clearTestCaches(user.id, examId, testType, testId);

      return { data, error: null };
    } catch (error) {
      console.error('Error in submitIndividualTestScore:', error);
      return { data: null, error };
    }
  }

  async getIndividualTestScore(
    examId: string,
    testType: string,
    testId: string
  ): Promise<{ data: SupabaseIndividualTestScore | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const { data, error } = await (supabase as any).rpc('get_user_test_score', {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId
      });

      if (error) {
        console.error('Error getting individual test score:', error);
        return { data: null, error };
      }

      return { data: data?.[0] as any || null, error: null };
    } catch (error) {
      console.error('Error in getIndividualTestScore:', error);
      return { data: null, error };
    }
  }

  async getAllIndividualTestScores(examId?: string): Promise<{ data: SupabaseIndividualTestScore[]; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    try {
      let query = supabase
        .from('individual_test_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (examId) {
        query = query.eq('exam_id', examId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting all individual test scores:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getAllIndividualTestScores:', error);
      return { data: [], error };
    }
  }

  // Update daily visit streak
  async updateDailyVisit(): Promise<{ success: boolean; error?: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await (supabase as any).rpc('update_daily_visit', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error updating daily visit:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateDailyVisit:', error);
      return { success: false, error };
    }
  }

  // Clear test-related caches
  private clearTestCaches(userId: string, examId: string, testType: string, testId: string) {
    const patterns = [
      `test_completed_${userId}_${examId}_${testType}_${testId}`,
      `individual_test_score_${userId}_${examId}_${testType}_${testId}`,
      `exam_stats_${userId}_${examId}`
    ];

    patterns.forEach(pattern => {
      // Clear all localStorage keys that match the pattern
      Object.keys(localStorage).forEach(key => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    });
  }
}

// Export singleton instance
export const supabaseStatsService = new SupabaseStatsService();
