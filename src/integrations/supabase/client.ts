import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables - NO FALLBACKS IN PRODUCTION
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const errorMessage = 'Missing Supabase environment variables. Please check your .env file.';
  console.error(errorMessage);
  console.error('SUPABASE_URL:', SUPABASE_URL ? 'Present' : 'Missing');
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  
  // Always throw error - no fallbacks allowed for security
  throw new Error(errorMessage);
}

// Log environment info in development
if (import.meta.env.VITE_ENV === 'development') {
  console.log('🔧 Supabase Configuration:', {
    url: SUPABASE_URL,
    environment: import.meta.env.VITE_ENV,
    hasAnonKey: !!SUPABASE_ANON_KEY
  });
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: false, // Disabled for phone-based auth
    autoRefreshToken: false, // Disabled to prevent refresh token errors
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

// Note: Auth state change listener removed for phone-based authentication
// Phone-based auth doesn't use Supabase sessions, so no listener needed