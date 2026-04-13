// Van Calendar API - Weekly Route Planning System
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Supabase client - MUST use production project where van_db table exists
// This edge function runs on Make's project (mcbbtrrhqweypfnlzwht) but needs to query
// data from the production project (xspogpfohjmkykfjadhk) where van_db table lives
const SUPABASE_URL = 'https://xspogpfohjmkykfjadhk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQzNzE2MywiZXhwIjoyMDgxMDEzMTYzfQ.BWz0YhRHXPMRaD5V7QT3v8pnMEUNWMTWTJ0SXtMWPlg';

console.log('[Van Calendar Server] 🔧 Using PRODUCTION Supabase URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get authenticated user (Direct DB mode - uses X-User-Id header or body userId)
async function getAuthUser(req: any, bodyUserId?: string) {
  // Try X-User-Id header first
  const headerUserId = req.header ? req.header('X-User-Id') : null;
  const userId = headerUserId || bodyUserId;

  if (userId) {
    const { data: userData } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userData) return userData;
  }

  throw new Error('Authentication required - missing X-User-Id header or user_id in body');
}

// Calculate week end date (always Saturday)
function calculateWeekEnd(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 6);
  return date.toISOString().split('T')[0];
}

// Get current or next Sunday
function getNextSunday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  
  return nextSunday.toISOString().split('T')[0];
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

