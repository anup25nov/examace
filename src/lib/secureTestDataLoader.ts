/**
 * Secure Test Data Loader
 * Loads test metadata from database instead of JSON files
 */

import { createClient } from '@supabase/supabase-js';
import { examDataService } from '@/data/examData';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface SecureTestData {
  id: string;
  name: string;
  description: string;
  duration: number;
  questions: number;
  subjects: string[];
  isPremium: boolean;
  price: number;
  metadata: any;
  year?: string;
  papers?: any[];
  topics?: string[];
  difficulty?: string;
  icon?: string;
  color?: string;
}

export interface SecureTestDataByType {
  mock: SecureTestData[];
  pyq: SecureTestData[];
  practice: SecureTestData[];
}

class SecureTestDataLoader {
  private static instance: SecureTestDataLoader;
  private cache: Map<string, SecureTestDataByType> = new Map();

  private constructor() {}

  static getInstance(): SecureTestDataLoader {
    if (!SecureTestDataLoader.instance) {
      SecureTestDataLoader.instance = new SecureTestDataLoader();
    }
    return SecureTestDataLoader.instance;
  }

  /**
   * Get all test data for an exam from database
   */
  async getAllTestData(examId: string): Promise<SecureTestDataByType> {
    const cacheKey = examId;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      console.log('🔍 [secureTestDataLoader] Loading test data for exam:', examId);
      
      // Use centralized data as primary source
      console.log('🔄 [secureTestDataLoader] Using centralized data source...');
      const centralizedData = examDataService.getAllTestData(examId);
      
      if (centralizedData.mock.length === 0 && centralizedData.pyq.length === 0 && centralizedData.practice.length === 0) {
        console.log('⚠️ [secureTestDataLoader] No centralized data found, trying database...');
        
        // Try database as fallback
        let testData = null;
        let error = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          console.log(`🔄 [secureTestDataLoader] Database attempt ${attempt}/${maxRetries}`);
          
          const result = await supabase
            .from('exam_test_data')
            .select('*')
            .eq('exam_id', examId)
            .order('test_type', { ascending: true })
            .order('name', { ascending: true });
          
          if (result.error) {
            error = result.error;
            console.error(`❌ [secureTestDataLoader] Database attempt ${attempt} failed:`, result.error);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          } else {
            testData = result.data;
            error = null;
            break;
          }
        }

        if (error) {
          console.error('❌ [secureTestDataLoader] Database fetch failed:', error);
          return centralizedData; // Return empty centralized data
        }

        if (!testData || testData.length === 0) {
          console.log('⚠️ [secureTestDataLoader] No database data found, using centralized data');
          return centralizedData;
        }

        console.log('✅ [secureTestDataLoader] Found', testData.length, 'tests in database');
        // Process database data and return
        return this.processDatabaseData(testData);
      }

      console.log('✅ [secureTestDataLoader] Using centralized data:', {
        mock: centralizedData.mock.length,
        pyq: centralizedData.pyq.length,
        practice: centralizedData.practice.length
      });
      
      this.cache.set(cacheKey, centralizedData);
      return centralizedData;

    } catch (error) {
      console.error('❌ [secureTestDataLoader] Error in getAllTestData:', error);
      console.log('🔄 [secureTestDataLoader] Using centralized data source...');
      return examDataService.getAllTestData(examId);
    }
  }

  /**
   * Process database data into the expected format
   */
  private processDatabaseData(testData: any[]): SecureTestDataByType {
    const result: SecureTestDataByType = {
      mock: [],
      pyq: [],
      practice: []
    };

    testData.forEach(test => {
      const secureTest: SecureTestData = {
        id: test.test_id || test.id,
        name: test.name,
        description: test.description || '',
        duration: test.duration_minutes || test.duration,
        questions: test.total_questions || test.questions,
        subjects: test.subjects || [],
        isPremium: test.is_premium || false,
        price: test.price || 0,
        metadata: test.metadata || {}
      };

      switch (test.test_type) {
        case 'mock':
          result.mock.push(secureTest);
          break;
        case 'pyq':
          result.pyq.push(secureTest);
          break;
        case 'practice':
          result.practice.push(secureTest);
          break;
      }
    });

    return result;
  }

  /**
   * Get test data for a specific type
   */
  async getTestDataByType(examId: string, testType: 'mock' | 'pyq' | 'practice'): Promise<SecureTestData[]> {
    const allData = await this.getAllTestData(examId);
    return allData[testType] || [];
  }

  /**
   * Get a specific test
   */
  async getTest(examId: string, testType: string, testId: string): Promise<SecureTestData | null> {
    try {
      const { data, error } = await supabase
        .from('exam_test_data')
        .select('*')
        .eq('exam_id', examId)
        .eq('test_type', testType)
        .eq('test_id', testId)
        .single();

      if (error) {
        console.error('Error fetching specific test:', error);
        return null;
      }

      return {
        id: data.test_id,
        name: data.name,
        description: data.description || '',
        duration: data.duration_minutes,
        questions: data.total_questions,
        subjects: data.subjects || [],
        isPremium: data.is_premium || false,
        price: data.price || 0,
        metadata: data.metadata || {}
      };

    } catch (error) {
      console.error('Error in getTest:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const secureTestDataLoader = SecureTestDataLoader.getInstance();
