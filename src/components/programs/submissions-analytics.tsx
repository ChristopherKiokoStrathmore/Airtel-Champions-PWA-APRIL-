import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { 
  TrendingUp, 
  MapPin, 
  Users, 
  Award, 
  Camera, 
  Calendar,
  BarChart3,
  Target,
  Zap,
  Download
} from 'lucide-react';

interface AnalyticsData {
  totalSubmissions: number;
  submissionsByZone: Record<string, number>;
  submissionsByZSM: Array<{ zsm: string; count: number; zone: string }>;
  submissionsByProgram: Array<{ program: string; count: number; icon?: string }>;
  submissionTrends: Array<{ date: string; count: number }>;
  topPerformers: Array<{ name: string; count: number; zone: string }>;
  gpsVerificationRate: number;
  photoUploadRate: number;
  avgPointsPerSubmission: number;
}

interface SubmissionsAnalyticsProps {
  userRole: string;
  userZone?: string;
  userZSM?: string;
  userName?: string;
}

export function SubmissionsAnalytics({ 
  userRole, 
  userZone, 
  userZSM,
  userName 
}: SubmissionsAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSubmissions: 0,
    submissionsByZone: {},
    submissionsByZSM: [],
    submissionsByProgram: [],
    submissionTrends: [],
    topPerformers: [],
    gpsVerificationRate: 0,
    photoUploadRate: 0,
    avgPointsPerSubmission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [viewMode, setViewMode] = useState<'my-zone' | 'all-zones'>('my-zone');
  const [allZonesData, setAllZonesData] = useState<Record<string, any>>({});
  
  // Ultra-fast pagination state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    console.log('[SubmissionsAnalytics] useEffect triggered - loading analytics');
    loadAnalytics();
  }, [timeRange, userRole, userZone, userZSM]);

  const loadAnalytics = async () => {
    try {
      console.log('[SubmissionsAnalytics] 🔥 SIMPLIFIED ANALYTICS: Using aggregated queries...');
      setLoading(true);
      setError('');
      setLoadingProgress(0);
      const supabase = getSupabaseClient();

      console.log('[SubmissionsAnalytics] Loading analytics for:', { userRole, userZone, userZSM });

      // Calculate date range
      let dateFilter = '';
      if (timeRange !== 'all') {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        dateFilter = startDate.toISOString();
      }

      // 🚨 EMERGENCY FALLBACK STRATEGY
      // Try progressively smaller queries until one succeeds
      const FALLBACK_LIMITS = [100, 50, 20, 10]; // Try these limits in order
      let submissions: any[] = [];
      let totalSubmissions = 0;
      let successfulLimit = 0;

      console.log('[SubmissionsAnalytics] 🚨 EMERGENCY MODE: Trying progressive fallback...');
      setLoadingProgress(10);

      // Try to get count first (fastest query)
      try {
        console.log('[SubmissionsAnalytics] 📊 Attempting to get total count...');
        let countQuery = supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true });
        
        if (dateFilter) {
          countQuery = countQuery.gte('created_at', dateFilter);
        }

        const { count, error: countErr } = await countQuery;
        if (countErr) {
          console.warn('[SubmissionsAnalytics] ⚠️ Count query returned error:', JSON.stringify(countErr));
          // Fallback: try without head to just get data length
          try {
            let fallbackQuery = supabase
              .from('submissions')
              .select('id')
              .limit(1000);
            if (dateFilter) {
              fallbackQuery = fallbackQuery.gte('created_at', dateFilter);
            }
            const { data: fallbackData, error: fallbackErr } = await fallbackQuery;
            if (!fallbackErr && fallbackData) {
              totalSubmissions = fallbackData.length;
              console.log('[SubmissionsAnalytics] ✅ Fallback count from data length:', totalSubmissions);
            }
          } catch (fbErr) {
            console.warn('[SubmissionsAnalytics] ⚠️ Fallback count also failed');
          }
        } else {
          totalSubmissions = count || 0;
        }
        console.log('[SubmissionsAnalytics] ✅ Total submissions:', totalSubmissions);
        setLoadingProgress(20);
      } catch (countError: any) {
        console.warn('[SubmissionsAnalytics] ⚠️ Count query failed:', countError?.message || countError, '- will estimate from sample');
        setLoadingProgress(20);
      }

      // Try progressively smaller queries
      for (const limit of FALLBACK_LIMITS) {
        try {
          console.log(`[SubmissionsAnalytics] 🔄 Attempting to load ${limit} submissions...`);
          
          let submissionsQuery = supabase
            .from('submissions')
            .select('created_at, points_awarded, user_id, program_id')
            // ⚠️ REMOVED: agent_id, form_data (columns don't exist)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (dateFilter) {
            submissionsQuery = submissionsQuery.gte('created_at', dateFilter);
          }

          const { data, error } = await submissionsQuery;

          if (error) {
            console.warn(`[SubmissionsAnalytics] ⚠️ Failed to load ${limit} submissions:`, error.message);
            continue; // Try next smaller limit
          }

          if (data && data.length > 0) {
            submissions = data;
            successfulLimit = limit;
            console.log(`[SubmissionsAnalytics] ✅ Successfully loaded ${data.length} submissions (limit: ${limit})`);
            setLoadingProgress(50);
            break; // Success! Stop trying
          }
        } catch (err) {
          console.warn(`[SubmissionsAnalytics] ⚠️ Exception loading ${limit} submissions:`, err);
          continue; // Try next smaller limit
        }
      }

      // If we still have no data, show minimal analytics
      if (submissions.length === 0) {
        console.warn('[SubmissionsAnalytics] ⚠️ Could not load any submissions - showing minimal analytics');
        setAnalytics({
          totalSubmissions: totalSubmissions,
          submissionsByZone: {},
          submissionsByZSM: [],
          submissionsByProgram: [],
          submissionTrends: [],
          topPerformers: [],
          gpsVerificationRate: 0,
          photoUploadRate: 0,
          avgPointsPerSubmission: 0,
        });
        setError(`Database is degraded. Showing basic stats only. Loaded from ${successfulLimit || 0} recent submissions.`);
        setLoading(false);
        return;
      }

      console.log(`[SubmissionsAnalytics] 📊 Step 3: Fetching reference data (users & programs)...`);
      setLoadingProgress(60);

      // Try to fetch users and programs (with timeout protection)
      let users: any[] = [];
      let programs: any[] = [];

      try {
        const { data: usersData, error: usersError } = await supabase
          .from('app_users')
          .select('id, full_name, zone, region, zsm, zbm')
          .limit(1000); // Limit to prevent timeout

        if (!usersError && usersData) {
          users = usersData;
          console.log('[SubmissionsAnalytics] ✅ Loaded users:', users.length);
        }
      } catch (err) {
        console.warn('[SubmissionsAnalytics] ⚠️ Could not load users:', err);
      }

      try {
        const { data: programsData, error: programsError } = await supabase
          .from('programs')
          .select('id, title, icon')
          .limit(100); // Limit to prevent timeout

        if (!programsError && programsData) {
          programs = programsData;
          console.log('[SubmissionsAnalytics] ✅ Loaded programs:', programs.length);
        }
      } catch (err) {
        console.warn('[SubmissionsAnalytics] ⚠️ Could not load programs:', err);
      }

      setLoadingProgress(80);

      // Create lookup maps
      const usersMap = new Map((users || []).map(u => [u.id, u]));
      const programsMap = new Map((programs || []).map(p => [p.id, p]));

      // Enrich submissions
      const enrichedSubmissions = submissions.map(sub => ({
        ...sub,
        app_users: usersMap.get(sub.user_id) || null,
        programs: programsMap.get(sub.program_id) || null,
      }));

      // Apply role-based filtering
      let filteredSubmissions = enrichedSubmissions;
      
      if (userRole === 'zonal_sales_manager' && userName) {
        filteredSubmissions = enrichedSubmissions.filter(
          sub => sub.app_users?.zsm === userName
        );
      } else if (userRole === 'zonal_business_manager' && userZone) {
        filteredSubmissions = enrichedSubmissions.filter(
          sub => sub.app_users?.zone === userZone
        );
      }

      console.log('[SubmissionsAnalytics] ✅ Filtered to', filteredSubmissions.length, 'submissions');
      setLoadingProgress(90);

      // Calculate analytics
      const analytics = calculateAnalytics(filteredSubmissions);
      
      // Override total count with actual database count if available
      if (totalSubmissions > 0) {
        analytics.totalSubmissions = totalSubmissions;
      }
      
      setAnalytics(analytics);
      setLoadingProgress(100);
      
      // Show warning if we had to use a very small sample
      if (successfulLimit <= 20) {
        setError(`⚠️ Database degraded - analytics based on only ${successfulLimit} recent submissions. Full analytics available after Bazuu APP migration.`);
      }
      
      console.log('[SubmissionsAnalytics] ✅ Analytics ready! (based on', filteredSubmissions.length, 'submissions)');
      
    } catch (err: any) {
      console.error('[SubmissionsAnalytics] ❌ Critical Error:', err);
      
      // Show minimal fallback UI
      setAnalytics({
        totalSubmissions: 0,
        submissionsByZone: {},
        submissionsByZSM: [],
        submissionsByProgram: [],
        submissionTrends: [],
        topPerformers: [],
        gpsVerificationRate: 0,
        photoUploadRate: 0,
        avgPointsPerSubmission: 0,
      });
      
      setError('Database temporarily unavailable. Analytics will be available after migration to Bazuu APP database. Please contact Christopher (DEV001) for immediate assistance.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (submissions: any[]): AnalyticsData => {
    // Total submissions
    const totalSubmissions = submissions.length;

    // Submissions by Zone
    const submissionsByZone: Record<string, number> = {};
    submissions.forEach(sub => {
      const zone = sub.app_users?.zone || 'Unknown';
      submissionsByZone[zone] = (submissionsByZone[zone] || 0) + 1;
    });

    // Submissions by ZSM
    const zsmMap: Record<string, { count: number; zone: string }> = {};
    submissions.forEach(sub => {
      const zsm = sub.app_users?.zsm || 'Unknown';
      const zone = sub.app_users?.zone || 'Unknown';
      if (!zsmMap[zsm]) {
        zsmMap[zsm] = { count: 0, zone };
      }
      zsmMap[zsm].count++;
    });
    const submissionsByZSM = Object.entries(zsmMap)
      .map(([zsm, data]) => ({ zsm, count: data.count, zone: data.zone }))
      .sort((a, b) => b.count - a.count);

    // Submissions by Program
    const programMap: Record<string, { count: number; icon?: string }> = {};
    submissions.forEach(sub => {
      const program = sub.programs?.title || 'Unknown Program';
      const icon = sub.programs?.icon;
      if (!programMap[program]) {
        programMap[program] = { count: 0, icon };
      }
      programMap[program].count++;
    });
    const submissionsByProgram = Object.entries(programMap)
      .map(([program, data]) => ({ program, count: data.count, icon: data.icon }))
      .sort((a, b) => b.count - a.count);

    // Submission Trends (last 7 days)
    const last7Days: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days[dateStr] = 0;
    }
    submissions.forEach(sub => {
      const dateStr = sub.created_at.split('T')[0];
      if (last7Days.hasOwnProperty(dateStr)) {
        last7Days[dateStr]++;
      }
    });
    const submissionTrends = Object.entries(last7Days).map(([date, count]) => ({
      date,
      count,
    }));

    // Top Performers
    const seMap: Record<string, { count: number; zone: string }> = {};
    submissions.forEach(sub => {
      const name = sub.app_users?.full_name || 'Unknown';
      const zone = sub.app_users?.zone || 'Unknown';
      if (!seMap[name]) {
        seMap[name] = { count: 0, zone };
      }
      seMap[name].count++;
    });
    const topPerformers = Object.entries(seMap)
      .map(([name, data]) => ({ name, count: data.count, zone: data.zone }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // GPS Verification Rate
    // ⚠️ DISABLED: form_data column doesn't exist in submissions table
    // TODO: Add GPS tracking data to submissions table in future migration
    const gpsVerificationRate = 0;

    // Photo Upload Rate
    // ⚠️ DISABLED: form_data column doesn't exist in submissions table
    // TODO: Add photo tracking data to submissions table in future migration
    const photoUploadRate = 0;

    // Average Points per Submission
    const totalPoints = submissions.reduce((sum, sub) => sum + (sub.points_awarded || 0), 0);
    const avgPointsPerSubmission = totalSubmissions > 0 ? totalPoints / totalSubmissions : 0;

    return {
      totalSubmissions,
      submissionsByZone,
      submissionsByZSM,
      submissionsByProgram,
      submissionTrends,
      topPerformers,
      gpsVerificationRate,
      photoUploadRate,
      avgPointsPerSubmission,
    };
  };

  const downloadAnalyticsCSV = () => {
    try {
      // Prepare CSV data
      const csvRows = [];
      
      // Header
      csvRows.push(['TAI Analytics Report']);
      csvRows.push([`Generated: ${new Date().toLocaleString()}`]);
      csvRows.push([`Time Range: ${timeRange}`]);
      csvRows.push([`Role: ${userRole}`]);
      csvRows.push(['']);
      
      // Summary Stats
      csvRows.push(['SUMMARY STATISTICS']);
      csvRows.push(['Total Submissions', analytics.totalSubmissions]);
      csvRows.push(['Avg Points/Submission', Math.round(analytics.avgPointsPerSubmission)]);
      csvRows.push(['GPS Verified Rate', `${Math.round(analytics.gpsVerificationRate)}%`]);
      csvRows.push(['Photo Upload Rate', `${Math.round(analytics.photoUploadRate)}%`]);
      csvRows.push(['']);
      
      // Top Performers
      csvRows.push(['TOP PERFORMERS']);
      csvRows.push(['Rank', 'Name', 'Zone', 'Submissions']);
      analytics.topPerformers.forEach((se, idx) => {
        csvRows.push([idx + 1, se.name, se.zone, se.count]);
      });
      csvRows.push(['']);
      
      // Submissions by Zone
      csvRows.push(['SUBMISSIONS BY ZONE']);
      csvRows.push(['Zone', 'Count', 'Percentage']);
      Object.entries(analytics.submissionsByZone)
        .sort(([, a], [, b]) => b - a)
        .forEach(([zone, count]) => {
          const percentage = ((count / analytics.totalSubmissions) * 100).toFixed(1);
          csvRows.push([zone, count, `${percentage}%`]);
        });
      csvRows.push(['']);
      
      // Submissions by Program
      csvRows.push(['SUBMISSIONS BY PROGRAM']);
      csvRows.push(['Program', 'Count', 'Percentage']);
      analytics.submissionsByProgram.forEach(program => {
        const percentage = ((program.count / analytics.totalSubmissions) * 100).toFixed(1);
        csvRows.push([program.program, program.count, `${percentage}%`]);
      });
      
      // Convert to CSV string
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `TAI_Analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Analytics downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading analytics:', error);
      alert('Failed to download analytics. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {/* Ultra-Fast Loading Indicator */}
        {loadingProgress > 0 ? (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">⚡ Loading Analytics...</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ultra-fast pagination in progress
                </p>
              </div>
              <span className="text-2xl font-bold text-purple-600">{loadingProgress.toFixed(0)}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300 animate-pulse"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Loading submissions in batches to avoid timeout...
            </p>
          </div>
        ) : (
          <>
            <div className="h-8 bg-gray-300 rounded w-1/4 animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          </>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        {/* Database Degraded Error */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🚨</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 mb-2">Database Temporarily Unavailable</h3>
              <p className="text-red-800 mb-4">{error}</p>
              
              <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">📋 Current Status:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Database is in degraded/paused state</li>
                  <li>• Analytics temporarily unavailable</li>
                  <li>• Migration to Bazuu APP database planned</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={loadAnalytics}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-lg"
                >
                  🔄 Retry
                </button>
                <a
                  href="mailto:christopher@airtel.co.ke"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
                >
                  📧 Contact Christopher (DEV001)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Show basic stats if available */}
        {analytics.totalSubmissions > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">📊 Basic Stats Available:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">{analytics.totalSubmissions.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Submissions</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Simplified Analytics Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚡</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Optimized Analytics Mode</h3>
            <p className="text-sm text-gray-600">
              Analytics based on latest 500 submissions for optimal performance. 
              Total count shows all-time data. Full historical analytics available after Bazuu APP migration.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl text-gray-900 mb-2">📊 Submissions Analytics</h1>
          <p className="text-sm md:text-base text-gray-500">
            {userRole === 'zonal_sales_manager' 
              ? `Tracking your team's performance` 
              : userRole === 'zonal_business_manager'
              ? `${userZone} Zone Performance`
              : 'Organization-wide insights'}
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Download Button */}
          <button
            onClick={downloadAnalyticsCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors shadow-sm"
            title="Download Analytics as CSV"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Target className="w-6 h-6" />}
          label="Total Submissions"
          value={analytics.totalSubmissions.toLocaleString()}
          color="bg-blue-50 text-blue-600 border-blue-200"
        />
        <MetricCard
          icon={<Award className="w-6 h-6" />}
          label="Avg Points"
          value={Math.round(analytics.avgPointsPerSubmission)}
          color="bg-yellow-50 text-yellow-600 border-yellow-200"
        />
        <MetricCard
          icon={<MapPin className="w-6 h-6" />}
          label="GPS Verified"
          value={`${Math.round(analytics.gpsVerificationRate)}%`}
          color="bg-green-50 text-green-600 border-green-200"
        />
        <MetricCard
          icon={<Camera className="w-6 h-6" />}
          label="With Photos"
          value={`${Math.round(analytics.photoUploadRate)}%`}
          color="bg-purple-50 text-purple-600 border-purple-200"
        />
      </div>

      {/* Submission Trends */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-xl text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          7-Day Submission Trend
        </h3>
        <div className="flex items-end justify-between gap-2 h-48">
          {analytics.submissionTrends.map((day, idx) => {
            const maxCount = Math.max(...analytics.submissionTrends.map(d => d.count), 1);
            const height = (day.count / maxCount) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end h-40">
                  <span className="text-xs text-gray-600 mb-1">{day.count}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t-lg transition-all"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submissions by Zone */}
      {Object.keys(analytics.submissionsByZone).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-xl text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Submissions by Zone
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.submissionsByZone)
              .sort(([, a], [, b]) => b - a)
              .map(([zone, count]) => {
                const percentage = (count / analytics.totalSubmissions) * 100;
                return (
                  <div key={zone}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{zone}</span>
                      <span className="text-sm text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Submissions by ZSM */}
      {analytics.submissionsByZSM.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-xl text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Submissions by ZSM
          </h3>
          <div className="space-y-2">
            {analytics.submissionsByZSM.slice(0, 10).map((zsm, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-gray-900">{zsm.zsm}</div>
                    <div className="text-xs text-gray-500">{zsm.zone}</div>
                  </div>
                </div>
                <div className="text-orange-600">{zsm.count} submissions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions by Program */}
      {analytics.submissionsByProgram.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-xl text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Submissions by Program
          </h3>
          <div className="space-y-3">
            {analytics.submissionsByProgram.map((program, idx) => {
              const percentage = (program.count / analytics.totalSubmissions) * 100;
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      {program.icon && <span>{program.icon}</span>}
                      {program.program}
                    </span>
                    <span className="text-sm text-gray-900">{program.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Performers */}
      {analytics.topPerformers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-xl text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Top Performing SEs
          </h3>
          <div className="space-y-2">
            {analytics.topPerformers.map((se, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    idx === 0 ? 'bg-yellow-500 text-white' :
                    idx === 1 ? 'bg-gray-400 text-white' :
                    idx === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-gray-900">{se.name}</div>
                    <div className="text-xs text-gray-500">{se.zone}</div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">{se.count} submissions</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  color: string; 
}) {
  return (
    <div className={`border rounded-xl p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
      </div>
      <div className="text-3xl mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}