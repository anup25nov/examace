import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Service role client for server-side operations that bypass RLS
// This should only be used for operations that need to bypass Row Level Security

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// For now, we'll use the anon key as fallback since we don't have service role key in env
// In production, you should add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file
const serviceKey = SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !serviceKey) {
  throw new Error('Missing Supabase configuration for service client');
}

// Create service client with different storage to prevent conflicts
export const supabaseService = createClient<Database>(SUPABASE_URL, serviceKey, {
  auth: {
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});
