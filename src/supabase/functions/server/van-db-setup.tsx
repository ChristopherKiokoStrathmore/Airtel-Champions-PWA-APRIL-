import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Van Database Setup
 * Creates van_db table and populates it with all 19 vans
 */

export async function setupVanDatabase() {
  console.log('[VanDBSetup] Starting van_db table setup...');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Check if table exists first
    const { data: existingVans, error: checkError } = await supabase
      .from('van_db')
      .select('id, number_plate')
      .limit(1);

    if (!checkError) {
      console.log('[VanDBSetup] ✅ van_db table already exists');
      
      // Count existing vans
      const { count } = await supabase
        .from('van_db')
        .select('*', { count: 'exact', head: true });
      
      console.log(`[VanDBSetup] Found ${count} vans in database`);
      
      return {
        success: true,
        message: `van_db table exists with ${count} vans`,
        vanCount: count
      };
    }

    // Table doesn't exist - cannot create programmatically
    console.log('[VanDBSetup] ⚠️ van_db table does not exist');
    console.log('[VanDBSetup] Manual setup required');
    
    return {
      success: false,
      error: 'van_db table not found',
      hint: 'Please run the setup SQL manually in Supabase Dashboard',
      needsManualSetup: true
    };

  } catch (error: any) {
    console.error('[VanDBSetup] Fatal error:', error);
    return {
      success: false,
      error: error.message,
      hint: 'Please run the SQL script from /database/VAN_DB_COMPLETE_SETUP.sql in Supabase Dashboard',
      needsManualSetup: true
    };
  }
}
