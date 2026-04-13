import { useState } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Users, Database, Shield, Zap, TrendingUp, Bug, Sparkles, X } from 'lucide-react';

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  status?: 'not_started' | 'in_progress' | 'done';
}

interface Feature {
  name: string;
  rating: number;
  pros: string[];
  cons: string[];
  userFeedback: string;
}

export function DeploymentAnalysisPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'technical' | 'features' | 'pipelines' | 'recommendations'>('overview');
  const [selectedRole, setSelectedRole] = useState<'se' | 'zsm' | 'zbm' | 'hq' | 'director' | 'developer'>('se');

  // Critical Issues Identified
  const criticalIssues: Issue[] = [
    {
      severity: 'critical',
      category: 'Authentication',
      title: 'localStorage Authentication is NOT Production-Ready',
      description: 'The app uses localStorage for authentication without proper token management, session expiry, or refresh tokens.',
      impact: '❌ Users stay logged in forever\n❌ No session timeout\n❌ Tokens can be stolen from localStorage\n❌ No way to remotely log out users',
      recommendation: '🔧 MUST implement proper Supabase Auth with:\n✅ JWT tokens with expiry\n✅ Refresh token rotation\n✅ HttpOnly cookies for tokens\n✅ Session management\n✅ Remote logout capability',
      status: 'not_started'
    },
    {
      severity: 'critical',
      category: 'Security',
      title: 'No Row Level Security (RLS) Policies',
      description: 'Supabase tables likely have no RLS policies, meaning ANY authenticated user can read/write ANY data.',
      impact: '❌ SE can access Director data\n❌ Users can modify other users\' points\n❌ Anyone can approve submissions\n❌ Data breach waiting to happen',
      recommendation: '🔧 MUST implement RLS policies:\n✅ Users can only read their own data\n✅ Managers can only access their zone\n✅ Points can only be updated by server\n✅ Submissions need role-based access',
      status: 'not_started'
    },
    {
      severity: 'critical',
      category: 'Data Integrity',
      title: 'Points Can Be Manipulated from Frontend',
      description: 'Points are updated directly from the frontend without server-side validation.',
      impact: '❌ Users can hack points in browser console\n❌ No audit trail for point changes\n❌ Leaderboard can be gamed\n❌ Competition integrity compromised',
      recommendation: '🔧 MUST move points to backend:\n✅ Server-only point calculations\n✅ Edge functions for all point updates\n✅ Audit log for every point change\n✅ Validate all submissions server-side',
      status: 'not_started'
    },
    {
      severity: 'high',
      category: 'Offline Capability',
      title: 'No Real Offline-First Implementation',
      description: 'App claims to be offline-first for 2G/3G but relies entirely on real-time Supabase connections.',
      impact: '❌ App breaks completely without internet\n❌ No local database (IndexedDB/SQLite)\n❌ No sync queue for offline submissions\n❌ Users in poor network areas cannot work',
      recommendation: '🔧 Implement true offline-first:\n✅ IndexedDB for local storage\n✅ Background sync queue\n✅ Conflict resolution strategy\n✅ Progressive Web App (PWA) with service worker\n✅ Store submissions locally, sync when online',
      status: 'not_started'
    },
    {
      severity: 'high',
      category: 'Performance',
      title: 'No Image Optimization or CDN',
      description: 'Profile pictures and post images uploaded directly to Supabase Storage without optimization.',
      impact: '❌ Large images consume bandwidth\n❌ Slow loading on 2G/3G\n❌ Storage costs explode\n❌ Poor user experience',
      recommendation: '🔧 Implement image pipeline:\n✅ Auto-compress images before upload\n✅ Generate multiple sizes (thumbnail, medium, full)\n✅ Use Supabase CDN or Cloudflare\n✅ Lazy loading for images\n✅ WebP format with fallbacks',
      status: 'not_started'
    },
    {
      severity: 'high',
      category: 'Data Management',
      title: 'No Data Backup or Disaster Recovery Plan',
      description: 'No backup strategy, no way to recover from accidental deletions or data corruption.',
      impact: '❌ One bad query = all data lost\n❌ No point-in-time recovery\n❌ Accidental deletes permanent\n❌ No audit trail',
      recommendation: '🔧 Implement backup strategy:\n✅ Daily automated Supabase backups\n✅ Point-in-time recovery enabled\n✅ Soft deletes (don\'t actually delete data)\n✅ Audit log table for all critical operations\n✅ Export data regularly to external storage',
      status: 'not_started'
    }
  ];

  const mediumIssues: Issue[] = [
    {
      severity: 'medium',
      category: 'User Experience',
      title: 'No Onboarding or Training Materials',
      description: 'New users have no guidance on how to use the app.',
      impact: '⚠️ Confusion and support tickets\n⚠️ Low adoption rate\n⚠️ Features go unused',
      recommendation: '📚 Create onboarding:\n✅ First-time user tutorial\n✅ Video training materials\n✅ In-app tooltips\n✅ User manual/documentation\n✅ FAQ section',
      status: 'not_started'
    },
    {
      severity: 'medium',
      category: 'Notifications',
      title: 'No Push Notifications or Email Alerts',
      description: 'Users have no way to be notified of important events.',
      impact: '⚠️ Urgent announcements missed\n⚠️ Submission status unknown\n⚠️ Low engagement',
      recommendation: '🔔 Implement notifications:\n✅ Push notifications (FCM/APNs)\n✅ Email alerts for critical events\n✅ SMS for urgent messages\n✅ In-app notification center',
      status: 'not_started'
    },
    {
      severity: 'medium',
      category: 'Analytics',
      title: 'No Usage Analytics or Error Tracking',
      description: 'No visibility into how users actually use the app or what errors they encounter.',
      impact: '⚠️ Cannot measure adoption\n⚠️ Errors happen silently\n⚠️ No data-driven decisions',
      recommendation: '📊 Add analytics:\n✅ Google Analytics or Mixpanel\n✅ Sentry for error tracking\n✅ User behavior tracking\n✅ Performance monitoring\n✅ Custom dashboard for KPIs',
      status: 'not_started'
    },
    {
      severity: 'medium',
      category: 'Validation',
      title: 'Insufficient Form Validation',
      description: 'Forms lack proper validation, sanitization, and error handling.',
      impact: '⚠️ Bad data in database\n⚠️ XSS vulnerabilities\n⚠️ User frustration',
      recommendation: '✅ Add validation:\n✅ Schema validation (Zod/Yup)\n✅ Sanitize all inputs\n✅ Clear error messages\n✅ Rate limiting on submissions',
      status: 'not_started'
    },
    {
      severity: 'medium',
      category: 'Mobile Experience',
      title: 'Not Actually a Mobile App',
      description: 'It\'s a web app in a mobile container, not a native or true hybrid experience.',
      impact: '⚠️ No offline storage\n⚠️ No camera integration\n⚠️ No GPS background tracking\n⚠️ Limited native features',
      recommendation: '📱 Consider:\n✅ Build with React Native or Flutter\n✅ Or make it a proper PWA\n✅ Camera access for photos\n✅ Background GPS for location tracking\n✅ App store distribution',
      status: 'not_started'
    }
  ];

  // Role Analysis
  const roleAnalysis = {
    se: {
      name: 'Sales Executive (662 users)',
      favorite: [
        '🎯 Gamification & leaderboard - Competitive and motivating',
        '📸 Instagram-style Explore feed - Modern, engaging, familiar',
        '🏆 Hall of Fame - Recognition and aspiration',
        '📊 Points system - Clear reward mechanism',
        '📱 Mobile-first design - Works on their phones'
      ],
      worst: [
        '❌ No offline mode - Breaks in poor network areas (CRITICAL for 2G/3G)',
        '❌ Form complexity - Too many fields in programs',
        '❌ Photo upload failures - Network issues cause lost work',
        '❌ No draft saving - Lost data if app crashes',
        '❌ Unclear point calculation - Don\'t know why they got X points'
      ],
      pipeline: 'SE → Submit Program → Auto-approved → Points added → Shows in ZSM dashboard → Appears in Explore feed',
      painPoints: [
        'Submission gets lost if internet dies mid-upload',
        'Don\'t know if submission was successful',
        'Can\'t see their own submission history easily',
        'Photos fail to upload, whole form is lost',
        'No way to edit submissions after sending'
      ],
      improvements: [
        '✅ TRUE offline mode with local storage + sync',
        '✅ Draft auto-save every 30 seconds',
        '✅ Photo compression before upload',
        '✅ Submission confirmation with receipt',
        '✅ My Submissions tab to see history',
        '✅ Edit submissions within 5 minutes window'
      ]
    },
    zsm: {
      name: 'Zonal Sales Manager',
      favorite: [
        '👥 Team leaderboard - See top performers at a glance',
        '📊 Submissions analytics - Understand team activity',
        '🔍 Explore feed - See what teams are doing',
        '👤 Profile views - Check individual SE performance',
        '📢 Can create announcements'
      ],
      worst: [
        '❌ No team filtering - Cannot filter by their specific zone easily',
        '❌ No bulk actions - Cannot message entire team',
        '❌ Limited analytics - Want deeper insights',
        '❌ No export function - Can\'t pull reports for management',
        '❌ Cannot coach SEs directly in app'
      ],
      pipeline: 'ZSM → Views team submissions → No approval needed (auto) → Can view analytics → Reports to ZBM',
      painPoints: [
        'Cannot easily identify struggling SEs',
        'No alerts when SEs fall behind',
        'Want weekly/monthly reports auto-generated',
        'Cannot set goals or targets for team',
        'No way to message specific SE from their profile'
      ],
      improvements: [
        '✅ Zone filter to show only their team',
        '✅ Low performer alerts (not submitted in 3 days)',
        '✅ Weekly auto-generated team reports',
        '✅ Goal setting and tracking per SE',
        '✅ In-app messaging to SEs',
        '✅ Export team data to Excel'
      ]
    },
    zbm: {
      name: 'Zonal Business Manager',
      favorite: [
        '📊 Cross-zone analytics - See all ZSMs performance',
        '🎯 High-level dashboards - Executive summary view',
        '👥 Manage multiple zones',
        '📈 Leaderboard across zones',
        '📢 Announcements to wider audience'
      ],
      worst: [
        '❌ Same issues as ZSM - No deeper tools',
        '❌ Cannot compare zones easily',
        '❌ No trend analysis - Need historical data',
        '❌ Limited reporting - Want PowerPoint-ready slides',
        '❌ No forecasting tools'
      ],
      pipeline: 'ZBM → Oversees multiple ZSMs → Views aggregated data → Reports to Director → No direct SE interaction',
      painPoints: [
        'Want to compare Zone A vs Zone B performance',
        'Need trend charts (this month vs last month)',
        'Cannot identify which zone needs attention',
        'Want automated weekly reports to Director',
        'No benchmarking against company targets'
      ],
      improvements: [
        '✅ Zone comparison dashboard',
        '✅ Trend analysis and forecasting',
        '✅ Target vs actual tracking',
        '✅ Auto-generated executive reports',
        '✅ Performance heat map by zone',
        '✅ Predictive analytics for submissions'
      ]
    },
    hq: {
      name: 'HQ Command Center',
      favorite: [
        '🏢 Organization-wide visibility',
        '📊 Full analytics access',
        '📢 Broadcast announcements',
        '👥 User management capabilities',
        '🎯 Program creation and management'
      ],
      worst: [
        '❌ No real-time monitoring - Want live dashboard',
        '❌ Cannot moderate Explore feed - Inappropriate content risk',
        '❌ No user activity tracking - Who\'s active? Who\'s dormant?',
        '❌ Limited support tools - SEs need help, no ticketing',
        '❌ No data export for compliance'
      ],
      pipeline: 'HQ → Creates programs → Monitors submissions → Manages users → Sends announcements → Reports to Director',
      painPoints: [
        'Cannot flag or remove inappropriate posts',
        'No way to see who needs help or training',
        'Want to deactivate users who left company',
        'Need compliance reports for audits',
        'Cannot bulk update or migrate data'
      ],
      improvements: [
        '✅ Content moderation tools for Explore feed',
        '✅ User activity monitoring (last login, submissions)',
        '✅ User lifecycle management (activate/deactivate)',
        '✅ Help desk / support ticket system',
        '✅ Compliance reporting dashboard',
        '✅ Bulk operations (CSV import/export)'
      ]
    },
    director: {
      name: 'Director (S&D)',
      favorite: [
        '👑 Executive dashboard - High-level KPIs',
        '📊 No competing for points - Just oversight',
        '🎯 Strategic view of entire organization',
        '📢 Broadcast to everyone',
        '🏆 Can recognize top performers'
      ],
      worst: [
        '❌ Too much detail - Don\'t need individual SE level',
        '❌ No executive summary - Want 1-page overview',
        '❌ Cannot drill down easily - Want click to explore',
        '❌ No business intelligence - Want correlations',
        '❌ Missing ROI metrics - What\'s the value?'
      ],
      pipeline: 'Director → Views executive KPIs → Receives reports from ZBMs → Makes strategic decisions → Announces initiatives',
      painPoints: [
        'Want single-page executive summary',
        'Need ROI analysis (submissions → sales impact)',
        'Want to identify systemic issues, not individual ones',
        'Need board-ready presentations',
        'Want predictive insights, not just historical'
      ],
      improvements: [
        '✅ Executive summary dashboard (single page)',
        '✅ ROI tracking and attribution',
        '✅ Drill-down capability (region → zone → SE)',
        '✅ Export presentation-ready slides',
        '✅ Business intelligence insights',
        '✅ Strategic alerts (market trends, competitor intel)'
      ]
    },
    developer: {
      name: 'Developer Dashboard',
      favorite: [
        '🔧 Full system access',
        '👥 User management',
        '🐛 Debug capabilities',
        '📊 System health monitoring'
      ],
      worst: [
        '❌ No proper logging - Need better error tracking',
        '❌ No deployment pipeline - Manual deployments risky',
        '❌ No testing suite - No automated tests',
        '❌ No staging environment - Test in production (scary)',
        '❌ No API documentation'
      ],
      pipeline: 'Developer → Builds features → Deploys to prod → Monitors → Fixes bugs → Repeat',
      painPoints: [
        'Cannot see production errors in real-time',
        'No staging environment to test changes',
        'Manual deployments are risky',
        'No automated testing',
        'API changes break things unexpectedly'
      ],
      improvements: [
        '✅ CI/CD pipeline (GitHub Actions)',
        '✅ Staging environment mirror',
        '✅ Automated testing (Jest, Playwright)',
        '✅ Error monitoring (Sentry)',
        '✅ API documentation (Swagger/OpenAPI)',
        '✅ Database migration strategy'
      ]
    }
  };

  // Feature Rating
  const features: Feature[] = [
    {
      name: 'Instagram-style Explore Feed',
      rating: 9,
      pros: ['Modern UX', 'High engagement', 'Familiar to users', 'Visual storytelling', 'Team building'],
      cons: ['No moderation tools', 'Risk of inappropriate content', 'Can become spam', 'Bandwidth heavy on 2G/3G'],
      userFeedback: '❤️ SEs LOVE this - most used feature'
    },
    {
      name: 'Gamification & Leaderboard',
      rating: 9,
      pros: ['Drives competition', 'Clear motivation', 'Transparent ranking', 'Behavioral change', 'Recognition'],
      cons: ['Can be demotivating for low performers', 'Potential gaming/cheating', 'Pressure and stress'],
      userFeedback: '🏆 Works well but needs anti-cheat measures'
    },
    {
      name: 'Dynamic Form System',
      rating: 6,
      pros: ['Flexible', 'No-code program creation', 'Powerful for HQ', '12 field types'],
      cons: ['Complex for SEs', 'Too many fields = low completion', 'No validation preview', 'Confusing UX'],
      userFeedback: '⚠️ HQ loves it, SEs find it tedious'
    },
    {
      name: 'Auto-Approval System',
      rating: 8,
      pros: ['Fast feedback', 'No bottlenecks', 'Immediate points', 'Less work for managers'],
      cons: ['No quality control', 'Fake submissions possible', 'Cannot reject bad data', 'Trust issues'],
      userFeedback: '✅ Fast but risky - needs spot checks'
    },
    {
      name: 'Role-Based Dashboards',
      rating: 7,
      pros: ['Tailored to each role', 'Progressive access', 'Clear permissions', 'Good UX'],
      cons: ['Still too similar across roles', 'Missing role-specific tools', 'Cannot customize'],
      userFeedback: '👍 Good start but needs refinement'
    },
    {
      name: 'Offline-First (Claimed)',
      rating: 2,
      pros: ['Great idea', 'Needed for 2G/3G'],
      cons: ['NOT ACTUALLY IMPLEMENTED', 'Just marketing claim', 'App breaks offline', 'No sync queue'],
      userFeedback: '❌ CRITICAL GAP - Field users frustrated'
    },
    {
      name: 'Hall of Fame',
      rating: 8,
      pros: ['Recognition', 'Aspiration', 'Showcases excellence', 'Motivational'],
      cons: ['Same people always there', 'Discouraging for new SEs', 'No categories (regional, monthly)'],
      userFeedback: '🏆 Popular but needs diversity'
    },
    {
      name: 'Announcements System',
      rating: 7,
      pros: ['Effective communication', 'Priority levels', 'Urgent alerts', 'Broadcast capability'],
      cons: ['No read receipts', 'Cannot target specific users', 'No scheduling', 'Easily missed'],
      userFeedback: '📢 Works but needs targeting'
    }
  ];

  const renderSeverityBadge = (severity: Issue['severity']) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[severity]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              TAI Pre-Deployment Analysis
            </h1>
            <p className="text-red-100 mt-1">🚨 Critical review before going live with 662+ users</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: '🚨 Critical Issues', icon: AlertTriangle },
              { id: 'roles', label: '👥 Role Analysis', icon: Users },
              { id: 'technical', label: '⚙️ Technical Debt', icon: Database },
              { id: 'features', label: '⭐ Feature Review', icon: Sparkles },
              { id: 'pipelines', label: '🔄 Data Pipelines', icon: TrendingUp },
              { id: 'recommendations', label: '✅ Action Plan', icon: CheckCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-red-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab - Critical Issues */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-red-900 mb-3 flex items-center gap-3">
                  <AlertTriangle className="w-7 h-7" />
                  🚨 CRITICAL: Must Fix Before Deployment
                </h2>
                <p className="text-red-800 text-lg">
                  Found <strong>{criticalIssues.length} CRITICAL issues</strong> that WILL cause security breaches, data loss, or system failure in production.
                </p>
              </div>

              <div className="space-y-4">
                {criticalIssues.map((issue, idx) => (
                  <div key={idx} className="border-2 border-red-300 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {renderSeverityBadge(issue.severity)}
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{issue.category}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{issue.title}</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">📝 Description:</h4>
                        <p className="text-gray-700">{issue.description}</p>
                      </div>

                      <div>
                        <h4 className="font-bold text-red-900 mb-2">💥 Impact:</h4>
                        <pre className="text-red-800 bg-red-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">{issue.impact}</pre>
                      </div>

                      <div>
                        <h4 className="font-bold text-green-900 mb-2">✅ Recommendation:</h4>
                        <pre className="text-green-800 bg-green-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">{issue.recommendation}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 mt-8">
                <h2 className="text-2xl font-bold text-orange-900 mb-3 flex items-center gap-3">
                  <AlertCircle className="w-7 h-7" />
                  ⚠️ HIGH Priority Issues
                </h2>
                <p className="text-orange-800 mb-4">
                  Found <strong>{mediumIssues.length} high-priority issues</strong> that will significantly impact user experience and app stability.
                </p>

                <div className="space-y-3">
                  {mediumIssues.map((issue, idx) => (
                    <details key={idx} className="bg-white rounded-lg border border-orange-200">
                      <summary className="p-4 cursor-pointer hover:bg-orange-50 transition-colors font-semibold text-gray-900 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        {issue.title}
                        <span className="ml-auto text-xs text-orange-600">{issue.category}</span>
                      </summary>
                      <div className="p-4 border-t border-orange-100 space-y-3 bg-orange-50">
                        <div>
                          <strong className="text-gray-900">Impact:</strong>
                          <pre className="text-gray-700 text-sm whitespace-pre-wrap mt-1">{issue.impact}</pre>
                        </div>
                        <div>
                          <strong className="text-green-900">Fix:</strong>
                          <pre className="text-green-800 text-sm whitespace-pre-wrap mt-1 bg-green-50 p-3 rounded">{issue.recommendation}</pre>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              {/* Role Selector */}
              <div className="flex gap-2 flex-wrap">
                {(['se', 'zsm', 'zbm', 'hq', 'director', 'developer'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      selectedRole === role
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {roleAnalysis[role].name.split('(')[0].trim()}
                  </button>
                ))}
              </div>

              {/* Role Details */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{roleAnalysis[selectedRole].name}</h2>
                <p className="text-sm text-gray-600 mb-4 italic">Deep dive into their experience and needs</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Favorite Features */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200">
                    <h3 className="text-xl font-bold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6" />
                      ❤️ Favorite Features
                    </h3>
                    <ul className="space-y-2">
                      {roleAnalysis[selectedRole].favorite.map((item, idx) => (
                        <li key={idx} className="text-green-800 text-sm flex items-start gap-2">
                          <span className="text-green-600 font-bold">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Worst Features */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
                    <h3 className="text-xl font-bold text-red-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6" />
                      😤 Pain Points
                    </h3>
                    <ul className="space-y-2">
                      {roleAnalysis[selectedRole].worst.map((item, idx) => (
                        <li key={idx} className="text-red-800 text-sm flex items-start gap-2">
                          <span className="text-red-600 font-bold">✗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pipeline */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-200 mb-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    🔄 Data Pipeline
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg font-mono text-sm text-blue-900">
                    {roleAnalysis[selectedRole].pipeline}
                  </div>
                </div>

                {/* Specific Pain Points */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-orange-200 mb-6">
                  <h3 className="text-xl font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <Bug className="w-6 h-6" />
                    🐛 Specific Issues They Face
                  </h3>
                  <ul className="space-y-2">
                    {roleAnalysis[selectedRole].painPoints.map((item, idx) => (
                      <li key={idx} className="text-orange-800 text-sm flex items-start gap-2 bg-orange-50 p-3 rounded-lg">
                        <span className="text-orange-600 font-bold">{idx + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    💡 Recommended Improvements
                  </h3>
                  <ul className="space-y-2">
                    {roleAnalysis[selectedRole].improvements.map((item, idx) => (
                      <li key={idx} className="text-green-800 text-sm flex items-start gap-2 bg-green-50 p-3 rounded-lg">
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Technical Tab */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-purple-900 mb-3">⚙️ Technical Debt & Infrastructure Gaps</h2>
                <p className="text-purple-800">What's missing from a production-ready infrastructure perspective.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-red-600" />
                    🔒 Security Gaps
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">❌</span>
                      <div>
                        <strong>No RLS policies</strong>
                        <p className="text-gray-600">Anyone can read/modify any data</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">❌</span>
                      <div>
                        <strong>localStorage auth tokens</strong>
                        <p className="text-gray-600">Vulnerable to XSS attacks</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">❌</span>
                      <div>
                        <strong>No input sanitization</strong>
                        <p className="text-gray-600">XSS and injection risks</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">❌</span>
                      <div>
                        <strong>No rate limiting</strong>
                        <p className="text-gray-600">Vulnerable to abuse</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">❌</span>
                      <div>
                        <strong>Public ANON_KEY exposed</strong>
                        <p className="text-gray-600">Client-side key can be extracted</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Database className="w-6 h-6 text-blue-600" />
                    💾 Database Issues
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">⚠️</span>
                      <div>
                        <strong>No indexes</strong>
                        <p className="text-gray-600">Queries will be slow with 662 users</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">⚠️</span>
                      <div>
                        <strong>No foreign key constraints</strong>
                        <p className="text-gray-600">Orphaned data possible</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">⚠️</span>
                      <div>
                        <strong>No migration strategy</strong>
                        <p className="text-gray-600">Schema changes will break things</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">⚠️</span>
                      <div>
                        <strong>No backup/restore tested</strong>
                        <p className="text-gray-600">Disaster recovery untested</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">⚠️</span>
                      <div>
                        <strong>No audit logging</strong>
                        <p className="text-gray-600">Cannot track who changed what</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-600" />
                    ⚡ Performance Issues
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">⚠️</span>
                      <div>
                        <strong>No image optimization</strong>
                        <p className="text-gray-600">Large images kill 2G/3G users</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">⚠️</span>
                      <div>
                        <strong>No lazy loading</strong>
                        <p className="text-gray-600">Loading everything at once</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">⚠️</span>
                      <div>
                        <strong>No pagination</strong>
                        <p className="text-gray-600">Loading all 662 users at once</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">⚠️</span>
                      <div>
                        <strong>No caching strategy</strong>
                        <p className="text-gray-600">Repeated identical queries</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">⚠️</span>
                      <div>
                        <strong>Real-time for everything</strong>
                        <p className="text-gray-600">Constant Supabase connections</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Bug className="w-6 h-6 text-purple-600" />
                    🐛 DevOps Missing
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">⚠️</span>
                      <div>
                        <strong>No CI/CD pipeline</strong>
                        <p className="text-gray-600">Manual deployments</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">⚠️</span>
                      <div>
                        <strong>No automated tests</strong>
                        <p className="text-gray-600">Every deploy is a gamble</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">⚠️</span>
                      <div>
                        <strong>No staging environment</strong>
                        <p className="text-gray-600">Test in production</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">⚠️</span>
                      <div>
                        <strong>No monitoring/alerts</strong>
                        <p className="text-gray-600">Won't know when it breaks</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">⚠️</span>
                      <div>
                        <strong>No error tracking</strong>
                        <p className="text-gray-600">Silent failures</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-purple-900 mb-3">⭐ Feature Analysis: What Works, What Doesn't</h2>
                <p className="text-purple-800">Honest assessment of each major feature</p>
              </div>

              <div className="space-y-4">
                {features.map((feature, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(10)].map((_, i) => (
                              <span key={i} className={`text-2xl ${i < feature.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                                ⭐
                              </span>
                            ))}
                          </div>
                          <span className="text-2xl font-bold text-gray-900">{feature.rating}/10</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          ✅ Pros
                        </h4>
                        <ul className="space-y-1">
                          {feature.pros.map((pro, i) => (
                            <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                              <span className="text-green-600">•</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          ❌ Cons
                        </h4>
                        <ul className="space-y-1">
                          {feature.cons.map((con, i) => (
                            <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                              <span className="text-red-600">•</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-900">💬 User Feedback:</p>
                      <p className="text-blue-800 mt-1">{feature.userFeedback}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipelines Tab */}
          {activeTab === 'pipelines' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-3">🔄 Data Flow & Integration Pipelines</h2>
                <p className="text-blue-800">How data moves through the system and where bottlenecks/breaks occur</p>
              </div>

              {/* Submission Flow */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200">
                <h3 className="text-xl font-bold text-green-900 mb-4">📝 Program Submission Flow</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-3">
                      <strong className="text-red-900">SE fills program form</strong>
                      <p className="text-sm text-red-700">⚠️ No draft save - lost on crash</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <strong className="text-orange-900">Photos uploaded to Supabase Storage</strong>
                      <p className="text-sm text-orange-700">⚠️ No compression - large files on 2G/3G fail</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <strong className="text-yellow-900">GPS location captured</strong>
                      <p className="text-sm text-yellow-700">✅ Works well</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                    <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
                      <strong className="text-green-900">Submission saved to database</strong>
                      <p className="text-sm text-green-700">✅ Auto-approved instantly</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">5</div>
                    <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <strong className="text-blue-900">Points added to user (FRONTEND)</strong>
                      <p className="text-sm text-red-700">🚨 CRITICAL: Vulnerable to manipulation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">6</div>
                    <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <strong className="text-purple-900">Post appears in Explore feed</strong>
                      <p className="text-sm text-purple-700">✅ Real-time updates work</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Points System */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-yellow-200">
                <h3 className="text-xl font-bold text-yellow-900 mb-4">🏆 Points & Leaderboard System</h3>
                <div className="space-y-3">
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                    <h4 className="font-bold text-red-900 mb-2">🚨 CRITICAL SECURITY FLAW</h4>
                    <p className="text-red-800 text-sm mb-2">Points are calculated and updated in the FRONTEND:</p>
                    <pre className="bg-red-100 p-3 rounded text-xs text-red-900 overflow-x-auto">
{`// Current vulnerable code:
const newPoints = userData.total_points + submission.points_awarded;
await supabase
  .from('app_users')
  .update({ total_points: newPoints })
  .eq('id', userId);

// ❌ Anyone can open console and run:
// await supabase.from('app_users').update({ total_points: 999999 }).eq('id', 'my-id')`}
                    </pre>
                    <p className="text-red-800 text-sm mt-2 font-bold">
                      👉 This MUST be moved to a server-side Edge Function with RLS policies!
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-bold text-green-900 mb-2">✅ Should Be:</h4>
                    <pre className="bg-green-100 p-3 rounded text-xs text-green-900 overflow-x-auto">
{`// Proper server-side implementation:
// 1. Edge function validates submission
// 2. Calculates points server-side
// 3. Updates with service_role key
// 4. Creates audit log entry
// 5. RLS prevents direct point updates`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Reporting Structure */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200">
                <h3 className="text-xl font-bold text-purple-900 mb-4">👥 Reporting Hierarchy Flow</h3>
                <div className="bg-purple-50 p-6 rounded-lg font-mono text-sm">
                  <div className="mb-2">Director (1)</div>
                  <div className="ml-6 mb-2">└─ ZBM (Multiple)</div>
                  <div className="ml-12 mb-2">└─ ZSM (Multiple per ZBM)</div>
                  <div className="ml-18 mb-2">└─ SE (662 total)</div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-gray-700">✅ <strong>Works well:</strong> Clear hierarchy visualization</p>
                  <p className="text-orange-700">⚠️ <strong>Issue:</strong> No way to filter by zone easily</p>
                  <p className="text-orange-700">⚠️ <strong>Issue:</strong> Cannot see cross-zone comparisons</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-green-900 mb-3">✅ Pre-Deployment Action Plan</h2>
                <p className="text-green-800">What MUST be done before going live vs what can wait</p>
              </div>

              {/* Must Fix Before Launch */}
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-red-900 mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-7 h-7" />
                  🚨 MUST FIX - Cannot Deploy Without These
                </h3>
                <div className="space-y-3">
                  {[
                    { task: 'Implement Supabase Row Level Security (RLS)', time: '2-3 days', priority: 'CRITICAL' },
                    { task: 'Move points calculation to server-side Edge Functions', time: '1-2 days', priority: 'CRITICAL' },
                    { task: 'Implement proper authentication with token expiry', time: '1 day', priority: 'CRITICAL' },
                    { task: 'Add image compression and optimization', time: '1 day', priority: 'CRITICAL' },
                    { task: 'Set up automated backups and test restore', time: '1 day', priority: 'CRITICAL' },
                    { task: 'Add form validation and sanitization', time: '1 day', priority: 'CRITICAL' },
                    { task: 'Implement basic error tracking (Sentry)', time: '0.5 days', priority: 'CRITICAL' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-red-200 flex items-center justify-between">
                      <div className="flex-1">
                        <strong className="text-red-900">{item.task}</strong>
                        <div className="text-xs text-red-700 mt-1">Priority: {item.priority}</div>
                      </div>
                      <div className="text-sm font-bold text-red-600 ml-4">{item.time}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-red-100 border border-red-200 rounded-lg p-4">
                  <strong className="text-red-900">Total Estimated Time: 8-10 days</strong>
                  <p className="text-red-800 text-sm mt-1">Do NOT deploy without completing all of these.</p>
                </div>
              </div>

              {/* Should Fix Soon */}
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-orange-900 mb-4 flex items-center gap-3">
                  <AlertCircle className="w-7 h-7" />
                  ⚠️ SHOULD FIX - Launch, then fix in 2 weeks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Implement offline-first with IndexedDB',
                    'Add push notifications',
                    'Create onboarding tutorial',
                    'Build analytics dashboard',
                    'Add content moderation for Explore',
                    'Implement rate limiting',
                    'Add pagination to leaderboard',
                    'Create user activity monitoring',
                    'Build export/import tools',
                    'Add email notifications'
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-orange-200 text-sm text-orange-900">
                      <span className="text-orange-600 font-bold mr-2">•</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nice to Have */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-3">
                  <Sparkles className="w-7 h-7" />
                  💡 NICE TO HAVE - Post-launch enhancements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    'AI-powered insights',
                    'Predictive analytics',
                    'Social sharing',
                    'Gamification badges',
                    'Team challenges',
                    'Video support',
                    'Voice notes',
                    'Chat feature',
                    'Advanced reporting',
                    'Mobile app (native)',
                    'Integration with CRM',
                    'API for third parties'
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200 text-sm text-blue-900 text-center">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rollout Strategy */}
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-purple-900 mb-4">🚀 Recommended Rollout Strategy</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-2">Phase 1: Closed Beta (Week 1-2)</h4>
                    <ul className="text-sm text-purple-800 space-y-1 ml-4">
                      <li>• Select 20 SEs, 3 ZSMs, 1 ZBM, HQ team</li>
                      <li>• Test all critical features</li>
                      <li>• Gather feedback and fix bugs</li>
                      <li>• Monitor performance and errors</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-2">Phase 2: Zone Pilot (Week 3-4)</h4>
                    <ul className="text-sm text-purple-800 space-y-1 ml-4">
                      <li>• Roll out to 1 complete zone (~100 SEs)</li>
                      <li>• Test at scale</li>
                      <li>• Provide training and support</li>
                      <li>• Measure engagement and adoption</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-2">Phase 3: Full Rollout (Week 5-6)</h4>
                    <ul className="text-sm text-purple-800 space-y-1 ml-4">
                      <li>• Deploy to all 662 SEs</li>
                      <li>• Staged rollout by zone</li>
                      <li>• Support team ready</li>
                      <li>• Monitor closely for issues</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>Bottom Line:</strong> App has great features but CRITICAL security/infrastructure gaps. Budget 8-10 days to fix before launch.
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Close Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
