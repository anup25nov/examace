// Data storage verification utilities

import { supabase } from '@/integrations/supabase/client';
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface DataVerificationResult {
  supabase: {
    connected: boolean;
    tables: string[];
    error?: string;
  };
  firebase: {
    connected: boolean;
    collections: string[];
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

// Verify Firebase connection and data storage
export const verifyFirebaseConnection = async () => {
  try {
    // Test basic connection by trying to read a document
    const testDocRef = doc(db, 'test', 'connection');
    const testDoc = await getDoc(testDocRef);
    
    // If document doesn't exist, create a test document
    if (!testDoc.exists()) {
      await setDoc(testDocRef, {
        test: true,
        timestamp: serverTimestamp(),
        environment: import.meta.env.VITE_ENV || 'development'
      });
    }

    const collections = ['users', 'test'];
    
    return {
      connected: true,
      collections,
      error: undefined
    };
  } catch (error) {
    console.error('Firebase verification failed:', error);
    return {
      connected: false,
      collections: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Test data storage by creating a test record
export const testDataStorage = async () => {
  const results: DataVerificationResult = {
    supabase: { connected: false, tables: [] },
    firebase: { connected: false, collections: [] },
    environment: import.meta.env.VITE_ENV || 'development',
    timestamp: new Date().toISOString()
  };

  try {
    // Test Supabase
    results.supabase = await verifySupabaseConnection();
    
    // Test Firebase
    results.firebase = await verifyFirebaseConnection();
    
    // Log results
    console.log('📊 Data Storage Verification:', results);
    
    return results;
  } catch (error) {
    console.error('Data storage verification failed:', error);
    return results;
  }
};

// Test writing data to both databases
export const testDataWriting = async () => {
  const testData = {
    test: true,
    timestamp: new Date().toISOString(),
    environment: import.meta.env.VITE_ENV || 'development',
    userId: 'test-user-' + Date.now()
  };

  const results = {
    supabase: { success: false, error: undefined as string | undefined },
    firebase: { success: false, error: undefined as string | undefined }
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

  try {
    // Test Firebase write
    const testDocRef = doc(db, 'test_data', testData.userId);
    await setDoc(testDocRef, testData);
    results.firebase.success = true;
  } catch (error) {
    results.firebase.error = error instanceof Error ? error.message : 'Unknown error';
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