app.post('/check-conflicts', async (c) => {
  try {
    const body = await c.req.json();
    const { van_id, week_start_date, daily_plans, user_id } = body;

    console.log('🔍 Checking conflicts for van:', van_id, 'week:', week_start_date);

    // Get all existing plans for this week (excluding this van)
    const { data: existingPlans, error } = await supabase
      .from('van_calendar_plans')
      .select('*')
      .eq('week_start_date', week_start_date)
      .eq('status', 'active')
      .neq('van_id', van_id);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`📊 Found ${existingPlans?.length || 0} existing plans for this week`);

    const conflicts: any[] = [];

    // Extract all sites from the new plan
    const newScheduledSites: any[] = [];
    daily_plans.forEach((day: any) => {
      if (!day.is_rest_day && day.sites && day.sites.length > 0) {
        day.sites.forEach((site: any) => {
          newScheduledSites.push({
            date: day.date,
            day: day.day,
            site_id: site.site_id,
            site_name: site.site_name,
            time_slot: site.time_slot
          });
        });
      }
    });

    console.log(`📍 Checking ${newScheduledSites.length} sites against existing plans`);

    // Check against existing plans
    if (existingPlans && existingPlans.length > 0) {
      for (const scheduled of newScheduledSites) {
        for (const existing of existingPlans) {
          const existingDailyPlans = existing.daily_plans as any[];
          
          // Find matching day
          const matchingDay = existingDailyPlans.find(
            (d: any) => d.date === scheduled.date && !d.is_rest_day
          );

          if (matchingDay && matchingDay.sites) {
            // Check if same site is scheduled
            const siteConflict = matchingDay.sites.find(
              (s: any) => s.site_id === scheduled.site_id
            );

            if (siteConflict) {
              // Check time slot overlap
              const hasTimeConflict = 
                !scheduled.time_slot || 
                !siteConflict.time_slot || 
                scheduled.time_slot === siteConflict.time_slot ||
                scheduled.time_slot === 'Full Day' ||
                siteConflict.time_slot === 'Full Day';

              if (hasTimeConflict) {
                // Get van details
                const { data: vanData } = await supabase
                  .from('van_db')
                  .select('number_plate')
                  .eq('id', existing.van_id)
                  .single();

                conflicts.push({
                  type: 'site_overlap',
                  date: scheduled.date,
                  day: scheduled.day,
                  site_name: scheduled.site_name,
                  time_slot: scheduled.time_slot,
                  conflicting_van: vanData?.number_plate || 'Unknown',
                  conflicting_zsm: existing.zsm_name,
                  conflicting_zsm_phone: existing.zsm_phone,
                  conflicting_time_slot: siteConflict.time_slot
                });

                console.log('⚠️ Conflict detected:', conflicts[conflicts.length - 1]);
              }
            }
          }
        }
      }
    }

    console.log(`✅ Conflict check complete: ${conflicts.length} conflicts found`);

    return c.json({
      success: true,
      conflicts,
      has_conflicts: conflicts.length > 0
    });

  } catch (error: any) {
    console.error('❌ Check conflicts error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// CREATE WEEKLY PLAN
// ============================================================================

app.post('/create', async (c) => {
  try {
    console.log('📝 Van Calendar CREATE endpoint hit');
    console.log('🔧 Server connected to Supabase URL:', SUPABASE_URL);
    
    const body = await c.req.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    const {
      week_start_date,
      van_id,
      rest_day,
      daily_plans,
      user_id,
      user_name,
      user_phone,
      user_zone
    } = body;

    console.log('📝 Creating van calendar plan:', {
      week_start_date,
      van_id,
      user_name,
      user_zone
    });

    // Get user details if user_id provided
    let userData: any = null;
    if (user_id) {
      const { data } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', user_id)
        .single();
      userData = data;
    }

    // Use provided user data or fallback to fetched userData
    const zsmName = user_name || userData?.full_name || userData?.name || 'Unknown';
    const zsmPhone = user_phone || userData?.phone_number || userData?.phone || '';
    const zsmZone = user_zone || userData?.zone || '';
    const zsmId = user_id || userData?.id;

    // Calculate week end
    const week_end_date = calculateWeekEnd(week_start_date);

    // Get van details
    console.log('🔍 Looking up van with ID:', van_id, 'Type:', typeof van_id);
    console.log('🔍 Querying van_db table in database:', SUPABASE_URL);
    
    const { data: vanData, error: vanError } = await supabase
      .from('van_db')
      .select('*')
      .eq('id', van_id)
      .single();

    if (vanError || !vanData) {
      console.error('❌ Van not found. ID:', van_id, 'Error:', vanError);
      
      // Debug: Check what vans exist in THIS database
      const { data: allVans, error: listError } = await supabase
        .from('van_db')
        .select('id, number_plate, zone')
        .order('number_plate')
        .limit(10);
      
      console.log('✅ Available vans in database (first 10):', allVans);
      console.log('�� Database being queried:', SUPABASE_URL);
      
      return c.json({ 
        success: false, 
        error: 'Van not found',
        details: vanError?.message || 'Van ID does not exist in database',
        van_id_received: van_id,
        van_id_type: typeof van_id
      }, 404);
    }

    // Count total sites
    let totalSites = 0;
    const zonesSet = new Set<string>();

    daily_plans.forEach((day: any) => {
      if (!day.is_rest_day && day.sites) {
        totalSites += day.sites.length;
        day.sites.forEach((site: any) => {
          if (site.site_zone) zonesSet.add(site.site_zone);
        });
      }
    });

    console.log(`📊 Total sites planned: ${totalSites}`);

    // Create plan
    const { data, error } = await supabase
      .from('van_calendar_plans')
      .insert({
        week_start_date,
        week_end_date,
        van_id,
        van_numberplate: vanData.number_plate,
        zsm_id: zsmId,
        zsm_name: zsmName,
        zsm_phone: zsmPhone,
        zsm_zone: zsmZone,
        rest_day,
        daily_plans,
        total_sites_planned: totalSites,
        zones_covered: Array.from(zonesSet),
        status: 'active',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating plan:', error);
      throw error;
    }

    console.log('✅ Van calendar plan created successfully:', data.id);

    return c.json({
      success: true,
      data,
      message: 'Van calendar created successfully'
    });

  } catch (error: any) {
    console.error('❌ Create calendar error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET PLANS BY WEEK
// ============================================================================

app.get('/week/:date', async (c) => {
  try {
    const user = await getAuthUser(c.req);
    const weekStart = c.req.param('date');

    // Get all plans for this week
    const { data, error } = await supabase
      .from('van_calendar_plans')
      .select('*')
      .eq('week_start_date', weekStart)
      .eq('status', 'active')
      .order('van_numberplate');

    if (error) throw error;

    return c.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('Get week plans error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET PLAN BY VAN
// ============================================================================

app.get('/van/:van_id/week/:date', async (c) => {
  try {
    const user = await getAuthUser(c.req);
    const vanId = parseInt(c.req.param('van_id'));
    const weekStart = c.req.param('date');

    const { data, error } = await supabase
      .from('van_calendar_plans')
      .select('*')
      .eq('van_id', vanId)
      .eq('week_start_date', weekStart)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return c.json({
      success: true,
      data: data || null,
      exists: !!data
    });

  } catch (error: any) {
    console.error('Get van plan error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// COPY LAST WEEK
// ============================================================================

app.get('/copy-last-week/:van_id', async (c) => {
  try {
    const vanId = parseInt(c.req.param('van_id'));

    console.log('📋 Copying last week plan for van:', vanId);

    // Get last week's start date
    const nextSunday = getNextSunday();
    const lastWeekDate = new Date(nextSunday);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeekStart = lastWeekDate.toISOString().split('T')[0];

    console.log('🔍 Looking for plan from week:', lastWeekStart);

    // Fetch last week's plan
    const { data: lastPlan, error } = await supabase
      .from('van_calendar_plans')
      .select('*')
      .eq('van_id', vanId)
      .eq('week_start_date', lastWeekStart)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      throw error;
    }

    if (!lastPlan) {
      console.log('ℹ️ No previous plan found');
      return c.json({
        success: true,
        data: null,
        message: 'No previous plan found'
      });
    }

    console.log('✅ Found last week plan, cloning...');

    // Clone daily plans with updated dates
    const dailyPlans = (lastPlan.daily_plans as any[]).map((day, idx) => {
      const newDate = new Date(nextSunday);
      newDate.setDate(newDate.getDate() + idx);

      return {
        ...day,
        date: newDate.toISOString().split('T')[0]
      };
    });

    return c.json({
      success: true,
      data: {
        rest_day: lastPlan.rest_day,
        daily_plans: dailyPlans
      },
      message: 'Last week plan loaded'
    });

  } catch (error: any) {
    console.error('❌ Copy last week error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// ZSM CHECKLIST
// ============================================================================

app.get('/zsm-checklist/:week_start', async (c) => {
  try {
    const user = await getAuthUser(c.req);
    const weekStart = c.req.param('week_start');

    // Get all ZSMs
    const { data: zsms, error: zsmsError } = await supabase
      .from('app_users')
      .select('id, name, zone, phone')
      .eq('role', 'zonal_sales_manager')
      .order('zone');

    if (zsmsError) throw zsmsError;

    // Get all plans for this week
    const { data: plans, error: plansError } = await supabase
      .from('van_calendar_plans')
      .select('zsm_id, van_numberplate, total_sites_planned')
      .eq('week_start_date', weekStart)
      .eq('status', 'active');

    if (plansError) throw plansError;

    // Build checklist
    const checklist = (zsms || []).map((zsm: any) => {
      const zsmPlans = (plans || []).filter((p: any) => p.zsm_id === zsm.id);

      return {
        zsm_id: zsm.id,
        zsm_name: zsm.name,
        zone: zsm.zone,
        phone: zsm.phone,
        has_submitted: zsmPlans.length > 0,
        plans_count: zsmPlans.length,
        vans: zsmPlans.map((p: any) => p.van_numberplate),
        total_sites: zsmPlans.reduce((sum: number, p: any) => sum + (p.total_sites_planned || 0), 0)
      };
    });

    const totalSubmitted = checklist.filter((z: any) => z.has_submitted).length;
    const totalZSMs = checklist.length;
    const completionRate = totalZSMs > 0 ? Math.round((totalSubmitted / totalZSMs) * 100) : 0;

    return c.json({
      success: true,
      data: {
        checklist,
        stats: {
          total_zsms: totalZSMs,
          submitted: totalSubmitted,
          pending: totalZSMs - totalSubmitted,
          completion_rate: completionRate
        }
      }
    });

  } catch (error: any) {
    console.error('ZSM checklist error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// UPDATE PLAN
// ============================================================================

app.put('/:plan_id', async (c) => {
  try {
    const user = await getAuthUser(c.req);
    const planId = c.req.param('plan_id');
    const body = await c.req.json();

    const { daily_plans, rest_day } = body;

    // Count total sites
    let totalSites = 0;
    const zonesSet = new Set<string>();

    daily_plans.forEach((day: any) => {
      if (!day.is_rest_day && day.sites) {
        totalSites += day.sites.length;
        day.sites.forEach((site: any) => {
          if (site.site_zone) zonesSet.add(site.site_zone);
        });
      }
    });

    // Update plan
    const { data, error } = await supabase
      .from('van_calendar_plans')
      .update({
        daily_plans,
        rest_day,
        total_sites_planned: totalSites,
        zones_covered: Array.from(zonesSet),
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .eq('zsm_id', user.id) // Can only update own plans
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      data,
      message: 'Plan updated successfully'
    });

  } catch (error: any) {
    console.error('Update plan error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// CALCULATE COMPLIANCE (Run after week ends)
// ============================================================================

app.post('/calculate-compliance/:week_start', async (c) => {
  try {
    const user = await getAuthUser(c.req);
    const weekStart = c.req.param('week_start');

    // Only HQ can trigger compliance calculation
    if (!['director', 'hq_command_center', 'developer'].includes(user.role)) {
      return c.json({ success: false, error: 'Insufficient permissions' }, 403);
    }

    const weekEnd = calculateWeekEnd(weekStart);

    // Get all plans for this week
    const { data: plans, error: plansError } = await supabase
      .from('van_calendar_plans')
      .select('*')
      .eq('week_start_date', weekStart)
      .eq('status', 'active');

    if (plansError) throw plansError;

    // Get Mini-Road Show program ID
    const { data: program } = await supabase
      .from('programs')
      .select('id')
      .ilike('title', '%mini%road%show%')
      .single();

    if (!program) {
      return c.json({ success: false, error: 'Mini-Road Show program not found' }, 404);
    }

    const results = [];

    for (const plan of plans || []) {
      // Get check-ins for this van during the week
      const { data: checkIns } = await supabase
        .from('program_submissions')
        .select('submission_data, created_at')
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd + 'T23:59:59')
        .eq('program_id', program.id);

      // Filter check-ins for this van (check submission_data for van match)
      const vanCheckIns = (checkIns || []).filter((check: any) => {
        const vanInSubmission = check.submission_data?.van_selection;
        return vanInSubmission === plan.van_numberplate;
      });

      // Extract actual visits
      const actualVisits = vanCheckIns.map((check: any) => ({
        date: check.created_at.split('T')[0],
        site: check.submission_data?.sites_working_today,
        site_id: check.submission_data?.site_id
      }));

      // Compare planned vs actual
      let matchedVisits = 0;
      let totalPlanned = 0;
      const missedSites: any[] = [];

      (plan.daily_plans as any[]).forEach((day: any) => {
        if (!day.is_rest_day && day.sites && day.sites.length > 0) {
          day.sites.forEach((plannedSite: any) => {
            totalPlanned++;

            const actualVisit = actualVisits.find(
              (a: any) => a.date === day.date && a.site === plannedSite.site_name
            );

            if (actualVisit) {
              matchedVisits++;
            } else {
              missedSites.push({
                day: day.day,
                date: day.date,
                site: plannedSite.site_name
              });
            }
          });
        }
      });

      // Find unplanned visits
      const unplannedVisits = actualVisits.filter((actual: any) => {
        const wasPlanned = (plan.daily_plans as any[]).some((day: any) =>
          day.sites?.some((s: any) => s.site_name === actual.site && day.date === actual.date)
        );
        return !wasPlanned;
      });

      // Calculate compliance rate
      const complianceRate = totalPlanned > 0
        ? Math.round((matchedVisits / totalPlanned) * 100)
        : 0;

      // Update plan with compliance data
      await supabase
        .from('van_calendar_plans')
        .update({
          compliance_data: {
            planned_sites: totalPlanned,
            actual_visits: actualVisits.length,
            matched_visits: matchedVisits,
            compliance_rate: complianceRate,
            missed_sites: missedSites,
            unplanned_visits: unplannedVisits.map((u: any) => ({
              day: new Date(u.date).toLocaleDateString('en-US', { weekday: 'long' }),
              date: u.date,
              site: u.site
            }))
          },
          status: 'completed'
        })
        .eq('id', plan.id);

      results.push({
        van: plan.van_numberplate,
        zsm: plan.zsm_name,
        compliance_rate: complianceRate,
        planned: totalPlanned,
        actual: matchedVisits
      });
    }

    return c.json({
      success: true,
      data: results,
      message: 'Compliance calculated for all vans'
    });

  } catch (error: any) {
    console.error('Calculate compliance error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET NEXT SUNDAY
// ============================================================================

app.get('/next-sunday', async (c) => {
  try {
    const nextSunday = getNextSunday();
    const weekEnd = calculateWeekEnd(nextSunday);

    return c.json({
      success: true,
      data: {
        week_start: nextSunday,
        week_end: weekEnd
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// FEATURE TOGGLE - Enable/Disable Van Calendar
// ============================================================================

// Enable Van Calendar feature
app.post('/feature/enable', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await getAuthUser(c.req);

    // Only HQ and Directors can toggle features
    if (!['hq_command_center', 'director'].includes(user.role)) {
      return c.json({ success: false, error: 'Unauthorized: Only HQ/Directors can manage features' }, 403);
    }

    // Set feature flag in KV store
    const { data, error } = await supabase
      .from('kv_store_28f2f653')
      .upsert({
        key: 'feature_van_calendar_enabled',
        value: 'true'
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      message: 'Van Calendar feature enabled',
      data
    });

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Disable Van Calendar feature
app.post('/feature/disable', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await getAuthUser(c.req);

    // Only HQ and Directors can toggle features
    if (!['hq_command_center', 'director'].includes(user.role)) {
      return c.json({ success: false, error: 'Unauthorized: Only HQ/Directors can manage features' }, 403);
    }

    // Set feature flag in KV store
    const { data, error } = await supabase
      .from('kv_store_28f2f653')
      .upsert({
        key: 'feature_van_calendar_enabled',
        value: 'false'
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      message: 'Van Calendar feature disabled',
      data
    });

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get Van Calendar feature status
app.get('/feature/status', async (c) => {
  try {
    const { data, error } = await supabase
      .from('kv_store_28f2f653')
      .select('value')
      .eq('key', 'feature_van_calendar_enabled')
      .maybeSingle();

    const enabled = data ? (data.value === 'true' || data.value === true) : true; // Default: enabled

    return c.json({
      success: true,
      enabled,
      message: enabled ? 'Van Calendar is enabled' : 'Van Calendar is disabled'
    });

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;