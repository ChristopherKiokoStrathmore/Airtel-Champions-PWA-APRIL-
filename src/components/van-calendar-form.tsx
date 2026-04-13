// Van Calendar Form - Weekly Route Planning for ZSMs
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Copy, Send, Lock } from 'lucide-react';
import { DayPlanCard } from './van-calendar/day-plan-card';
import { VanDatabaseSetupInstructions } from './van-database-setup-instructions';

interface Site {
  site_id: string;
  site_name: string;
  order: number;
}

interface SitewiseData {
  'SITE ID': string;
  'SITE': string;
  'TOWN CATEGORY': string;
  'CLUSTER (691)': string;
  'TSE': string;
  'ZSM': string;
  'ZBM': string;
  'ZONE': string;
}

interface DailyPlan {
  day: string;
  date: string;
  day_index: number;
  is_rest_day: boolean;
  sites: Site[];
}

export default function VanCalendarForm() {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [selectedVan, setSelectedVan] = useState<any>(null);
  const [restDay, setRestDay] = useState<number>(0);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [duplicateSites, setDuplicateSites] = useState<Set<string>>(new Set());
  
  // Dropdown data
  const [vans, setVans] = useState<any[]>([]);
  const [allVans, setAllVans] = useState<any[]>([]); // Store all vans
  const [showAllVans, setShowAllVans] = useState(false); // Toggle for active 30 vs all
  const [sites, setSites] = useState<SitewiseData[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Active 30 vans - number plates
  const ACTIVE_30_PLATES = [
    'KAW 747X', 'KBG 957A', 'KBS 528F', 'KBX 128E', 'KBX 632U',
    'KCA 530C', 'KCB 466U', 'KCC 879F', 'KCE 629Q', 'KCG 720W',
    'KCG 809J', 'KCJ 834G', 'KCK 594S', 'KCN 381L', 'KCP 126Q',
    'KCP 597S', 'KCQ 114R', 'KCQ 129G', 'KCQ 564B', 'KCQ 689V',
    'KCR 709C', 'KCR 803Q', 'KCS 248G', 'KCU 536G', 'KCU 691B',
    'KCV 831C', 'KCV 836A', 'KCW 152M', 'KCX 291B', 'KCJ 078J'
  ];

  // Check if user is ZSM or HQ (can edit)
  const canEdit = currentUser && ['zonal_sales_manager', 'zonal_business_manager', 'hq_command_center', 'director'].includes(currentUser.role);
  const isReadOnly = !canEdit;

  // Check database health first
  async function checkDatabaseHealth() {
    try {
      console.log('[Van Calendar] 🔍 Checking database health...');
      
      // Check if van_db table exists AND has readable data
      const { data, error, count } = await supabase
        .from('van_db')
        .select('id, number_plate, zone', { count: 'exact' })
        .limit(5);
      
      if (error) {
        console.error('[Van Calendar] ❌ Database health check failed:', error);
        
        if (error.code === 'PGRST205' || error.message?.includes('van_db')) {
          console.log('[Van Calendar] ⚠️ van_db table NOT FOUND - BLOCKING USER');
          setShowSetupInstructions(true);
          return; // STOP - don't load anything else
        }
        
        // Other errors (like RLS blocking)
        console.log('[Van Calendar] ⚠️ Database access blocked (possibly RLS) - BLOCKING USER');
        setShowSetupInstructions(true);
        return;
      }
      
      // Check if we got any data back
      if (!data || data.length === 0 || count === 0) {
        console.error('[Van Calendar] ⚠️ van_db table exists but returns 0 rows (RLS blocking or empty table)');
        setShowSetupInstructions(true);
        return;
      }
      
      // Database is healthy - proceed with normal loading
      console.log('[Van Calendar] ✅ Database health check passed - found', count, 'total vans');
      
      // Load user first, then load zone-filtered data
      await loadCurrentUser();
      loadNextSunday();
      loadSites();
      
    } catch (error) {
      console.error('[Van Calendar] ❌ Database health check error:', error);
      setShowSetupInstructions(true);
    }
  }

  // Load current user
  async function loadCurrentUser() {
    try {
      console.log('[Van Calendar] 🔍 Loading current user...');
      
      // Try to get user from localStorage first (using 'tai_user' key)
      const localUser = localStorage.getItem('tai_user');
      console.log('[Van Calendar] 📦 localStorage tai_user:', localUser ? 'EXISTS' : 'NULL');
      
      if (localUser) {
        const user = JSON.parse(localUser);
        console.log('[Van Calendar] 👤 Parsed user:', user.full_name, '| Zone:', user.zone, '| Role:', user.role);
        
        setCurrentUser(user);
        console.log('✅ Van Calendar: Loaded user from localStorage:', user.full_name);
        
        // Load vans filtered by user's zone
        if (user.zone) {
          console.log('[Van Calendar] 🚐 Calling loadVans for zone:', user.zone);
          loadVans(user.zone);
        } else {
          console.error('[Van Calendar] ❌ User has NO ZONE field!');
        }
        return;
      }

      // No localStorage user found — cannot proceed without login
      console.error('[Van Calendar] No localStorage user found. Please login first.');
      setError('Not authenticated. Please login again.');
      return;
    } catch (error) {
      console.error('[Van Calendar] ❌ Error loading current user:', error);
    }
  }

  // Load next Sunday (client-side calculation)
  async function loadNextSunday() {
    try {
      console.log('[Van Calendar] 🔄 Calculating next Sunday (client-side)...');
      
      // Calculate next Sunday client-side
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysUntilNextSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
      
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + daysUntilNextSunday);
      
      const sundayStr = nextSunday.toISOString().split('T')[0];
      console.log('✅ Next Sunday calculated:', sundayStr);
      
      setWeekStart(sundayStr);
      
      // Calculate week end (Saturday)
      const weekEndDate = new Date(nextSunday);
      weekEndDate.setDate(nextSunday.getDate() + 6);
      const saturdayStr = weekEndDate.toISOString().split('T')[0];
      console.log('✅ Week ends on:', saturdayStr);
      
      setWeekEnd(saturdayStr);
      
      // Initialize daily plans
      initializeDailyPlans(sundayStr);
      
    } catch (error) {
      console.error('[Van Calendar] ❌ Error calculating next Sunday:', error);
    }
  }

  // Load vans filtered by zone
  async function loadVans(zone: string) {
    try {
      console.log('🔍 Loading vans for zone:', zone);
      
      const { data, error } = await supabase
        .from('van_db')
        .select('*')
        .eq('zone', zone)
        .order('number_plate');
      
      if (error) {
        console.error('Error loading vans:', error);
        return;
      }
      
      // Store all vans
      setAllVans(data || []);
      
      // Filter to show only active 30 by default
      const active30 = (data || []).filter(van => 
        ACTIVE_30_PLATES.includes(van.number_plate)
      );
      
      setVans(active30);
      console.log('✅ Loaded', active30.length, 'active vans (out of', data?.length || 0, 'total) for zone', zone);
    } catch (error) {
      console.error('Error loading vans:', error);
    }
  }

  // Toggle between active 30 and all vans
  function toggleVanView() {
    if (showAllVans) {
      // Switch back to active 30
      const active30 = allVans.filter(van => 
        ACTIVE_30_PLATES.includes(van.number_plate)
      );
      setVans(active30);
      setShowAllVans(false);
    } else {
      // Show all vans
      setVans(allVans);
      setShowAllVans(true);
    }
  }

  // Load sites from sitewise table
  async function loadSites() {
    try {
      console.log('[Van Calendar] 🔄 Loading sites from sitewise table...');
      setLoadingSites(true);
      
      const allSites: SitewiseData[] = [];
      let offset = 0;
      const limit = 1000;
      
      while (true) {
        console.log(`[Van Calendar] 📦 Fetching batch from ${offset} to ${offset + limit - 1}...`);
        
        const { data, error } = await supabase
          .from('sitewise')
          .select('*')
          .range(offset, offset + limit - 1);
        
        if (error) {
          console.error('[Van Calendar] ❌ Error loading sites batch:', error);
          break;
        }
        
        if (!data || data.length === 0) break;
        
        allSites.push(...data);
        console.log(`[Van Calendar] ✅ Batch loaded: ${data.length} sites (Total: ${allSites.length})`);
        
        if (data.length < limit) break;
        offset += limit;
      }
      
      setSites(allSites);
      console.log('[Van Calendar] ✅ Total sites loaded:', allSites.length);
      setLoadingSites(false);
      
    } catch (error) {
      console.error('[Van Calendar] ❌ Error loading sites:', error);
      setLoadingSites(false);
    }
  }

  // Initialize daily plans for the week
  function initializeDailyPlans(startDate: string) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const plans: DailyPlan[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      plans.push({
        day: days[i],
        date: date.toISOString().split('T')[0],
        day_index: i,
        is_rest_day: i === restDay,
        sites: [{ site_id: '', site_name: '', order: 1 }] // 🎯 Start with 1 empty slot
      });
    }
    
    setDailyPlans(plans);
  }

  // Check for duplicate sites across the week
  function checkDuplicates() {
    const siteOccurrences = new Map<string, number>();
    const duplicates = new Set<string>();

    dailyPlans.forEach(day => {
      if (!day.is_rest_day) {
        day.sites.forEach(site => {
          if (site.site_id) {
            const count = (siteOccurrences.get(site.site_id) || 0) + 1;
            siteOccurrences.set(site.site_id, count);
            
            if (count > 1) {
              duplicates.add(site.site_id);
            }
          }
        });
      }
    });

    setDuplicateSites(duplicates);
    return duplicates;
  }

  // Update site for a specific day
  function updateDaySite(dayIndex: number, siteIndex: number, newSiteId: string, newSiteName: string) {
    const updatedPlans = [...dailyPlans];
    
    if (updatedPlans[dayIndex].sites[siteIndex]) {
      updatedPlans[dayIndex].sites[siteIndex] = {
        ...updatedPlans[dayIndex].sites[siteIndex],
        site_id: newSiteId,
        site_name: newSiteName
      };
    }
    
    setDailyPlans(updatedPlans);
    
    // Check for duplicates after update
    setTimeout(() => checkDuplicates(), 100);
  }

  // Toggle rest day
  function handleRestDayChange(dayIndex: number) {
    setRestDay(dayIndex);
    
    const updatedPlans = dailyPlans.map((day, idx) => ({
      ...day,
      is_rest_day: idx === dayIndex,
      sites: idx === dayIndex ? [] : day.sites // Clear sites for rest day
    }));
    
    setDailyPlans(updatedPlans);
  }

  // Add site to a day
  function addSiteToDay(dayIndex: number) {
    const updatedPlans = [...dailyPlans];
    updatedPlans[dayIndex].sites.push({
      site_id: '',
      site_name: '',
      order: updatedPlans[dayIndex].sites.length + 1
    });
    setDailyPlans(updatedPlans);
  }

  // Remove site from a day
  function removeSiteFromDay(dayIndex: number, siteIndex: number) {
    const updatedPlans = [...dailyPlans];
    updatedPlans[dayIndex].sites = updatedPlans[dayIndex].sites.filter((_, idx) => idx !== siteIndex);
    setDailyPlans(updatedPlans);
    
    // Re-check duplicates after removal
    setTimeout(() => checkDuplicates(), 100);
  }

  // Check van availability
  async function checkVanAvailability() {
    if (!selectedVan || !weekStart) return;

    try {
      const { data, error } = await supabase
        .from('van_calendar_plans')
        .select('*')
        .eq('van_id', selectedVan.id)
        .eq('week_start_date', weekStart)
        .eq('status', 'active')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking availability:', error);
        return;
      }

      if (data) {
        alert(`⚠️ This van already has a plan for this week!\n\nVan: ${selectedVan.number_plate}\nZSM: ${data.zsm_name}\n\nPlease choose a different van or week.`);
        setSelectedVan(null);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  }

  // Submit plan
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isReadOnly) {
      alert('⚠️ You do not have permission to edit the Van Calendar. Only ZSMs and HQ can create/modify plans.');
      return;
    }

    if (!weekStart || !selectedVan || !currentUser) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate that at least one day has sites
    const workingDays = dailyPlans.filter(day => !day.is_rest_day);
    
    // Check if at least one complete site exists
    const hasCompleteSites = workingDays.some(day => 
      day.sites.some(site => site.site_id && site.site_name && site.site_id.trim() !== '' && site.site_name.trim() !== '')
    );

    if (!hasCompleteSites) {
      alert('⚠️ Please add and complete at least one site selection.');
      return;
    }

    // Validate all sites are PROPERLY selected (have both ID and name)
    // Skip empty slots - only validate slots that have been touched
    const incompleteSites = workingDays.some(day =>
      day.sites.some(site => {
        // If site has an ID but no name, or name but no ID - it's incomplete
        const hasId = site.site_id && site.site_id.trim() !== '';
        const hasName = site.site_name && site.site_name.trim() !== '';
        
        // Both must be present, or both must be absent (empty slot to be filled)
        return (hasId && !hasName) || (!hasId && hasName);
      })
    );

    if (incompleteSites) {
      alert('⚠️ Please complete all site selections. Each site dropdown must be fully selected or left empty.');
      return;
    }
    
    // Filter out empty site slots before validation
    const validWorkingDays = workingDays.map(day => ({
      ...day,
      sites: day.sites.filter(site => site.site_id && site.site_name)
    })).filter(day => day.sites.length > 0);
    
    if (validWorkingDays.length === 0) {
      alert('⚠️ Please add and complete at least one site selection.');
      return;
    }

    // Validate that no site is selected multiple times across the week
    const duplicates = checkDuplicates();

    if (duplicates.size > 0) {
      const duplicateNames = dailyPlans
        .flatMap(day => day.sites)
        .filter(site => duplicates.has(site.site_id))
        .map(site => site.site_name)
        .filter((v, i, a) => a.indexOf(v) === i);

      alert(`⚠️ Duplicate sites detected!\n\nThe following site(s) are selected multiple times:\n\n• ${duplicateNames.join('\n• ')}\n\nPlease ensure each site is only selected once across the entire week.`);
      return;
    }

    setLoading(true);

    try {
      console.log('[Van Calendar] 📤 Submitting plan DIRECTLY to Supabase with van ID:', selectedVan.id);
      console.log('[Van Calendar] 🚐 Van details:', selectedVan);
      
      // Filter out empty sites and prepare daily plans
      const filteredDailyPlans = dailyPlans.map(day => ({
        ...day,
        sites: day.sites.filter(site => site.site_id && site.site_name)
      }));

      // Calculate total sites
      const totalSites = filteredDailyPlans.reduce((sum, day) => sum + day.sites.length, 0);

      // Get unique zones
      const zonesSet = new Set<string>();
      filteredDailyPlans.forEach(day => {
        day.sites.forEach(site => {
          const siteData = sites.find(s => s['SITE ID'] === site.site_id);
          if (siteData?.ZONE) zonesSet.add(siteData.ZONE);
        });
      });

      // Prepare insert data
      const insertData = {
        week_start_date: weekStart,
        week_end_date: weekEnd,
        van_id: selectedVan.id,
        van_numberplate: selectedVan.number_plate,
        zsm_id: currentUser.id,
        zsm_name: currentUser.full_name,
        zsm_phone: currentUser.phone_number || '',
        zsm_zone: currentUser.zone || '',
        rest_day: restDay,
        daily_plans: filteredDailyPlans,
        total_sites_planned: totalSites,
        zones_covered: Array.from(zonesSet),
        status: 'active',
        submitted_at: new Date().toISOString()
      };

      console.log('[Van Calendar] 📊 Inserting data:', insertData);

      // Insert directly into van_calendar_plans table
      const { data, error } = await supabase
        .from('van_calendar_plans')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[Van Calendar] ❌ Supabase error:', error);
        throw new Error(error.message);
      }

      console.log('[Van Calendar] ✅ Successfully inserted:', data);
      
      // Also log this as a "program submission" for HQ dashboard tracking
      try {
        const submissionData = {
          user_id: currentUser.id,
          employee_id: currentUser.employee_id,
          program_id: 'VAN_CALENDAR_SYSTEM', // Special ID for van calendar
          program_title: '🚐 Van Weekly Calendar',
          points_awarded: 0, // No points for van calendar
          submission_data: {
            van_numberplate: selectedVan.number_plate,
            week_start: weekStart,
            week_end: weekEnd,
            zone: currentUser.zone,
            total_sites: validWorkingDays.reduce((acc, day) => acc + day.sites.length, 0)
          },
          has_photo: false,
          has_gps: false,
          submitted_at: new Date().toISOString()
        };

        await supabase.from('submissions').insert(submissionData);
        console.log('[Van Calendar] ✅ Also logged as program submission for HQ tracking');
      } catch (trackError) {
        console.error('[Van Calendar] ⚠️ Could not log submission for tracking:', trackError);
        // Don't fail the main submission if tracking fails
      }
      
      alert('✅ Van calendar created successfully!');
      
      // Navigate back to the previous page
      window.history.back();
      
    } catch (error: any) {
      console.error('[Van Calendar] ❌ Error submitting plan:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Copy last week
  async function copyLastWeek() {
    if (!selectedVan) {
      alert('Please select a van first');
      return;
    }

    setLoading(true);

    try {
      // Query last week's plan directly from Supabase
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('van_calendar_plans')
        .select('*')
        .eq('van_id', selectedVan.id)
        .eq('week_start_date', lastWeekStartStr)
        .single();

      if (error || !data) {
        alert('No previous plan found to copy');
        return;
      }

      setRestDay(data.rest_day);
      setDailyPlans(data.daily_plans);
      alert('Last week\'s plan copied successfully!');
    } catch (error: any) {
      console.error('Error copying plan:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Initialize on mount
  useEffect(() => {
    checkDatabaseHealth();
  }, []);

  // Check van availability whenever van or weekStart changes
  useEffect(() => {
    if (selectedVan && weekStart) {
      checkVanAvailability();
    } else {
      // Clear daily plans if no van selected
      if (!selectedVan && dailyPlans.length > 0) {
        initializeDailyPlans(weekStart);
      }
    }
  }, [selectedVan, weekStart]);

  // Show setup instructions modal
  if (showSetupInstructions) {
    return <VanDatabaseSetupInstructions onClose={() => setShowSetupInstructions(false)} />;
  }

  // Show read-only banner for SEs
  if (isReadOnly) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl shadow-2xl p-8 text-center">
            <Lock className="w-16 h-16 mx-auto text-white mb-4" />
            <h1 className="text-3xl font-black text-white mb-3">
              📅 Van Calendar - View Only
            </h1>
            <p className="text-white text-lg font-medium">
              You are logged in as <span className="font-black">{currentUser?.full_name}</span> ({currentUser?.role})
            </p>
            <div className="mt-6 p-4 bg-white bg-opacity-20 backdrop-blur rounded-lg">
              <p className="text-white font-semibold">
                🔒 Only ZSMs and HQ team can create and edit Van Calendar plans
              </p>
              <p className="text-white text-sm mt-2">
                You can view the weekly van schedules for your zone, but cannot make changes
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-black mb-2">
          🚐 Van Weekly Calendar - {currentUser?.zone || 'Loading...'}
        </h1>
        <p className="text-white text-opacity-90">
          Planning for {weekStart} to {weekEnd} | Logged in as: <span className="font-bold">{currentUser?.full_name}</span>
        </p>
        
        {/* Loading Sites Indicator */}
        {loadingSites && (
          <div className="mt-4 p-3 bg-white bg-opacity-20 backdrop-blur rounded-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="text-sm font-medium text-white">
              Loading {sites.length} sites from database...
            </span>
          </div>
        )}
        
        {/* Sites Loaded Indicator */}
        {!loadingSites && sites.length > 0 && (
          <div className="mt-4 p-3 bg-white bg-opacity-20 backdrop-blur rounded-lg flex items-center gap-3">
            <span className="text-white text-xl">✅</span>
            <span className="text-sm font-medium text-white">
              {sites.length} sites loaded and ready to select
            </span>
          </div>
        )}
      </div>

      {/* Weekly Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Week Dates */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Planning Week (Select Start Date - Sunday) *
            </label>
            <input
              type="date"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              value={weekStart}
              onChange={(e) => {
                const selectedDate = new Date(e.target.value);
                const dayOfWeek = selectedDate.getDay();
                
                // Ensure it's a Sunday
                if (dayOfWeek !== 0) {
                  alert('⚠️ Planning week must start on Sunday. Please select a Sunday.');
                  return;
                }
                
                setWeekStart(e.target.value);
                
                // Calculate end date (Saturday)
                const endDate = new Date(selectedDate);
                endDate.setDate(endDate.getDate() + 6);
                setWeekEnd(endDate.toISOString().split('T')[0]);
                
                // Re-initialize daily plans
                initializeDailyPlans(e.target.value);
              }}
              min={(() => {
                // Allow backdating from Feb 15, 2026 only for this week (Feb 15-21)
                const today = new Date();
                const testWeekStart = new Date('2026-02-15');
                const testWeekEnd = new Date('2026-02-21');
                
                if (today >= testWeekStart && today <= testWeekEnd) {
                  return '2026-02-15';
                } else {
                  return new Date().toISOString().split('T')[0];
                }
              })()}
            />
            {weekStart && weekEnd && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-bold text-blue-900">
                  {weekStart} to {weekEnd}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Sunday → Saturday (7 days)
                </div>
              </div>
            )}
          </div>

          {/* Van Selection */}
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                🚐 Select Van *
              </label>
              
              {/* Subtle toggle button - only those who know, know */}
              <button
                type="button"
                onClick={toggleVanView}
                className="text-[8px] px-1 py-0.5 text-gray-400 hover:text-gray-600 transition-colors opacity-30 hover:opacity-100"
                title={showAllVans ? "Show Active 30" : "Show All Vans"}
              >
                {showAllVans ? '30' : 'all'}
              </button>
            </div>
            
            <select
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              value={selectedVan?.id || ''}
              onChange={(e) => {
                const van = vans.find(v => v.id === parseInt(e.target.value));
                setSelectedVan(van);
              }}
              disabled={vans.length === 0}
            >
              <option value="">
                {vans.length === 0 ? '⚠️ No vans available - Setup required' : `-- Select Van (${vans.length} available) --`}
              </option>
              {vans.map(van => (
                <option key={`van-opt-${van.id}`} value={van.id}>
                  {van.number_plate} - {van.county}{van.capacity ? ` (${van.capacity})` : ''}
                </option>
              ))}
            </select>
            
            {/* Show help message if no vans available */}
            {vans.length === 0 && (
              <div className="mt-2 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="text-sm font-medium text-red-800">
                  ⚠️ Van database not found. Please run the setup script.
                </div>
                <button
                  onClick={() => setShowSetupInstructions(true)}
                  className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                >
                  Click here for setup instructions
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Copy Last Week Button */}
        {selectedVan && (
          <div className="mt-4">
            <button
              type="button"
              onClick={copyLastWeek}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              Copy Last Week's Plan
            </button>
          </div>
        )}
      </div>

      {/* Daily Plans */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">📋 Daily Plans</h2>
        
        {dailyPlans.length > 0 && dailyPlans.map((dayPlan, dayIndex) => (
          dayPlan ? (
            <DayPlanCard
              key={`day-${dayIndex}`}
              dayPlan={dayPlan}
              dayIndex={dayIndex}
              sites={sites}
              restDay={restDay}
              onRestDayChange={handleRestDayChange}
              onAddSite={addSiteToDay}
              onRemoveSite={removeSiteFromDay}
              onUpdateSite={updateDaySite}
              duplicateSites={duplicateSites}
            />
          ) : null
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-6">
        <button
          type="submit"
          disabled={loading || !selectedVan || vans.length === 0}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          {loading ? 'Submitting...' : 'Submit Weekly Plan'}
        </button>
      </div>
    </form>
  );
}