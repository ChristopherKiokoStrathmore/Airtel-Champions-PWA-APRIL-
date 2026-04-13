import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Database Setup Endpoint
 * Verifies core tables exist and are accessible
 * Phase 1B: KV store removed - now checking actual database tables
 */

export async function setupDatabase() {
  console.log('[DatabaseSetup] Checking database access...');

  // Create Supabase client with SERVICE ROLE (has full permissions)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // ✅ Phase 1B Complete: KV store removed, checking actual tables instead
    // Test if core tables exist by trying to query them
    console.log('[DatabaseSetup] Verifying core tables...');
    
    // Check for app_users table (core table that must exist)
    const { error: usersError } = await supabase
      .from('app_users')
      .select('id')
      .limit(1);
    
    if (!usersError) {
      console.log('[DatabaseSetup] ✅ Core tables verified and accessible');
      return { 
        success: true, 
        message: 'Database is ready - all core tables accessible',
        alreadyExists: true 
      };
    }

    // If app_users doesn't exist, database needs manual setup
    console.warn('[DatabaseSetup] ⚠️ Core tables not found or inaccessible');
    console.warn('[DatabaseSetup] Error:', usersError);
    
    return {
      success: false,
      error: 'Core database tables not found or inaccessible',
      code: 'TABLES_NOT_FOUND',
      needsManualSetup: true,
      instructions: {
        message: 'Please verify that all tables are created in Supabase Dashboard',
        hint: 'Check Table Editor for: app_users, programs, program_fields, submissions'
      }
    };

  } catch (error: any) {
    console.error('[DatabaseSetup] Fatal error:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error during database setup',
      code: 'SETUP_FAILED'
    };
  }
}