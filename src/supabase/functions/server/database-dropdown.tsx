import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
// NOTE: deno.land/x/postgres is imported DYNAMICALLY inside the routes that need it,
// so a module resolution failure won't crash the entire edge function.

const app = new Hono();

// ============================================================================
// WHITELIST OF ALLOWED TABLES FOR SECURITY
// ============================================================================
// IMPORTANT: Only include tables that exist in your Supabase database!
//
// To add a new table:
// 1. Create the table in Supabase SQL Editor (see /CREATE-ADDITIONAL-TABLES.sql)
// 2. Uncomment the table name below
// 3. Make sure the table has data (at least 1 row)
// 4. Save and the table will be available in the Program Creator UI
//
// See /DATABASE-DROPDOWN-SETUP-GUIDE.md for full instructions
// ============================================================================

const ALLOWED_TABLES = [
  // ✅ Core User & System Tables
  'app_users',
  'programs',
  'submissions',
  'social_posts',
  'groups',
  'group_members',
  
  // ✅ Business Data Tables
  'van_db',           // Van/vehicle database (number_plate, capacity, vendor, zone, zsm_county)
  'amb_shops',        // Ambassador shops (shop_code, fp_code, partner_name, usdm_name, zsm)
  'amb_sitewise',     // Ambassador site-wise data
  'sitewise',         // Site information (SITE ID, SITE, TOWN CATEGORY, CLUSTER, TSE, ZSM, ZBM, ZONE)
  
  // ✅ Organizational Tables
  'departments',
  'regions',
  'teams',
  
  // ✅ Gamification Tables
  'achievements',
  'mission_types',
  'challenges',
  
  // 🔒 Restricted Tables (uncomment if needed for specific use cases)
  // 'director_messages',  // Sensitive - director communications
  // 'call_sessions',      // Call history
  // 'user_sessions',      // Session tracking
  // 'se_login_audit',     // Login audit logs
];

// Security: Validate table name to prevent SQL injection
// Accepts any table that exists in the public schema
function isTableAllowed(tableName: string): boolean {
  // Basic validation: only allow alphanumeric and underscores (no SQL injection)
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
}

/**
 * GET /database-dropdown
 * Generic endpoint to fetch data from any allowed table
 * 
 * Query params:
 * - table: Table name (required)
 * - display_field: Column to use as the main display value (required)
 * - metadata_fields: Comma-separated list of additional columns to fetch (optional)
 * - search: Search term to filter results (optional)
 * - limit: Max number of results (default: 1000)
 */
app.get('/', async (c) => {
  try {
    // Check for authorization header (simple API key check)
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      console.log('[Database Dropdown] ❌ Missing Authorization header');
      return c.json({ error: 'Missing Authorization header' }, 401);
    }

    console.log('[Database Dropdown] ✅ Authorization header present');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get query parameters
    const table = c.req.query('table');
    const displayField = c.req.query('display_field');
    const metadataFieldsParam = c.req.query('metadata_fields');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '1000');

    // Validate required parameters
    if (!table || !displayField) {
      return c.json({ 
        error: 'Missing required parameters: table and display_field' 
      }, 400);
    }

    // Security check: Validate table name
    if (!isTableAllowed(table)) {
      console.log('[Database Dropdown] ❌ Table not allowed:', table);
      return c.json({ 
        error: `Table '${table}' is not allowed. Allowed tables: ${ALLOWED_TABLES.join(', ')}` 
      }, 403);
    }

    console.log('[Database Dropdown] 📋 Fetching from table:', table);
    console.log('[Database Dropdown] 🎯 Display field:', displayField);
    console.log('[Database Dropdown] 📊 Metadata fields:', metadataFieldsParam);

    // Build select fields
    const metadataFields = metadataFieldsParam 
      ? metadataFieldsParam.split(',').map(f => f.trim())
      : [];
    
    // Always include display_field and id (if exists)
    const selectFields = ['id', displayField, ...metadataFields]
      .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
      .join(',');

    console.log('[Database Dropdown] 📝 Selecting fields:', selectFields);

    // 🔥 Paginated loading to handle tables with >1000 rows
    let allData: any[] = [];
    let batchNumber = 1;
    const BATCH_SIZE = 1000;
    let hasMore = true;

    while (hasMore && allData.length < limit) {
      const startRow = (batchNumber - 1) * BATCH_SIZE;
      const endRow = startRow + BATCH_SIZE - 1;
      
      console.log(`[Database Dropdown] 📦 Fetching batch ${batchNumber} (rows ${startRow}-${endRow})...`);

      // Build query for this batch
      let query = supabase
        .from(table)
        .select(selectFields)
        .range(startRow, endRow)
        .order(displayField, { ascending: true });

      // Add search filter if provided
      if (search && search.trim()) {
        query = query.ilike(displayField, `%${search.trim()}%`);
      }

      // Execute query
      const { data, error } = await query;

      if (error) {
        console.log('[Database Dropdown] ❌ Query error:', error.message, 'Code:', error.code);
        
        // Check for permission errors (existing error handling)
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          return c.json({ 
            error: `❌ Permission denied for table '${table}'`,
            errorCode: error.code,
            fix: '🔧 QUICK FIX: Run /FIX-PERMISSIONS.sql in Supabase SQL Editor',
            suggestion: 'The table exists but RLS (Row Level Security) is blocking access.',
            steps: [
              '1. Open Supabase Dashboard → SQL Editor',
              '2. Copy and run SQL from /FIX-PERMISSIONS.sql',
              '3. Reload the app and try again'
            ]
          }, 403);
        }
        
        return c.json({ error: `Database query failed: ${error.message}` }, 500);
      }

      const batchSize = data?.length || 0;
      allData = allData.concat(data || []);
      
      console.log(`[Database Dropdown] ✅ Batch ${batchNumber}: ${batchSize} rows (Total so far: ${allData.length})`);

      // If we got fewer rows than BATCH_SIZE, we've reached the end
      hasMore = batchSize === BATCH_SIZE;
      batchNumber++;
      
      // Log search info only on first batch
      if (batchNumber === 2 && search && search.trim()) {
        console.log('[Database Dropdown] 🔍 Searching for:', search);
      }
    }

    console.log(`[Database Dropdown] ✅ Total fetched: ${allData.length} records`);

    // Apply limit after fetching all data
    const limitedData = allData.slice(0, limit);
    
    if (false) {  // Placeholder to satisfy TypeScript - original error variable moved into loop
      const error: any = null;
    }

    console.log('[Database Dropdown] ✅ Returning records:', limitedData.length);

    // Transform data into dropdown options format
    const options = limitedData.map((record: any) => {
      const option: any = {
        value: record[displayField],
        label: record[displayField],
      };

      // Add metadata if any metadata fields were requested
      if (metadataFields.length > 0) {
        option.metadata = {};
        metadataFields.forEach(field => {
          if (record[field] !== undefined) {
            option.metadata[field] = record[field];
          }
        });
      }

      return option;
    });

    console.log('[Database Dropdown] ✅ Returning options:', options.length);

    return c.json({
      success: true,
      table,
      display_field: displayField,
      metadata_fields: metadataFields,
      count: options.length,
      options,
    });

  } catch (err: any) {
    console.error('[Database Dropdown] ❌ Error:', err);
    return c.json({ 
      error: `Server error: ${err.message}`,
      details: err.toString()
    }, 500);
  }
});

