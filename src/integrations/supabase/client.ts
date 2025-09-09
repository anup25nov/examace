import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables with fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://talvssmwnsfotoutjlhd.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbHZzc213bnNmb3RvdXRqbGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjQ2NjMsImV4cCI6MjA3MjMwMDY2M30.kViEumcw7qxZeITgtZf91D-UVFY5PaFyXganLyh2Tok";

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('SUPABASE_URL:', SUPABASE_URL);
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  // Don't throw error in production, just log it
  if (import.meta.env.MODE === 'development') {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
  }
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
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

// Add global error handler for auth errors
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
  
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    console.log('Auth event:', event);
  }
  
  if (event === 'SIGNED_OUT') {
    // Clear any cached data when user signs out
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('lastVisitDate');
  }
  
  // Handle token refresh errors
  if (event === 'TOKEN_REFRESHED' && !session) {
    console.warn('Token refresh failed, clearing session');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('lastVisitDate');
  }
});