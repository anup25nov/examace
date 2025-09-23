import { supabase } from '@/integrations/supabase/client';
import { errorHandlingService } from './errorHandlingService';

export interface TestState {
  examId: string;
  sectionId: string;
  testType: string;
  testId: string;
  currentQuestion: number;
  answers: { [key: number]: number };
  timeLeft: number;
  startTime: number;
  flagged: number[];
  selectedLanguage: string;
  isCompleted: boolean;
  lastSaved: Date;
}

export interface RecoveryResult {
  success: boolean;
  state?: TestState;
  message: string;
  canResume: boolean;
}

export class TestStateRecoveryService {
  private static instance: TestStateRecoveryService;
  private readonly STORAGE_KEY = 'examace_test_state';
  private readonly MAX_STATE_AGE = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): TestStateRecoveryService {
    if (!TestStateRecoveryService.instance) {
      TestStateRecoveryService.instance = new TestStateRecoveryService();
    }
    return TestStateRecoveryService.instance;
  }

  /**
   * Save test state to localStorage and database
   */
  async saveTestState(state: TestState, userId?: string): Promise<boolean> {
    try {
      // Save to localStorage for immediate access
      const stateWithTimestamp = {
        ...state,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateWithTimestamp));

      // Only save to database if we have a user ID
      if (userId) {
        const { error } = await (supabase as any)
          .from('test_states')
          .upsert({
            user_id: userId, // Use the actual user ID
            exam_id: state.examId,
            section_id: state.sectionId,
            test_type: state.testType,
            test_id: state.testId,
            current_question: state.currentQuestion,
            answers: state.answers,
            time_left: state.timeLeft,
            start_time: new Date(state.startTime).toISOString(),
            flagged_questions: state.flagged,
            selected_language: state.selectedLanguage,
            is_completed: state.isCompleted,
            state_data: stateWithTimestamp,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.warn('Failed to save test state to database:', error);
          // Don't throw error, localStorage is sufficient for basic recovery
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to save test state:', error);
      errorHandlingService.handleError(error, {
        action: 'save_test_state',
        resource: 'test_system'
      });
      return false;
    }
  }

  /**
   * Recover test state from localStorage or database
   */
  async recoverTestState(examId: string, sectionId: string, testType: string, testId: string): Promise<RecoveryResult> {
    try {
      // First try localStorage for immediate recovery
      const localState = this.getLocalState();
      if (localState && this.isStateValid(localState, examId, sectionId, testType, testId)) {
        console.log('✅ Recovered test state from localStorage');
        return {
          success: true,
          state: localState,
          message: 'Test state recovered from local storage',
          canResume: !localState.isCompleted && localState.timeLeft > 0
        };
      }

      // Try database recovery
      const dbState = await this.getDatabaseState(examId, sectionId, testType, testId);
      if (dbState && this.isStateValid(dbState, examId, sectionId, testType, testId)) {
        console.log('✅ Recovered test state from database');
        // Update localStorage with recovered state
        this.saveLocalState(dbState);
        return {
          success: true,
          state: dbState,
          message: 'Test state recovered from database',
          canResume: !dbState.isCompleted && dbState.timeLeft > 0
        };
      }

      return {
        success: false,
        message: 'No recoverable test state found',
        canResume: false
      };

    } catch (error) {
      console.error('Failed to recover test state:', error);
      errorHandlingService.handleError(error, {
        action: 'recover_test_state',
        resource: 'test_system'
      });

      return {
        success: false,
        message: 'Error recovering test state',
        canResume: false
      };
    }
  }

  /**
   * Clear test state (after completion or cancellation)
   */
  async clearTestState(examId: string, sectionId: string, testType: string, testId: string): Promise<boolean> {
    try {
      // Clear localStorage
      localStorage.removeItem(this.STORAGE_KEY);

      // Clear database state
      const { error } = await (supabase as any)
        .from('test_states')
        .delete()
        .eq('exam_id', examId)
        .eq('section_id', sectionId)
        .eq('test_type', testType)
        .eq('test_id', testId);

      if (error) {
        console.warn('Failed to clear test state from database:', error);
      }

      return true;
    } catch (error) {
      console.error('Failed to clear test state:', error);
      return false;
    }
  }

  /**
   * Get incomplete tests for a user
   */
  async getIncompleteTests(userId: string): Promise<TestState[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('test_states')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get incomplete tests: ${error.message}`);
      }

      return (data || []).map(item => this.mapDatabaseStateToTestState(item));
    } catch (error) {
      console.error('Failed to get incomplete tests:', error);
      return [];
    }
  }

  /**
   * Auto-save test state periodically
   */
  startAutoSave(state: TestState, intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      this.saveTestState(state);
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Get state from localStorage
   */
  private getLocalState(): TestState | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const state = JSON.parse(stored);
      return this.mapStoredStateToTestState(state);
    } catch (error) {
      console.error('Failed to parse local state:', error);
      return null;
    }
  }

  /**
   * Save state to localStorage
   */
  private saveLocalState(state: TestState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save local state:', error);
    }
  }

  /**
   * Get state from database
   */
  private async getDatabaseState(examId: string, sectionId: string, testType: string, testId: string): Promise<TestState | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('test_states')
        .select('*')
        .eq('exam_id', examId)
        .eq('section_id', sectionId)
        .eq('test_type', testType)
        .eq('test_id', testId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

      if (error) {
        console.error('Database error getting test state:', error);
        return null;
      }

      if (!data) return null; // No state found

      return this.mapDatabaseStateToTestState(data);
    } catch (error) {
      console.error('Failed to get database state:', error);
      return null;
    }
  }

  /**
   * Check if state is valid and not expired
   */
  private isStateValid(state: TestState, examId: string, sectionId: string, testType: string, testId: string): boolean {
    // Check if state matches current test
    if (state.examId !== examId || 
        state.sectionId !== sectionId || 
        state.testType !== testType || 
        state.testId !== testId) {
      return false;
    }

    // Check if state is not too old
    const stateAge = Date.now() - new Date(state.lastSaved).getTime();
    if (stateAge > this.MAX_STATE_AGE) {
      return false;
    }

    // Check if test is not already completed
    if (state.isCompleted) {
      return false;
    }

    // Check if time is not up
    if (state.timeLeft <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Map database state to TestState
   */
  private mapDatabaseStateToTestState(data: any): TestState {
    return {
      examId: data.exam_id,
      sectionId: data.section_id,
      testType: data.test_type,
      testId: data.test_id,
      currentQuestion: data.current_question || 0,
      answers: data.answers || {},
      timeLeft: data.time_left || 0,
      startTime: new Date(data.start_time).getTime(),
      flagged: data.flagged_questions || [],
      selectedLanguage: data.selected_language || 'english',
      isCompleted: data.is_completed || false,
      lastSaved: new Date(data.updated_at)
    };
  }

  /**
   * Map stored state to TestState
   */
  private mapStoredStateToTestState(data: any): TestState {
    return {
      examId: data.examId,
      sectionId: data.sectionId,
      testType: data.testType,
      testId: data.testId,
      currentQuestion: data.currentQuestion || 0,
      answers: data.answers || {},
      timeLeft: data.timeLeft || 0,
      startTime: data.startTime || Date.now(),
      flagged: data.flagged || [],
      selectedLanguage: data.selectedLanguage || 'english',
      isCompleted: data.isCompleted || false,
      lastSaved: new Date(data.lastSaved || Date.now())
    };
  }

  /**
   * Get recovery statistics
   */
  async getRecoveryStats(userId: string): Promise<{
    totalIncomplete: number;
    recentRecoveries: number;
    averageRecoveryTime: number;
  }> {
    try {
      const incompleteTests = await this.getIncompleteTests(userId);
      
      // Get recent recoveries (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentRecoveries = incompleteTests.filter(test => 
        new Date(test.lastSaved) > sevenDaysAgo
      ).length;

      // Calculate average recovery time (simplified)
      const averageRecoveryTime = incompleteTests.length > 0 
        ? incompleteTests.reduce((sum, test) => sum + test.timeLeft, 0) / incompleteTests.length
        : 0;

      return {
        totalIncomplete: incompleteTests.length,
        recentRecoveries,
        averageRecoveryTime: Math.round(averageRecoveryTime)
      };
    } catch (error) {
      console.error('Failed to get recovery stats:', error);
      return {
        totalIncomplete: 0,
        recentRecoveries: 0,
        averageRecoveryTime: 0
      };
    }
  }
}

export const testStateRecoveryService = TestStateRecoveryService.getInstance();
