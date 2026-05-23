import { createClient } from '@supabase/supabase-js';

// Singleton Supabase client to prevent multiple instances
const SUPABASE_URL = 'https://xspogpfohjmkykfjadhk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzcxNjMsImV4cCI6MjA4MTAxMzE2M30.C75SxALoWysJ6tHggNMC1fBvIXjzcQsfAGwAjrugGNg';

// Check if client already exists in window to prevent duplicates
declare global {
  interface Window {
    __AIRTEL_CHAMPIONS_SUPABASE_CLIENT__?: any;
  }
}

// Create or return existing singleton instance
if (!window.__AIRTEL_CHAMPIONS_SUPABASE_CLIENT__) {
  console.log('🔵 Creating NEW Supabase client (singleton)');
  window.__AIRTEL_CHAMPIONS_SUPABASE_CLIENT__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // Disable session persistence to avoid conflicts
      storageKey: 'airtel-champions-auth', // Unique storage key to prevent conflicts
      autoRefreshToken: false, // Disable auto-refresh since we're not using auth sessions
      detectSessionInUrl: false, // Don't look for auth tokens in URL
    },
  });
} else {
  console.log('♻️ Reusing existing Supabase client (singleton)');
}

export const supabase = window.__AIRTEL_CHAMPIONS_SUPABASE_CLIENT__;

// Getter function for compatibility
export function getSupabaseClient() {
  return supabase;
}

// Export credentials for direct use if needed
export { SUPABASE_URL, SUPABASE_ANON_KEY };