# 🚐 HQ Dashboard Van Calendar Integration Guide

## 📊 Complete Step-by-Step Instructions

This guide shows you how to add Van Calendar metrics and widgets to your HQ Command Center dashboard.

---

## 🎯 OPTION 1: Quick Dashboard Widget (RECOMMENDED)

### **Step 1: Create Van Calendar Widget Component**

Create a new widget that HQ can see on their home dashboard showing Van Calendar stats.

**File to Create**: `/components/van-calendar-widget-hq.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Calendar, TrendingUp, AlertCircle, CheckCircle, Truck } from 'lucide-react';

interface VanCalendarStats {
  totalSubmissions: number;
  thisWeekSubmissions: number;
  zonesSubmitted: number;
  totalZones: number;
  vansWithPlans: number;
  totalVans: number;
  pendingZones: string[];
}

export function VanCalendarWidgetHQ({ onViewAll }: { onViewAll: () => void }) {
  const [stats, setStats] = useState<VanCalendarStats>({
    totalSubmissions: 0,
    thisWeekSubmissions: 0,
    zonesSubmitted: 0,
    totalZones: 8,
    vansWithPlans: 0,
    totalVans: 19,
    pendingZones: []
  });
  const [loading, setLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    loadVanCalendarStats();
  }, []);

  const loadVanCalendarStats = async () => {
    try {
      console.log('[Van Calendar Widget] 🔍 Loading stats for HQ...');
      setLoading(true);

      // Get current week boundaries
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
      endOfWeek.setHours(23, 59, 59, 999);

      // Fetch all van calendar submissions
      const { data: allSubmissions, error: allError } = await supabase
        .from('van_calendar_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      // Fetch this week's submissions
      const { data: thisWeekData, error: weekError } = await supabase
        .from('van_calendar_plans')
        .select('*')
        .gte('week_start_date', startOfWeek.toISOString().split('T')[0])
        .lte('week_start_date', endOfWeek.toISOString().split('T')[0]);

      if (weekError) throw weekError;

      // Calculate stats
      const totalSubmissions = allSubmissions?.length || 0;
      const thisWeekSubmissions = thisWeekData?.length || 0;
      
      // Unique zones that have submitted
      const zonesSubmitted = new Set(
        allSubmissions?.map(sub => sub.zone) || []
      ).size;

      // Unique vans that have plans
      const vansWithPlans = new Set(
        allSubmissions?.map(sub => sub.van_id) || []
      ).size;

      // All zones in the system
      const allZones = ['COAST', 'CENTRAL', 'EASTERN', 'WESTERN', 'NYANZA', 'RIFT VALLEY', 'NORTH EASTERN', 'NAIROBI'];
      
      // Zones that submitted this week
      const zonesThisWeek = new Set(
        thisWeekData?.map(sub => sub.zone) || []
      );

      // Zones that haven't submitted this week
      const pendingZones = allZones.filter(zone => !zonesThisWeek.has(zone));

      // Get 5 most recent submissions
      const recent = allSubmissions?.slice(0, 5) || [];

      setStats({
        totalSubmissions,
        thisWeekSubmissions,
        zonesSubmitted,
        totalZones: allZones.length,
        vansWithPlans,
        totalVans: 19,
        pendingZones
      });

      setRecentSubmissions(recent);

      console.log('[Van Calendar Widget] ✅ Stats loaded:', {
        totalSubmissions,
        thisWeekSubmissions,
        zonesSubmitted,
        vansWithPlans
      });

    } catch (error) {
      console.error('[Van Calendar Widget] ❌ Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const complianceRate = stats.totalZones > 0 
    ? Math.round((stats.zonesSubmitted / stats.totalZones) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">🚐 Van Calendar System</h3>
              <p className="text-sm text-blue-100">Weekly Route Planning</p>
            </div>
          </div>
          <button
            onClick={onViewAll}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            View All Plans →
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-200">
        {/* Total Submissions */}
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.totalSubmissions}</div>
          <div className="text-xs text-gray-600 mt-1">Total Plans</div>
        </div>

        {/* This Week */}
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{stats.thisWeekSubmissions}</div>
          <div className="text-xs text-gray-600 mt-1">This Week</div>
        </div>

        {/* Zones */}
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">
            {stats.zonesSubmitted}/{stats.totalZones}
          </div>
          <div className="text-xs text-gray-600 mt-1">Zones Active</div>
        </div>

        {/* Vans */}
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600">
            {stats.vansWithPlans}/{stats.totalVans}
          </div>
          <div className="text-xs text-gray-600 mt-1">Vans Planned</div>
        </div>
      </div>

      {/* Compliance Bar */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Zone Compliance</span>
          <span className="text-sm font-bold text-gray-900">{complianceRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              complianceRate >= 80 ? 'bg-green-500' :
              complianceRate >= 50 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${complianceRate}%` }}
          ></div>
        </div>
      </div>

      {/* Pending Zones Alert */}
      {stats.pendingZones.length > 0 && (
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900 mb-1">
                {stats.pendingZones.length} Zone{stats.pendingZones.length > 1 ? 's' : ''} Pending
              </p>
              <p className="text-xs text-orange-700">
                {stats.pendingZones.join(', ')} - No submissions this week
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Recent Submissions</h4>
        {recentSubmissions.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4">No submissions yet</p>
        ) : (
          <div className="space-y-2">
            {recentSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🚐</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{sub.van_numberplate}</p>
                    <p className="text-xs text-gray-500">{sub.zone} • {sub.zsm_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    {new Date(sub.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={onViewAll}
          className="w-full py-2 text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All Van Calendar Plans →
        </button>
      </div>
    </div>
  );
}
```

---

### **Step 2: Add Widget to HQ Dashboard**

Now integrate this widget into the HQ Command Center dashboard.

**File to Edit**: `/components/role-dashboards.tsx`

Find the HQ Dashboard home view (around line 2562) and add the Van Calendar widget:

```typescript
// Find this section in HQDashboard function:
<div className="flex-1 overflow-y-auto pb-20 p-6">
  <LeaderboardWidget 
    currentUserId={userData?.id} 
    onViewAll={() => setActiveTab('users')} 
  />

  {/* ADD THIS - Van Calendar Widget */}
  <div className="mt-6">
    <VanCalendarWidgetHQ onViewAll={() => {
      // Navigate to programs tab and open van calendar
      setActiveTab('programs');
    }} />
  </div>

  {/* Urgent Announcements Section - Only show urgent priority */}
  {announcements.filter(ann => ann.priority === 'urgent' && !ann.is_read).length > 0 && (
    // ... rest of code
```

**Don't forget to import the component at the top of the file:**

```typescript
// Add this import near the top of /components/role-dashboards.tsx
import { VanCalendarWidgetHQ } from './van-calendar-widget-hq';
```

---

## 🎯 OPTION 2: Add Van Calendar Tab to HQ Dashboard

If you want a dedicated Van Calendar tab in the HQ dashboard (alongside Home, Leaderboard, Programs, etc.):

### **Step 1: Update Bottom Navigation**

**File to Edit**: `/components/bottom-nav.tsx`

Add a Van Calendar icon to the HQ navigation:

```typescript
// Find the HQ role section and add:
{role === 'hq' && (
  <>
    {/* ... existing tabs ... */}
    
    {/* Add Van Calendar Tab */}
    <button
      onClick={() => setActiveTab('van-calendar')}
      className={`flex-1 flex flex-col items-center py-2 ${
        activeTab === 'van-calendar'
          ? 'text-blue-600'
          : 'text-gray-500'
      }`}
    >
      <Truck className="w-6 h-6" />
      <span className="text-xs mt-1">Van Cal</span>
    </button>
  </>
)}
```

### **Step 2: Add Van Calendar Tab Handler**

**File to Edit**: `/components/role-dashboards.tsx`

In the HQDashboard function, add a new tab handler:

```typescript
// Add this after the Programs tab handler (around line 2628):

// Van Calendar Tab
if (activeTab === 'van-calendar') {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <VanCalendarView
        userRole="hq_command_center"
        currentUser={userData}
        onClose={() => setActiveTab('home')}
      />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="hq" />
    </div>
  );
}
```

**Don't forget to import:**

```typescript
// Add to imports at top
import VanCalendarView from './van-calendar-view';
```

---

## 🎯 OPTION 3: Enhanced Submissions Analytics

Show Van Calendar in the existing Submissions Analytics with better filtering.

### **File to Edit**: `/components/submissions-analytics.tsx`

Add Van Calendar filtering option:

```typescript
// In the SubmissionsAnalytics component, add a filter dropdown:

const [programFilter, setProgramFilter] = useState<'all' | 'programs' | 'van-calendar'>('all');

// In the filter section UI:
<select
  value={programFilter}
  onChange={(e) => setProgramFilter(e.target.value as any)}
  className="px-4 py-2 border border-gray-300 rounded-lg"
>
  <option value="all">All Submissions</option>
  <option value="programs">Programs Only</option>
  <option value="van-calendar">🚐 Van Calendar Only</option>
</select>

// In the query:
let query = supabase
  .from('submissions')
  .select('*');

if (programFilter === 'programs') {
  query = query.neq('program_id', 'VAN_CALENDAR_SYSTEM');
} else if (programFilter === 'van-calendar') {
  query = query.eq('program_id', 'VAN_CALENDAR_SYSTEM');
}
```

---

## 📊 OPTION 4: Van Calendar Compliance Dashboard

Create a dedicated compliance view for HQ to track which ZSMs have submitted.

**File to Create**: `/components/van-calendar-compliance-hq.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface ZoneCompliance {
  zone: string;
  zsm_name: string;
  zsm_id: string;
  hasSubmittedThisWeek: boolean;
  lastSubmissionDate: string | null;
  totalSubmissions: number;
  vansInZone: number;
  vansWithPlans: number;
}

export function VanCalendarComplianceHQ() {
  const [compliance, setCompliance] = useState<ZoneCompliance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);

      // Get current week boundaries
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Fetch all ZSMs
      const { data: zsms, error: zsmsError } = await supabase
        .from('users')
        .select('id, employee_id, full_name, zone')
        .eq('role', 'zonal_sales_manager')
        .order('zone');

      if (zsmsError) throw zsmsError;

      // Fetch all van calendar submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('van_calendar_plans')
        .select('*');

      if (submissionsError) throw submissionsError;

      // Fetch this week's submissions
      const { data: thisWeekSubmissions, error: weekError } = await supabase
        .from('van_calendar_plans')
        .select('*')
        .gte('week_start_date', startOfWeek.toISOString().split('T')[0]);

      if (weekError) throw weekError;

      // Fetch all vans
      const { data: vans, error: vansError } = await supabase
        .from('vans')
        .select('*');

      if (vansError) throw vansError;

      // Build compliance data
      const complianceData: ZoneCompliance[] = zsms?.map(zsm => {
        const zoneSubmissions = submissions?.filter(
          sub => sub.zone === zsm.zone
        ) || [];

        const thisWeekZoneSubmissions = thisWeekSubmissions?.filter(
          sub => sub.zone === zsm.zone
        ) || [];

        const zoneVans = vans?.filter(van => van.zone === zsm.zone) || [];
        const vansWithPlans = new Set(
          zoneSubmissions.map(sub => sub.van_id)
        ).size;

        const lastSubmission = zoneSubmissions.length > 0
          ? zoneSubmissions.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
          : null;

        return {
          zone: zsm.zone || 'Unknown',
          zsm_name: zsm.full_name || 'Unknown',
          zsm_id: zsm.employee_id || zsm.id,
          hasSubmittedThisWeek: thisWeekZoneSubmissions.length > 0,
          lastSubmissionDate: lastSubmission?.created_at || null,
          totalSubmissions: zoneSubmissions.length,
          vansInZone: zoneVans.length,
          vansWithPlans
        };
      }) || [];

      setCompliance(complianceData);

    } catch (error) {
      console.error('[Van Calendar Compliance] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const compliantZones = compliance.filter(z => z.hasSubmittedThisWeek).length;
  const complianceRate = compliance.length > 0
    ? Math.round((compliantZones / compliance.length) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{complianceRate}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Zones Compliant</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {compliantZones}/{compliance.length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Zones</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {compliance.length - compliantZones}
              </p>
            </div>
            <Clock className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h3 className="text-lg font-bold text-white">📊 Zone-by-Zone Compliance</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ZSM</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">This Week</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Plans</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vans</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Submission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {compliance.map((zone, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {zone.hasSubmittedThisWeek ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800">{zone.zone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{zone.zsm_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      zone.hasSubmittedThisWeek
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {zone.hasSubmittedThisWeek ? 'Submitted' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-800 font-medium">{zone.totalSubmissions}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600 text-sm">
                      {zone.vansWithPlans}/{zone.vansInZone}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-500">
                      {zone.lastSubmissionDate
                        ? new Date(zone.lastSubmissionDate).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### **Phase 1: Quick Win (15 minutes)**
1. ✅ Create `/components/van-calendar-widget-hq.tsx`
2. ✅ Add widget to HQ Dashboard home (Option 1)
3. ✅ Test: Login as HQ → See Van Calendar widget on home

### **Phase 2: Full Integration (30 minutes)**
1. ✅ Add Van Calendar tab to bottom nav (Option 2)
2. ✅ Add tab handler in HQ Dashboard
3. ✅ Test: Login as HQ → Click Van Cal tab → See all plans

### **Phase 3: Advanced Analytics (Optional)**
1. ✅ Create compliance dashboard (Option 4)
2. ✅ Add to Van Calendar views
3. ✅ Test: View zone-by-zone compliance

---

## 📊 SAMPLE QUERIES FOR CUSTOM REPORTS

If you want to build custom reports, here are useful queries:

### **Query 1: Get All Van Calendar Plans**
```typescript
const { data, error } = await supabase
  .from('van_calendar_plans')
  .select('*')
  .order('created_at', { ascending: false });
```

### **Query 2: Get This Week's Submissions**
```typescript
const startOfWeek = new Date();
startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
startOfWeek.setHours(0, 0, 0, 0);

const { data, error } = await supabase
  .from('van_calendar_plans')
  .select('*')
  .gte('week_start_date', startOfWeek.toISOString().split('T')[0]);
```

### **Query 3: Get Plans by Zone**
```typescript
const { data, error } = await supabase
  .from('van_calendar_plans')
  .select('*')
  .eq('zone', 'COAST')
  .order('created_at', { ascending: false });
```

### **Query 4: Get Plans by Van**
```typescript
const { data, error } = await supabase
  .from('van_calendar_plans')
  .select('*')
  .eq('van_numberplate', 'KAW 747X')
  .order('week_start_date', { ascending: false });
```

### **Query 5: Count Submissions by Zone**
```typescript
const { data, error } = await supabase
  .from('van_calendar_plans')
  .select('zone')
  .then(result => {
    const counts = {};
    result.data?.forEach(item => {
      counts[item.zone] = (counts[item.zone] || 0) + 1;
    });
    return counts;
  });
```

---

## ✅ TESTING CHECKLIST

After implementation, test these scenarios:

### **As HQ User:**
- [ ] Login to HQ dashboard
- [ ] See Van Calendar widget on home screen
- [ ] Widget shows correct stats (total plans, this week, zones, vans)
- [ ] Click "View All Plans" → Opens full Van Calendar view
- [ ] See all submitted plans from all zones
- [ ] Filter by week → Shows correct plans
- [ ] Filter by zone → Shows correct plans
- [ ] See pending zones alert if any zones haven't submitted

### **As Director User:**
- [ ] Same tests as HQ user above
- [ ] Can access Van Calendar from Programs tab
- [ ] Can see compliance reports

---

## 🚀 NEXT STEPS

Once basic integration is working, you can add:

1. **Email Alerts**: Notify HQ when a new van calendar is submitted
2. **WhatsApp Notifications**: Send compliance reminders to ZSMs
3. **Export to Excel**: Download van calendar data for offline analysis
4. **Route Optimization**: AI-powered route suggestions
5. **Historical Comparison**: Compare this week vs last week

---

## 📞 SUPPORT

If you encounter issues:
1. Check browser console for error messages
2. Verify database permissions (van_calendar_plans table)
3. Check that van calendar submissions are being logged
4. Verify user roles (HQ vs ZSM)

---

**🎉 You're all set! HQ now has full visibility into Van Calendar submissions!**
