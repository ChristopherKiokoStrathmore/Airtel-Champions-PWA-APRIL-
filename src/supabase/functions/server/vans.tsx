// Van Database Management API
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";

const vansApp = new Hono();

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Verify user is authenticated (simplified for localStorage-based auth)
async function authenticateUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  // For this app, we just check that the header exists
  // Actual user validation is done on the client side with localStorage
  return { authenticated: true };
}

// ============================================================================
// GET /vans - Fetch all vans or search by query
// ============================================================================
vansApp.get('/make-server-28f2f653/vans', async (c) => {
  try {
    console.log('[Vans API] GET /vans - Fetching vans from database');
    
    // Authenticate user
    const authHeader = c.req.header('Authorization');
    await authenticateUser(authHeader);

    // Get optional search query parameter
    const searchQuery = c.req.query('search')?.toLowerCase() || '';
    const zone = c.req.query('zone') || '';

    console.log('[Vans API] Search query:', searchQuery);
    console.log('[Vans API] Zone filter:', zone);

    // Query the van_db table
    let query = supabase
      .from('van_db')
      .select('*')
      .order('number_plate', { ascending: true });

    // Apply filters if provided
    if (searchQuery) {
      query = query.or(`number_plate.ilike.%${searchQuery}%,vendor.ilike.%${searchQuery}%,zone.ilike.%${searchQuery}%`);
    }

    if (zone) {
      query = query.ilike('zone', zone);
    }

    const { data: vans, error } = await query;

    if (error) {
      console.error('[Vans API] Error fetching vans:', error);
      throw new Error(`Failed to fetch vans: ${error.message}`);
    }

    console.log(`[Vans API] ✅ Successfully fetched ${vans?.length || 0} vans`);

    return c.json({
      success: true,
      vans: vans || [],
      count: vans?.length || 0,
    });

  } catch (error: any) {
    console.error('[Vans API] Error in GET /vans:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to fetch vans',
      },
      500
    );
  }
});

// ============================================================================
// GET /vans/:numberPlate - Get van details by number plate
// ============================================================================
vansApp.get('/make-server-28f2f653/vans/:numberPlate', async (c) => {
  try {
    const numberPlate = c.req.param('numberPlate');
    console.log('[Vans API] GET /vans/:numberPlate - Fetching van:', numberPlate);
    
    // Authenticate user
    const authHeader = c.req.header('Authorization');
    await authenticateUser(authHeader);

    // Query the van_db table
    const { data: van, error } = await supabase
      .from('van_db')
      .select('*')
      .eq('number_plate', numberPlate)
      .single();

    if (error) {
      console.error('[Vans API] Error fetching van:', error);
      throw new Error(`Failed to fetch van: ${error.message}`);
    }

    if (!van) {
      return c.json(
        {
          success: false,
          error: 'Van not found',
        },
        404
      );
    }

    console.log('[Vans API] ✅ Successfully fetched van:', van);

    return c.json({
      success: true,
      van,
    });

  } catch (error: any) {
    console.error('[Vans API] Error in GET /vans/:numberPlate:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to fetch van',
      },
      500
    );
  }
});

export default vansApp;