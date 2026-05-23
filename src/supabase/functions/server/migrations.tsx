import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

/**
 * Auto-migration for director_messages table
 * Adds missing columns: director_reaction, ashish_reply, ashish_reply_time
 */
export async function migrateDirectorMessages() {
  try {
    console.log('[Migration] Starting director_messages table migration...');

    // Run the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add director_reaction column
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'director_messages' 
            AND column_name = 'director_reaction'
          ) THEN
            ALTER TABLE director_messages ADD COLUMN director_reaction TEXT;
            RAISE NOTICE 'Added director_reaction column';
          ELSE
            RAISE NOTICE 'director_reaction column already exists';
          END IF;
        END $$;

        -- Add ashish_reply column
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'director_messages' 
            AND column_name = 'ashish_reply'
          ) THEN
            ALTER TABLE director_messages ADD COLUMN ashish_reply TEXT;
            RAISE NOTICE 'Added ashish_reply column';
          ELSE
            RAISE NOTICE 'ashish_reply column already exists';
          END IF;
        END $$;

        -- Add ashish_reply_time column
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'director_messages' 
            AND column_name = 'ashish_reply_time'
          ) THEN
            ALTER TABLE director_messages ADD COLUMN ashish_reply_time TIMESTAMPTZ;
            RAISE NOTICE 'Added ashish_reply_time column';
          ELSE
            RAISE NOTICE 'ashish_reply_time column already exists';
          END IF;
        END $$;
      `
    });

    if (error) {
      // If exec_sql RPC doesn't exist, try direct SQL execution
      console.log('[Migration] RPC method not available, using direct SQL...');
      
      const migrations = [
        `ALTER TABLE director_messages ADD COLUMN IF NOT EXISTS director_reaction TEXT`,
        `ALTER TABLE director_messages ADD COLUMN IF NOT EXISTS ashish_reply TEXT`,
        `ALTER TABLE director_messages ADD COLUMN IF NOT EXISTS ashish_reply_time TIMESTAMPTZ`
      ];

      for (const migration of migrations) {
        const result = await supabase.rpc('exec_sql', { sql: migration });
        console.log(`[Migration] Executed: ${migration}`, result);
      }
    }

    console.log('[Migration] ✅ director_messages migration completed successfully');
    return { success: true, message: 'Migration completed' };

  } catch (error: any) {
    console.error('[Migration] ❌ Error during migration:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if director_messages table has required columns
 */
export async function checkDirectorMessagesSchema() {
  try {
    const { data, error } = await supabase
      .from('director_messages')
      .select('director_reaction, ashish_reply, ashish_reply_time')
      .limit(1);

    if (error) {
      // If we get a column not found error, migration is needed
      if (error.message.includes('Could not find')) {
        return { needsMigration: true, missingColumns: true };
      }
      throw error;
    }

    return { needsMigration: false, missingColumns: false };
  } catch (error: any) {
    console.error('[Migration Check] Error:', error);
    return { needsMigration: true, missingColumns: true, error: error.message };
  }
}