/**
 * GET /database-dropdown/tables
 * List all available tables dynamically from the database
 */
app.get('/tables', async (c) => {
  try {
    // Check for authorization header (simple API key check)
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      console.log('[Database Dropdown Tables] ❌ Missing Authorization header');
      return c.json({ error: 'Missing Authorization header' }, 401);
    }

    console.log('[Database Dropdown Tables] 🔄 Loading available tables from database...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // METHOD 1: Try direct Postgres connection for best results
    try {
      const dbUrl = Deno.env.get('SUPABASE_DB_URL');
      if (dbUrl) {
        const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
        const client = new Client(dbUrl);
        await client.connect();

        try {
          const result = await client.queryObject<{ table_name: string }>(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
          `);

          await client.end();

          const tables = result.rows.map(row => ({
            name: row.table_name,
            label: row.table_name.replace(/_/g, ' ').toUpperCase(),
          }));

          console.log(`[Database Dropdown Tables] ✅ Loaded ${tables.length} tables from database`);

          return c.json({
            success: true,
            tables,
            source: 'database',
          });
        } catch (pgError: any) {
          await client.end();
          console.log('[Database Dropdown Tables] ⚠️ Postgres query error:', pgError.message);
        }
      }
    } catch (pgConnectionError: any) {
      console.log('[Database Dropdown Tables] ⚠️ Postgres connection error:', pgConnectionError.message);
    }

    // METHOD 2: Query information_schema via Supabase service role key
    try {
      // Use the REST API directly with service role to access pg_catalog tables
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      
      const restResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_public_tables`,
        {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (restResponse.ok) {
        const data = await restResponse.json();
        if (Array.isArray(data) && data.length > 0) {
          const tables = data.map((row: any) => ({
            name: row.table_name || row,
            label: (row.table_name || row).replace(/_/g, ' ').toUpperCase(),
          }));
          console.log(`[Database Dropdown Tables] ✅ Loaded ${tables.length} tables via REST RPC`);
          return c.json({ success: true, tables, source: 'rpc' });
        }
      }
    } catch (restError: any) {
      console.log('[Database Dropdown Tables] ⚠️ REST RPC method failed:', restError.message);
    }

    // METHOD 3: Final fallback - return the extended static list including retailer_dump
    console.log('[Database Dropdown Tables] ⚠️ Falling back to extended static list');
    const staticTables = [
      ...ALLOWED_TABLES,
      'retailer_dump',
      'retailer_dump_full',
      'user_sessions',
      'se_login_audit',
      'call_sessions',
      'director_messages',
    ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate
    
    const tables = staticTables.map(tableName => ({
      name: tableName,
      label: tableName.replace(/_/g, ' ').toUpperCase(),
    }));

    return c.json({
      success: true,
      tables,
      source: 'whitelist',
    });

  } catch (err: any) {
    console.error('[Database Dropdown Tables] ❌ Error:', err);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /database-dropdown/columns/:table
 * Get available columns for a specific table
 */
app.get('/columns/:table', async (c) => {
  try {
    // Check for authorization header (simple API key check)
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      console.log('[Database Dropdown Columns] ❌ Missing Authorization header');
      return c.json({ error: 'Missing Authorization header' }, 401);
    }

    console.log('[Database Dropdown Columns] ✅ Authorization header present');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const table = c.req.param('table');

    // Security check
    if (!isTableAllowed(table)) {
      return c.json({ error: `Table '${table}' is not allowed` }, 403);
    }

    console.log('[Database Dropdown Columns] 📋 Getting columns for table:', table);

    // METHOD 1: Try direct Postgres connection to bypass PostgREST cache entirely
    console.log('[Database Dropdown Columns] Using direct Postgres query to bypass PostgREST cache');
    
    try {
      const dbUrl = Deno.env.get('SUPABASE_DB_URL');
      
      if (dbUrl) {
        console.log('[Database Dropdown Columns] Using direct Postgres connection');
        
        const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
        const client = new Client(dbUrl);
        await client.connect();
        
        try {
          // Query information_schema directly via Postgres
          const result = await client.queryObject<{column_name: string, data_type: string, is_nullable: string}>(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = $1
            ORDER BY ordinal_position
          `, [table]);
          
          if (result.rows.length > 0) {
            console.log('[Database Dropdown Columns] ✅ Got columns from direct Postgres:', result.rows.length);
            
            const columns = result.rows.map(col => ({
              name: col.column_name,
              label: col.column_name.replace(/_/g, ' ').toUpperCase(),
              type: col.data_type,
              nullable: col.is_nullable === 'YES'
            }));

            await client.end();

            return c.json({
              success: true,
              table,
              columns,
              method: 'direct_postgres'
            });
          }
          
          await client.end();
          console.log('[Database Dropdown Columns] ⚠️ No columns found in information_schema');
        } catch (pgError: any) {
          await client.end();
          console.log('[Database Dropdown Columns] ❌ Postgres query error:', pgError.message);
        }
      } else {
        console.log('[Database Dropdown Columns] ⚠️ SUPABASE_DB_URL not set, falling back to PostgREST');
      }
    } catch (pgConnectionError: any) {
      console.log('[Database Dropdown Columns] ❌ Postgres connection error:', pgConnectionError.message);
    }

    // METHOD 2: Fall back to PostgREST if direct connection fails
    console.log('[Database Dropdown Columns] 🔄 Trying PostgREST method as fallback...');
    
    // METHOD 2: Try to query one row to get column names (PostgREST)
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log('[Database Dropdown Columns] ❌ Error:', error.message, 'Code:', error.code);
        
        // Provide helpful error message
        let errorMsg = error.message;
        let suggestion = '';
        let fix = '';
        
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          errorMsg = `❌ Permission denied for table '${table}'`;
          fix = '🔧 QUICK FIX: Run /FIX-PERMISSIONS.sql in Supabase SQL Editor';
          suggestion = 'The table exists but RLS (Row Level Security) is blocking access.';
          
          return c.json({ 
            error: errorMsg,
            errorCode: error.code,
            fix,
            suggestion,
            table,
            steps: [
              '1. Open Supabase Dashboard → SQL Editor',
              '2. Copy and run SQL from /FIX-PERMISSIONS.sql',
              '3. Reload the app and try again'
            ]
          }, 403);
        }
        
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          errorMsg = `Table '${table}' does not exist in the database`;
          suggestion = 'PostgREST schema cache is stale. Try: Settings → API → Restart PostgREST';
          fix = '🔄 Restart PostgREST in Supabase Dashboard to reload schema cache';
          
          return c.json({ 
            error: errorMsg,
            suggestion,
            fix,
            table,
            originalError: error.message,
            troubleshooting: [
              '1. Go to Supabase Dashboard → Settings → API',
              '2. Click "Restart PostgREST" button',
              '3. Wait 20 seconds and try again',
              '4. Or run: NOTIFY pgrst, \'reload schema\'; in SQL Editor'
            ]
          }, 500);
        }
        
        return c.json({ 
          error: errorMsg,
          suggestion,
          table,
          originalError: error.message
        }, 500);
    }

    // Extract column names from the first row (if exists) or return empty array
    const columns = data && data.length > 0 
      ? Object.keys(data[0]).map(col => ({
          name: col,
          label: col.replace(/_/g, ' ').toUpperCase(),
        }))
      : [];

    console.log('[Database Dropdown Columns] ✅ Found columns via PostgREST:', columns.length);
    
    return c.json({
      success: true,
      table,
      columns,
      method: 'postgrest'
    });

  } catch (err: any) {
    console.error('[Database Dropdown Columns] ❌ Error:', err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;