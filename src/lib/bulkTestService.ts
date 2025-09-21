import { supabase } from '@/integrations/supabase/client';

export interface BulkTestCompletion {
  test_id: string;
  is_completed: boolean;
  completed_at: string | null;
  score: number;
  rank: number;
}

export interface BulkTestCompletionWithType extends BulkTestCompletion {
  test_type: string;
  topic_id: string | null;
}

export class BulkTestService {
  private static instance: BulkTestService;

  public static getInstance(): BulkTestService {
    if (!BulkTestService.instance) {
      BulkTestService.instance = new BulkTestService();
    }
    return BulkTestService.instance;
  }

  /**
   * Get all test completions for a specific exam and test type
   */
  async getBulkTestCompletions(
    examId: string,
    testType: string
  ): Promise<{ data: BulkTestCompletion[]; error: any }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { data: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase.rpc('get_bulk_test_completions' as any, {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType
      });

      if (error) {
        console.error('Error getting bulk test completions:', error);
        return { data: [], error };
      }

      return { data: (data as BulkTestCompletion[]) || [], error: null };
    } catch (error) {
      console.error('Error in getBulkTestCompletions:', error);
      return { data: [], error };
    }
  }

  /**
   * Get all test completions for an exam (all test types)
   */
  async getAllTestCompletionsForExam(
    examId: string
  ): Promise<{ data: BulkTestCompletionWithType[]; error: any }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { data: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase.rpc('get_all_test_completions_for_exam' as any, {
        user_uuid: user.id,
        exam_name: examId
      });

      if (error) {
        console.error('Error getting all test completions:', error);
        return { data: [], error };
      }

      return { data: (data as BulkTestCompletionWithType[]) || [], error: null };
    } catch (error) {
      console.error('Error in getAllTestCompletionsForExam:', error);
      return { data: [], error };
    }
  }

  /**
   * Get test completions for specific test IDs
   */
  async getTestCompletionsByIds(
    examId: string,
    testType: string,
    testIds: string[]
  ): Promise<{ data: BulkTestCompletion[]; error: any }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { data: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase.rpc('get_test_completions_by_ids' as any, {
        user_uuid: user.id,
        exam_name: examId,
        test_type_name: testType,
        test_ids: testIds
      });

      if (error) {
        console.error('Error getting test completions by IDs:', error);
        return { data: [], error };
      }

      return { data: (data as BulkTestCompletion[]) || [], error: null };
    } catch (error) {
      console.error('Error in getTestCompletionsByIds:', error);
      return { data: [], error };
    }
  }

  /**
   * Process bulk completions into maps for easy lookup
   */
  processBulkCompletions(completions: BulkTestCompletion[]): {
    completedTests: Set<string>;
    testScores: Map<string, { score: number; rank: number; totalParticipants: number }>;
  } {
    const completedTests = new Set<string>();
    const testScores = new Map<string, { score: number; rank: number; totalParticipants: number }>();

    completions.forEach(completion => {
      const key = `${completion.test_id}`;
      
      if (completion.is_completed) {
        completedTests.add(key);
      }

      if (completion.score > 0) {
        testScores.set(key, {
          score: completion.score,
          rank: completion.rank,
          totalParticipants: 0 // Default value since total_participants is not available
        });
      }
    });

    return { completedTests, testScores };
  }

  /**
   * Process bulk completions with test types into maps
   */
  processBulkCompletionsWithType(completions: BulkTestCompletionWithType[]): {
    completedTests: Set<string>;
    testScores: Map<string, { score: number; rank: number; totalParticipants: number }>;
  } {
    const completedTests = new Set<string>();
    const testScores = new Map<string, { score: number; rank: number; totalParticipants: number }>();

    completions.forEach(completion => {
      // Debug logging for each completion
      console.log(`🔍 [bulkTestService] Processing completion:`, {
        test_type: completion.test_type,
        test_id: completion.test_id,
        topic_id: completion.topic_id,
        is_completed: completion.is_completed,
        score: completion.score,
        rank: completion.rank
      });
      
      // Generate multiple key formats for compatibility
      const keys = [
        completion.topic_id 
          ? `${completion.test_type}-${completion.test_id}-${completion.topic_id}`
          : `${completion.test_type}-${completion.test_id}`,
        completion.test_id, // Direct test_id
        `${completion.test_type}-${completion.test_id}`, // test_type-test_id
        completion.topic_id 
          ? `${completion.test_id}-${completion.topic_id}`
          : completion.test_id, // test_id-topic_id or just test_id
        // Add specific formats for YearWiseTabs component
        `pyq-${completion.test_id}`, // For PYQ tests
        `mock-${completion.test_id}`, // For Mock tests
        `practice-${completion.test_id}` // For Practice tests
      ];
      
      if (completion.is_completed) {
        keys.forEach(key => completedTests.add(key));
      }

      if (completion.score >= 0) {
        const scoreData = {
          score: completion.score,
          rank: completion.rank,
          totalParticipants: 0 // Default value since total_participants is not available
        };
        keys.forEach(key => testScores.set(key, scoreData));
        
        // Debug logging
        console.log(`🔍 [bulkTestService] Generated keys for ${completion.test_id}:`, keys);
        console.log(`📊 [bulkTestService] Score data:`, scoreData);
      }
    });

    return { completedTests, testScores };
  }

  /**
   * Get current user
   */
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
}

export const bulkTestService = BulkTestService.getInstance();
