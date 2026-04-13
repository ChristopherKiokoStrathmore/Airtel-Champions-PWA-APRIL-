import { createClient } from '@supabase/supabase-js';

// Singleton Supabase client to prevent multiple instances
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. ' +
    'Please set these in your .env file.'
  );
}

// Check if client already exists in window to prevent duplicates
declare global {
  interface Window {
    __AIRTEL_CHAMPIONS_SUPABASE_CLIENT__?: any;
  }
}

// Create or return existing singleton instance
if (!window.__AIRTEL_CHAMPIONS_SUPABASE_CLIENT__) {
  // Singleton client creation - logging removed for production
  window.__AIRTEL_CHAMPIONS_SUPABASE_CLIENT__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // Disable session persistence to avoid conflicts
      storageKey: 'airtel-champions-auth', // Unique storage key to prevent conflicts
      autoRefreshToken: false, // Disable auto-refresh since we're not using auth sessions
      detectSessionInUrl: false, // Don't look for auth tokens in URL
    },
  });
} else {
  // Reusing existing singleton client - logging removed for production
}

export const supabase = window.__AIRTEL_CHAMPIONS_SUPABASE_CLIENT__;

// Getter function for compatibility
export function getSupabaseClient() {
  return supabase;
}

// Export credentials for direct use if needed
export { SUPABASE_URL, SUPABASE_ANON_KEY };