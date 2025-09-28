// Data storage verification utilities

import { supabase } from '@/integrations/supabase/client';

export interface DataVerificationResult {
  supabase: {
    connected: boolean;
    tables: string[];
    error?: string;
  };
  environment: string;
  timestamp: string;
}

// Verify Supabase connection and data storage
export const verifySupabaseConnection = async () => {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return {
        connected: false,
        tables: [],
        error: error.message
      };
    }

    // Get list of tables (this is a simple test)
    const tables = ['user_profiles', 'exam_stats', 'test_attempts', 'test_completions', 'user_streaks', 'individual_test_scores'];
    
    return {
      connected: true,
      tables,
      error: undefined
    };
  } catch (error) {
    console.error('Supabase verification failed:', error);
    return {
      connected: false,
      tables: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};


// Test data storage by creating a test record
export const testDataStorage = async () => {
  const results: DataVerificationResult = {
    supabase: { connected: false, tables: [] },
    environment: import.meta.env.VITE_ENV || 'development',
    timestamp: new Date().toISOString()
  };

  try {
    // Test Supabase
    results.supabase = await verifySupabaseConnection();
    
    // Log results
    console.log('📊 Data Storage Verification:', results);
    
    return results;
  } catch (error) {
    console.error('Data storage verification failed:', error);
    return results;
  }
};

// Test writing data to Supabase
export const testDataWriting = async () => {
  const testData = {
    test: true,
    timestamp: new Date().toISOString(),
    environment: import.meta.env.VITE_ENV || 'development',
    userId: 'test-user-' + Date.now()
  };

  const results = {
    supabase: { success: false, error: undefined as string | undefined }
  };

  try {
    // Test Supabase write
    const { error: supabaseError } = await supabase
      .from('user_profiles')
      .insert([{
        id: testData.userId,
        email: 'test@example.com',
        phone: '+911234567890',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (supabaseError) {
      results.supabase.error = supabaseError.message;
    } else {
      results.supabase.success = true;
    }
  } catch (error) {
    results.supabase.error = error instanceof Error ? error.message : 'Unknown error';
  }

  console.log('✍️ Data Writing Test:', results);
  return results;
};

// Initialize data verification on app start
export const initializeDataVerification = async () => {
  if (import.meta.env.VITE_ENV === 'development') {
    console.log('🔍 Initializing data storage verification...');
    
    // Run verification tests
    await testDataStorage();
    await testDataWriting();
    
    console.log('✅ Data storage verification completed');
  }
};
