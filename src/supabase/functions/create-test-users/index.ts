// =====================================================
// SUPABASE EDGE FUNCTION: Create Test Users
// =====================================================
// This function creates both auth users AND profile data
// in one automated script. Run once to set up all test users.
//
// Deploy: supabase functions deploy create-test-users
// Run: POST to https://YOUR-PROJECT.supabase.co/functions/v1/create-test-users
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestUser {
  email: string;
  password: string;
  phone: string;
  full_name: string;
  employee_id: string;
  role: string;
  zone?: string;
  region: string;
  zsm?: string;
  zbm?: string;
  total_points: number;
  rank: number;
  level: number;
  current_streak: number;
  longest_streak: number;
}

const TEST_USERS: TestUser[] = [
  // 1. John Kamau - Field Agent (Top Performer)
  {
    email: 'john.kamau@airtel.co.ke',
    password: 'JohnTAI@2024!',
    phone: '0712345001',
    full_name: 'John Kamau',
    employee_id: 'EMP001',
    role: 'field_agent',
    zone: 'Zone 1',
    region: 'Nairobi',
    zsm: 'Alice Mwangi',
    zbm: 'David Ochieng',
    total_points: 850,
    rank: 1,
    level: 17,
    current_streak: 45,
    longest_streak: 60,
  },
  
  // 2. Alice Mwangi - Zone Commander
  {
    email: 'alice.mwangi@airtel.co.ke',
    password: 'AliceTAI@2024!',
    phone: '0711111001',
    full_name: 'Alice Mwangi',
    employee_id: 'ZSM01',
    role: 'zone_commander',
    zone: 'Zone 1',
    region: 'Nairobi',
    total_points: 0,
    rank: 999,
    level: 1,
    current_streak: 0,
    longest_streak: 0,
  },
  
  // 3. David Ochieng - Zone Business Lead
  {
    email: 'david.ochieng@airtel.co.ke',
    password: 'DavidTAI@2024!',
    phone: '0722222001',
    full_name: 'David Ochieng',
    employee_id: 'ZBM01',
    role: 'zone_business_lead',
    zone: 'Zone 1',
    region: 'Nairobi',
    total_points: 0,
    rank: 999,
    level: 1,
    current_streak: 0,
    longest_streak: 0,
  },
  
  // 4. Isaac Kiptoo - HQ Team
  {
    email: 'isaac.kiptoo@airtel.co.ke',
    password: 'IsaacTAI@2024!',
    phone: '0733333001',
    full_name: 'Isaac Kiptoo',
    employee_id: 'HQ01',
    role: 'hq_team',
    region: 'National',
    total_points: 0,
    rank: 999,
    level: 1,
    current_streak: 0,
    longest_streak: 0,
  },
  
  // 5. Ashish Azad - Director
  {
    email: 'ashish.azad@airtel.co.ke',
    password: 'AshishTAI@2024!',
    phone: '0744444001',
    full_name: 'Ashish Azad',
    employee_id: 'DIR01',
    role: 'director',
    region: 'National',
    total_points: 0,
    rank: 999,
    level: 1,
    current_streak: 0,
    longest_streak: 0,
  },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results = [];

    // Create each test user
    for (const testUser of TEST_USERS) {
      console.log(`Creating user: ${testUser.full_name}`);

      // 1. Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true, // Skip email verification for testing
        user_metadata: {
          phone: testUser.phone,
          full_name: testUser.full_name,
        },
      });

      if (authError) {
        console.error(`Auth error for ${testUser.email}:`, authError);
        results.push({
          user: testUser.full_name,
          status: 'failed',
          error: authError.message,
        });
        continue;
      }

      console.log(`Auth user created: ${authData.user.id}`);

      // 2. Create profile in users table
      const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: authData.user.id,
        email: testUser.email,
        phone_number: testUser.phone,
        full_name: testUser.full_name,
        employee_id: testUser.employee_id,
        role: testUser.role,
        zone: testUser.zone || null,
        region: testUser.region,
        zsm: testUser.zsm || null,
        zbm: testUser.zbm || null,
        total_points: testUser.total_points,
        rank: testUser.rank,
        level: testUser.level,
        current_streak: testUser.current_streak,
        longest_streak: testUser.longest_streak,
        last_submission_date: testUser.current_streak > 0 ? new Date().toISOString().split('T')[0] : null,
      });

      if (profileError) {
        console.error(`Profile error for ${testUser.email}:`, profileError);
        results.push({
          user: testUser.full_name,
          status: 'auth_created_profile_failed',
          error: profileError.message,
          user_id: authData.user.id,
        });
        continue;
      }

      console.log(`Profile created for: ${testUser.full_name}`);

      // 3. Create sample data for John Kamau (Field Agent)
      if (testUser.employee_id === 'EMP001') {
        const johnId = authData.user.id;
        
        // Get Alice's ID (Zone Commander)
        const { data: aliceData } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('employee_id', 'ZSM01')
          .single();

        const aliceId = aliceData?.id;

        // Create submissions
        await supabaseAdmin.from('submissions').insert([
          {
            agent_id: johnId,
            agent_name: 'John Kamau',
            agent_employee_id: 'EMP001',
            program_id: 1,
            program_name: 'Network Experience',
            program_icon: '📶',
            photo_url: 'https://placehold.co/600x400/3B82F6/FFFFFF?text=Network+Coverage',
            notes: 'Poor network coverage in Westlands area. Multiple customer complaints.',
            latitude: -1.2641,
            longitude: 36.8107,
            location_name: 'Westlands, Nairobi',
            captured_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'approved',
            reviewed_by: aliceId,
            reviewed_by_name: 'Alice Mwangi',
            review_notes: 'Excellent intel! Well documented.',
            reviewed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            points_earned: 10,
          },
          {
            agent_id: johnId,
            agent_name: 'John Kamau',
            agent_employee_id: 'EMP001',
            program_id: 2,
            program_name: 'Competition Conversion',
            program_icon: '🎯',
            photo_url: 'https://placehold.co/600x400/10B981/FFFFFF?text=Conversion',
            notes: 'Successfully converted Safaricom customer to Airtel.',
            latitude: -1.2921,
            longitude: 36.8219,
            location_name: 'CBD, Nairobi',
            captured_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'approved',
            reviewed_by: aliceId,
            reviewed_by_name: 'Alice Mwangi',
            review_notes: 'Great work!',
            reviewed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            points_earned: 10,
          },
          {
            agent_id: johnId,
            agent_name: 'John Kamau',
            agent_employee_id: 'EMP001',
            program_id: 3,
            program_name: 'New Site Launch',
            program_icon: '🚀',
            photo_url: 'https://placehold.co/600x400/8B5CF6/FFFFFF?text=5G+Tower',
            notes: 'New Airtel 5G site launched at Junction Mall.',
            latitude: -1.2630,
            longitude: 36.8063,
            location_name: 'Junction Mall, Nairobi',
            captured_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          },
        ]);

        // Create daily missions
        await supabaseAdmin.from('daily_missions').insert({
          user_id: johnId,
          mission_date: new Date().toISOString().split('T')[0],
          mission_1_progress: 2,
          mission_1_completed: false,
          mission_1_claimed: false,
          mission_2_progress: 2,
          mission_2_completed: true,
          mission_2_claimed: false,
          mission_3_progress: 1,
          mission_3_completed: true,
          mission_3_claimed: true,
        });

        // Award badges
        await supabaseAdmin.from('user_badges').insert([
          { user_id: johnId, badge_id: 1, unlocked_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
          { user_id: johnId, badge_id: 2, unlocked_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString() },
          { user_id: johnId, badge_id: 3, unlocked_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
          { user_id: johnId, badge_id: 4, unlocked_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
          { user_id: johnId, badge_id: 7, unlocked_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
        ]);
      }

      // 5. Create announcement from Director
      if (testUser.employee_id === 'DIR01') {
        await supabaseAdmin.from('announcements').insert({
          title: 'Q1 Target Achievement',
          message: "Congratulations team! We've achieved 95% of our Q1 targets. Keep up the excellent work in capturing competitive intelligence. Focus on Network Experience submissions this week!",
          short_message: "Congratulations team! We've achieved 95% of our Q1 targets...",
          author_id: authData.user.id,
          author_name: 'Ashish Azad',
          author_role: 'S & D Director',
          priority: 'high',
          target_audience: 'all',
          icon: '🎯',
          color: 'red',
          is_active: true,
        });
      }

      results.push({
        user: testUser.full_name,
        role: testUser.role,
        status: 'success',
        user_id: authData.user.id,
        email: testUser.email,
        phone: testUser.phone,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '5 test users created successfully!',
        results,
        credentials: {
          field_agent: { phone: '0712345001', password: 'JohnTAI@2024!' },
          zone_commander: { phone: '0711111001', password: 'AliceTAI@2024!' },
          zone_business_lead: { phone: '0722222001', password: 'DavidTAI@2024!' },
          hq_team: { phone: '0733333001', password: 'IsaacTAI@2024!' },
          director: { phone: '0744444001', password: 'AshishTAI@2024!' },
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
