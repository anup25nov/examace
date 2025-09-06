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

  private clearTestCaches(userId: string, examId: string, testType: string, testId: string, topicId?: string) {
    // Clear test completion cache for both null and testId as topicId
    localStorage.removeItem(`test_completed_${userId}_${examId}_${testType}_${testId}_null`);
    localStorage.removeItem(`test_completed_${userId}_${examId}_${testType}_${testId}_${testId}`);
    
    // Clear cache for the specific topicId if provided
    if (topicId) {
      localStorage.removeItem(`test_completed_${userId}_${examId}_${testType}_${testId}_${topicId}`);
    }
    
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
    
    console.log('Cleared test caches for:', { userId, examId, testType, testId, topicId });
    console.log('Removed keys:', keysToRemove);
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
      .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

    return { data, error };
  }

  async getExamStats(examId?: string): Promise<{ data: SupabaseExamStats[]; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    console.log('Getting exam stats for user:', user.id, 'examId:', examId);

    // Check cache first for quick response
    const cache = this.getCache();
    if (this.isCacheValid(cache) && cache?.data?.examStats) {
      const cachedStats = cache.data.examStats;
      if (examId) {
        const filteredStats = cachedStats.filter((s: SupabaseExamStats) => s.exam_id === examId);
        console.log('Returning cached exam stats (filtered):', filteredStats);
        return { data: filteredStats, error: null };
      }
      console.log('Returning cached exam stats (all):', cachedStats);
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

      console.log('Exam stats query result:', { data, error, examId, userId: user.id });
      console.log('Data length:', data?.length);
      console.log('Data content:', data);

      if (error) {
        console.error('Error getting exam stats:', error);
        return { data: [], error };
      }

      // If no data found, create default stats
      if (!data || data.length === 0) {
        console.log('No exam stats found, creating default stats');
        
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

          console.log('Created default exam stats:', insertData);
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

          console.log('Created default exam stats for all exams:', insertData);
          
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

      console.log('Returning exam stats:', data);
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

      console.log('Exam stats upsert result:', { statsData, statsError });

      if (statsError) {
        console.error('Error updating exam stats:', statsError);
        return { data: { attempt: attemptData }, error: statsError };
      }

      // Update exam stats properly (Mock + PYQ only)
      console.log('Calling update_exam_stats_properly with:', {
        user_uuid: user.id,
        exam_name: submission.examId,
        new_score: submission.score
      });
      
      const { error: statsUpdateError } = await supabase.rpc('update_exam_stats_properly', {
        user_uuid: user.id,
        exam_name: submission.examId,
        new_score: submission.score
      });
      
      if (statsUpdateError) {
        console.error('Error in update_exam_stats_properly:', statsUpdateError);
      } else {
        console.log('update_exam_stats_properly completed successfully');
      }

      // Clear cache to force refresh
      localStorage.removeItem(this.cacheKey);

      // Clear test completion and score caches for this user
      this.clearTestCaches(user.id, submission.examId, submission.testType || 'mock', submission.testId || 'default', submission.topicId);

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

    // Debug logging for the exact data being stored
    const completionRecord = {
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
    };
    
    console.log('Storing test completion record:', completionRecord);

    try {
      // Try to insert first, if it fails due to duplicate, then update
      let { data: completionData, error: completionError } = await supabase
        .from('test_completions')
        .insert(completionRecord)
        .select()
        .single();

      // If insert fails due to duplicate key, try to update instead
      if (completionError && completionError.code === '23505') {
        console.log('Duplicate key detected, attempting to update existing record');
        
        // Build update query based on the unique constraint
        let updateQuery = supabase
          .from('test_completions')
          .update({
            score: completionRecord.score,
            total_questions: completionRecord.total_questions,
            correct_answers: completionRecord.correct_answers,
            time_taken: completionRecord.time_taken,
            answers: completionRecord.answers,
            completed_at: new Date().toISOString()
          })
          .eq('user_id', completionRecord.user_id)
          .eq('exam_id', completionRecord.exam_id)
          .eq('test_type', completionRecord.test_type)
          .eq('test_id', completionRecord.test_id);

        // Handle topic_id properly (it might be null)
        if (completionRecord.topic_id === null) {
          updateQuery = updateQuery.is('topic_id', null);
        } else {
          updateQuery = updateQuery.eq('topic_id', completionRecord.topic_id);
        }

        const { data: updateData, error: updateError } = await updateQuery.select().single();

        if (updateError) {
          console.error('Error updating test completion:', updateError);
          return { data: null, error: updateError };
        }

        completionData = updateData;
        completionError = null;
      }

      if (completionError) {
        console.error('Error with test completion operation:', completionError);
        return { data: null, error: completionError };
      }

      // Update user streak
      console.log('Calling update_user_streak with:', { user_uuid: user.id });
      const { error: streakError } = await supabase.rpc('update_user_streak', { user_uuid: user.id });
      
      if (streakError) {
        console.error('Error in update_user_streak:', streakError);
      } else {
        console.log('update_user_streak completed successfully');
      }

      // Update exam stats properly for Mock and PYQ tests only
      if (submission.testType === 'mock' || submission.testType === 'pyq') {
        console.log('Updating exam stats for:', submission.testType, 'with score:', submission.score);
        
        try {
          console.log('Calling update_exam_stats_properly (completion) with:', {
            user_uuid: user.id,
            exam_name: submission.examId,
            new_score: submission.score
          });
          
          const { error: examStatsError } = await supabase.rpc('update_exam_stats_properly', {
            user_uuid: user.id,
            exam_name: submission.examId,
            new_score: submission.score
          });
          
          if (examStatsError) {
            console.error('Error in update_exam_stats_properly (completion):', examStatsError);
          } else {
            console.log('Exam stats updated successfully (completion)');
          }
        } catch (error) {
          console.error('Error updating exam stats:', error);
        }

        // Also submit individual test score for ranking
        try {
          await this.submitIndividualTestScore(
            submission.examId,
            submission.testType || 'mock',
            submission.testId || 'default',
            submission.score
          );
          console.log('Individual test score submitted successfully');
        } catch (error) {
          console.error('Error submitting individual test score:', error);
        }
      }

      // Clear cache to force refresh
      localStorage.removeItem(this.cacheKey);
      
      // Clear test completion and score caches for this user
      this.clearTestCaches(user.id, submission.examId, submission.testType || 'mock', submission.testId || 'default', submission.topicId);

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
      console.log('Checking test completion with:', {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId,
        topic_name: topicId || null
      });

      // Try the simple function first (ignores topic_id)
      let { data, error } = await supabase.rpc('is_test_completed_simple' as any, {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId
      });

      // If simple function doesn't exist or fails, fall back to the original
      if (error) {
        console.log('Simple function failed or not found, using original function. Error:', error);
        const result = await supabase.rpc('is_test_completed', {
          user_uuid: user.id,
          exam_name: examId,
          test_type_name: testType,
          test_name: testId,
          topic_name: topicId || null
        });
        data = result.data;
        error = result.error;
      }

      console.log('is_test_completed RPC result:', { data, error });

      if (error) {
        console.error('Error checking test completion:', error);
        return false;
      }

      const result = Boolean(data);
      console.log('Test completion result:', result);
      
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
        p_user_id: user.id
      });

      if (error) {
        console.error('Error getting user streak:', error);
        return { data: null, error };
      }

      // The function returns an array, get the first result
      if (data && data.length > 0) {
        const streak = data[0];
        const streakData = {
          id: user.id,
          user_id: user.id,
          current_streak: streak.current_streak,
          longest_streak: streak.longest_streak,
          total_tests_taken: streak.total_tests_taken,
          last_activity_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return { data: streakData, error: null };
      }
      return { data: null, error: null };
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

    console.log('Submitting individual test score:', { examId, testType, testId, score, userId: user.id });

    try {
      // Use the RPC function that handles duplicates gracefully
      console.log('Calling submitindividualtestscore with:', {
        p_user_id: user.id,
        p_exam_id: examId,
        p_test_type: testType,
        p_test_id: testId,
        p_score: score
      });
      
      const { error } = await supabase.rpc('submitindividualtestscore', {
        p_user_id: user.id,
        p_exam_id: examId,
        p_test_type: testType,
        p_test_id: testId,
        p_score: score
      });

      if (error) {
        console.error('Error submitting individual test score:', error);
        // Don't return error for duplicate key - it's handled by UPSERT
        if (error.code === '23505') {
          console.log('Duplicate key error handled by UPSERT, continuing...');
        } else {
          return { data: null, error };
        }
      } else {
        console.log('submitindividualtestscore completed successfully');
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

      console.log('Individual test score result:', { scoreData, scoreError });

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
      console.log('Getting individual test score with:', {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId
      });

      const { data, error } = await supabase.rpc('get_user_test_score', {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_name: testId
      });

      console.log('get_user_test_score RPC result:', { data, error });

      if (error || !data || data.length === 0) {
        console.log('No score data found, returning null values');
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
        p_user_id: user.id
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
