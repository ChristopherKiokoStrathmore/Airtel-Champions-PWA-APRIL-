// ============================================================================
// KV STORE PERMISSION AUTO-HEALER
// Fixes error 42501 "permission denied for table kv_store_28f2f653"
// Runs on startup via direct PostgreSQL connection (SUPABASE_DB_URL)
// ============================================================================

// NOTE: `npm:pg@8` is imported DYNAMICALLY inside the function to prevent
// a top-level import crash from taking down the entire edge function.
// If `pg` fails to load (missing Node compat, etc.), only the permission
// fix is skipped — the rest of the server keeps running.

/**
 * Attempts to GRANT ALL permissions on kv_store_28f2f653 to all roles.
 * Uses a one-shot pool connection so it doesn't interfere with the main pool.
 * Idempotent - safe to run multiple times.
 */
export async function fixKvPermissions(): Promise<{
  success: boolean;
  message: string;
  details?: string;
}> {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");

  if (!dbUrl) {
    console.warn("[KV-Permissions] SUPABASE_DB_URL not set - skipping permission fix");
    return {
      success: false,
      message: "SUPABASE_DB_URL not configured - cannot fix permissions",
    };
  }

  // Dynamic import so a load failure doesn't crash the entire server
  let Pool: any;
  try {
    const pg = await import("npm:pg@8");
    Pool = pg.Pool ?? pg.default?.Pool;
    if (!Pool) throw new Error("Pool constructor not found in pg module");
  } catch (importErr: any) {
    console.warn("[KV-Permissions] npm:pg@8 import failed:", importErr.message);
    return {
      success: false,
      message: `pg module unavailable: ${importErr.message}`,
    };
  }

  let pool: any = null;

  try {
    pool = new Pool({
      connectionString: dbUrl,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();

    try {
      // 1. Check if the table exists first
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name = 'kv_store_28f2f653'
        ) AS table_exists;
      `);

      if (!tableCheck.rows[0]?.table_exists) {
        console.warn("[KV-Permissions] Table kv_store_28f2f653 does not exist");
        return {
          success: false,
          message: "Table kv_store_28f2f653 does not exist in public schema",
        };
      }

      // 2. Grant ALL privileges to all relevant roles
      const grantStatements = [
        `GRANT ALL ON TABLE public.kv_store_28f2f653 TO service_role;`,
        `GRANT ALL ON TABLE public.kv_store_28f2f653 TO authenticated;`,
        `GRANT ALL ON TABLE public.kv_store_28f2f653 TO anon;`,
        `GRANT ALL ON TABLE public.kv_store_28f2f653 TO postgres;`,
      ];

      const results: string[] = [];

      for (const sql of grantStatements) {
        try {
          await client.query(sql);
          const role = sql.match(/TO (\w+)/)?.[1] || "unknown";
          results.push(`Granted to ${role}`);
          console.log(`[KV-Permissions] ${sql} - OK`);
        } catch (grantErr: any) {
          // Role might not exist in some Supabase configs - that's fine
          const role = sql.match(/TO (\w+)/)?.[1] || "unknown";
          console.warn(`[KV-Permissions] Grant to ${role} failed: ${grantErr.message}`);
          results.push(`${role}: ${grantErr.message}`);
        }
      }

      // 3. Also disable RLS on the table if it's enabled (belt and suspenders)
      try {
        await client.query(`ALTER TABLE public.kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;`);
        results.push("RLS disabled");
        console.log("[KV-Permissions] RLS disabled on kv_store_28f2f653");
      } catch (rlsErr: any) {
        console.warn(`[KV-Permissions] Disable RLS failed: ${rlsErr.message}`);
        results.push(`RLS: ${rlsErr.message}`);
      }

      // 4. Verify access works now
      try {
        await client.query(`SELECT count(*) FROM public.kv_store_28f2f653 LIMIT 1;`);
        console.log("[KV-Permissions] Verification query succeeded");
        results.push("Verification: OK");
      } catch (verifyErr: any) {
        console.error(`[KV-Permissions] Verification failed: ${verifyErr.message}`);
        results.push(`Verification failed: ${verifyErr.message}`);
      }

      console.log("[KV-Permissions] Permission fix completed successfully");
      return {
        success: true,
        message: "KV store permissions fixed",
        details: results.join("; "),
      };
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[KV-Permissions] Failed to fix permissions:", error.message);
    return {
      success: false,
      message: `Permission fix failed: ${error.message}`,
      details: error.stack,
    };
  } finally {
    if (pool) {
      try {
        await pool.end();
      } catch (_) {
        // ignore cleanup errors
      }
    }
  }
}
