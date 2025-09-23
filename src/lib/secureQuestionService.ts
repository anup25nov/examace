import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SecureQuestionData {
  id: string;
  questionEn: string;
  questionHi?: string;
  options: string[];
  optionsEn?: string[];
  optionsHi?: string[];
  correct: number;
  correctAnswerIndex?: number;
  difficulty: string;
  subject: string;
  topic: string;
  marks: number;
  negativeMarks: number;
  duration: number;
  explanation: string;
  explanationEn?: string;
  explanationHi?: string;
  questionImage?: string;
  imageUrl?: string;
  optionsImages?: string[];
  explanationImage?: string;
}

export interface SecureTestData {
  examInfo: {
    testName: string;
    duration: number;
    totalQuestions: number;
    subjects: string[];
    markingScheme: {
      correct: number;
      incorrect: number;
      unattempted: number;
    };
    defaultLanguage: string;
  };
  questions: SecureQuestionData[];
}

class SecureQuestionService {
  private static instance: SecureQuestionService;
  private cache = new Map<string, SecureTestData>();
  private encryptionKey = 'examace_secure_key_2024'; // In production, this should be from environment

  static getInstance(): SecureQuestionService {
    if (!SecureQuestionService.instance) {
      SecureQuestionService.instance = new SecureQuestionService();
    }
    return SecureQuestionService.instance;
  }

  // Simple obfuscation (in production, use proper encryption)
  private obfuscateData(data: any): string {
    const jsonString = JSON.stringify(data);
    const encoded = btoa(jsonString);
    // Simple XOR obfuscation
    let obfuscated = '';
    for (let i = 0; i < encoded.length; i++) {
      obfuscated += String.fromCharCode(encoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
    }
    return btoa(obfuscated);
  }

  private deobfuscateData(obfuscatedData: string): any {
    try {
      const decoded = atob(obfuscatedData);
      let deobfuscated = '';
      for (let i = 0; i < decoded.length; i++) {
        deobfuscated += String.fromCharCode(decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
      }
      return JSON.parse(atob(deobfuscated));
    } catch (error) {
      console.error('Error deobfuscating data:', error);
      return null;
    }
  }

  // Load questions securely with authentication
  async loadQuestions(
    examId: string,
    sectionId: string,
    testId: string,
    userId: string,
    isPremium: boolean = false
  ): Promise<SecureTestData | null> {
    const cacheKey = `${examId}-${sectionId}-${testId}-${userId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // First, verify user has access to this test
      const hasAccess = await this.verifyTestAccess(examId, sectionId, testId, userId, isPremium);
      if (!hasAccess) {
        throw new Error('Access denied: User does not have permission to access this test');
      }

      // Load questions from secure endpoint
      const { data, error } = await supabase.functions.invoke('get-test-questions', {
        body: {
          exam_id: examId,
          section_id: sectionId,
          test_id: testId,
          user_id: userId,
          is_premium: isPremium
        }
      });

      if (error) {
        console.error('Error loading secure questions:', error);
        // Fallback to obfuscated local data for development
        return await this.loadObfuscatedQuestions(examId, sectionId, testId);
      }

      if (!data || !data.questions) {
        throw new Error('No questions found for this test');
      }

      const testData: SecureTestData = {
        examInfo: data.examInfo,
        questions: data.questions
      };

      this.cache.set(cacheKey, testData);
      return testData;

    } catch (error) {
      console.error('Error loading secure questions:', error);
      return null;
    }
  }

  // Fallback method for development (obfuscated local data)
  private async loadObfuscatedQuestions(
    examId: string,
    sectionId: string,
    testId: string
  ): Promise<SecureTestData | null> {
    try {
      // Load obfuscated data from a secure endpoint
      const response = await fetch(`/api/secure-questions/${examId}/${sectionId}/${testId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          timestamp: Date.now(),
          nonce: Math.random().toString(36)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to load secure questions');
      }

      const obfuscatedData = await response.text();
      const testData = this.deobfuscateData(obfuscatedData);
      
      if (testData) {
        this.cache.set(`${examId}-${sectionId}-${testId}`, testData);
        return testData;
      }

      return null;
    } catch (error) {
      console.error('Error loading obfuscated questions:', error);
      return null;
    }
  }

  // Verify user has access to the test
  private async verifyTestAccess(
    examId: string,
    sectionId: string,
    testId: string,
    userId: string,
    isPremium: boolean
  ): Promise<boolean> {
    try {
      // Check if user has active membership for premium tests
      if (isPremium) {
        const { data: membership } = await supabase
          .from('user_memberships')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (!membership) {
          return false;
        }
      }

      // Check if user has started this test before (for completed tests)
      const { data: attempt } = await supabase
        .from('test_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('exam_id', examId)
        .eq('test_type', sectionId)
        .eq('test_id', testId)
        .single();

      // Allow access if user has attempted this test before or if it's a free test
      return !isPremium || !!attempt;

    } catch (error) {
      console.error('Error verifying test access:', error);
      return false;
    }
  }

  // Clear cache for a specific test
  clearTestCache(examId: string, sectionId: string, testId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${examId}-${sectionId}-${testId}`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get question data for a specific test (fallback method)
   */
  async getQuestionData(examId: string, sectionId: string, testId: string): Promise<any[] | null> {
    try {
      // This is a fallback method that returns empty array
      // In production, questions should be loaded through loadQuestions method
      console.warn('getQuestionData is deprecated. Use loadQuestions instead.');
      return [];
    } catch (error) {
      console.error('Error in getQuestionData:', error);
      return null;
    }
  }
}

export const secureQuestionService = SecureQuestionService.getInstance();
