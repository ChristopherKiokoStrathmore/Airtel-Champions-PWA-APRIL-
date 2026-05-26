import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { Calendar, User, Award, Filter, Search, Eye, CheckCircle, XCircle, Clock, Wifi, AlertCircle } from 'lucide-react';
import { ProgramSubmissions } from './program-submissions';

interface Submission {
  id: string;
  program_id: string;
  user_id: string;
  status: string;
  points_awarded: number;
  created_at: string;
  updated_at: string;
  program?: {
    title: string;
    points_value: number;
  };
  user?: {
    full_name: string;
    employee_id: string;
    role: string;
    zone: string;
  };
}

function getNetworkIssueUiStatus(status: string | null) {
  if (!status || status === 'open') return 'open';
  if (status === 'acknowledged') return 'in_progress';
  return 'resolved';
}

function NetworkIssueBadge({ status }: { status: string | null }) {
  const ui = getNetworkIssueUiStatus(status);
  if (ui === 'open') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
      <AlertCircle className="w-3 h-3" /> Open
    </span>
  );
  if (ui === 'in_progress') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
      <Clock className="w-3 h-3" /> In Progress
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
      <CheckCircle className="w-3 h-3" /> Resolved
    </span>
  );
}

interface NetworkIssue {
  id: string;
  program_id: string;
  user_id: string;
  responses: Record<string, any>;
  network_issue_status: string | null;
  created_at: string;
  program_title: string;
  reporter_name: string;
  reporter_zone: string;
}

export function AllSubmissionsView() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedProgramTitle, setSelectedProgramTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'network_issues'>('all');
  const [networkIssues, setNetworkIssues] = useState<NetworkIssue[]>([]);
  const [networkIssuesLoading, setNetworkIssuesLoading] = useState(false);
  const [networkIssueFilter, setNetworkIssueFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    loadSubmissions();
    loadNetworkIssues();
  }, [statusFilter]);

  const loadNetworkIssues = async () => {
    setNetworkIssuesLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: programs } = await supabase
        .from('programs')
        .select('id, title')
        .eq('program_type', 'network_issues');

      if (!programs || programs.length === 0) {
        setNetworkIssues([]);
        return;
      }

      const programIds = programs.map((p: any) => p.id);
      const programMap: Record<string, string> = {};
      programs.forEach((p: any) => { programMap[p.id] = p.title; });

      const { data: subs } = await supabase
        .from('submissions')
        .select('id, program_id, user_id, responses, network_issue_status, created_at')
        .in('program_id', programIds)
        .order('created_at', { ascending: false })
        .limit(500);

      if (!subs || subs.length === 0) {
        setNetworkIssues([]);
        return;
      }

      const userIds = [...new Set(subs.map((s: any) => s.user_id))];
      const { data: users } = await supabase
        .from('app_users')
        .select('id, full_name, zone')
        .in('id', userIds);

      const userMap: Record<string, any> = {};
      (users || []).forEach((u: any) => { userMap[u.id] = u; });

      setNetworkIssues(subs.map((s: any) => ({
        ...s,
        program_title: programMap[s.program_id] || 'Unknown',
        reporter_name: userMap[s.user_id]?.full_name || 'Unknown',
        reporter_zone: userMap[s.user_id]?.zone || '',
      })));
    } finally {
      setNetworkIssuesLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      
      console.log('[AllSubmissions] Loading all submissions...');
      
      let query = supabase
        .from('submissions')
        .select(`
          *,
          programs!inner (
            id,
            title,
            points_value
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        console.error('[AllSubmissions] Database error:', dbError);
        throw new Error(dbError.message);
      }

      console.log('[AllSubmissions] ✅ Loaded', data?.length || 0, 'submissions');
      
      // Transform the data to match our interface
      const transformedData = data?.map(sub => ({
        ...sub,
        program: sub.programs,
      })) || [];
      
      setSubmissions(transformedData);
    } catch (err: any) {
      console.error('[AllSubmissions] Error:', err);
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    // Simplified: All submissions are just "Submitted" - no approval workflow
    return 'bg-green-50 text-green-700 border-green-200';
  };

  const getStatusIcon = (status: string) => {
    // All submissions show checkmark - no approval workflow
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusLabel = (status: string) => {
    // All submissions are "Submitted"
    return 'Submitted';
  };

  // Filter submissions by search query
  const filteredSubmissions = submissions.filter(sub => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      sub.program?.title?.toLowerCase().includes(query) ||
      sub.user?.full_name?.toLowerCase().includes(query) ||
      sub.user?.employee_id?.toLowerCase().includes(query) ||
      sub.user?.zone?.toLowerCase().includes(query)
    );
  });

  // Group submissions by program
  const submissionsByProgram = filteredSubmissions.reduce((acc, sub) => {
    const programId = sub.program_id;
    if (!acc[programId]) {
      acc[programId] = {
        program: sub.program,
        submissions: [],
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };
    }
    acc[programId].submissions.push(sub);
    acc[programId].total++;
    if (sub.status === 'pending') acc[programId].pending++;
    if (sub.status === 'approved') acc[programId].approved++;
    if (sub.status === 'rejected') acc[programId].rejected++;
    return acc;
  }, {} as Record<string, any>);

  const programGroups = Object.values(submissionsByProgram);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-300 rounded w-1/4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadSubmissions}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If a program is selected, show the detailed submissions view
  if (selectedProgramId) {
    return (
      <ProgramSubmissions
        programId={selectedProgramId}
        programTitle={selectedProgramTitle}
        onClose={() => {
          setSelectedProgramId(null);
          setSelectedProgramTitle('');
          loadSubmissions(); // Refresh after closing
        }}
      />
    );
  }

  const niCounts = {
    all: networkIssues.length,
    open: networkIssues.filter(i => getNetworkIssueUiStatus(i.network_issue_status) === 'open').length,
    in_progress: networkIssues.filter(i => getNetworkIssueUiStatus(i.network_issue_status) === 'in_progress').length,
    resolved: networkIssues.filter(i => getNetworkIssueUiStatus(i.network_issue_status) === 'resolved').length,
  };

  const filteredNetworkIssues = networkIssues.filter(i => {
    if (networkIssueFilter === 'all') return true;
    return getNetworkIssueUiStatus(i.network_issue_status) === networkIssueFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl text-gray-900 mb-2">All Submissions</h1>
        <p className="text-gray-500">Monitor and review program submissions across the organization</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'all' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Programs
        </button>
        <button
          onClick={() => setActiveTab('network_issues')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'network_issues' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wifi className="w-4 h-4" />
          Network Issues
          {niCounts.open > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{niCounts.open}</span>
          )}
        </button>
      </div>

      {/* Network Issues Tab */}
      {activeTab === 'network_issues' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{niCounts.open}</p>
              <p className="text-xs text-red-600">Open</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{niCounts.in_progress}</p>
              <p className="text-xs text-amber-600">In Progress</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{niCounts.resolved}</p>
              <p className="text-xs text-green-600">Resolved</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setNetworkIssueFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  networkIssueFilter === f ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)} ({niCounts[f]})
              </button>
            ))}
          </div>

          {networkIssuesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredNetworkIssues.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Wifi className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No network issues found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNetworkIssues.map(issue => {
                const siteVal = issue.responses?.site_name;
                const siteName = siteVal ? (typeof siteVal === 'object' ? siteVal.display || siteVal.value : String(siteVal)) : null;
                const feedbackKey = Object.keys(issue.responses || {}).find(k => k.includes('feedback'));
                const feedback = feedbackKey ? String(issue.responses[feedbackKey]) : null;
                return (
                  <div key={issue.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-semibold text-cyan-700 uppercase">{issue.program_title}</p>
                        {siteName && <p className="text-sm font-bold text-gray-900">{siteName}</p>}
                      </div>
                      <NetworkIssueBadge status={issue.network_issue_status} />
                    </div>
                    {feedback && <p className="text-sm text-gray-600 line-clamp-2 mb-2">{feedback}</p>}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{issue.reporter_name}</span>
                      <span>·</span>
                      <span>{issue.reporter_zone}</span>
                      <span className="ml-auto">{new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* All Programs Tab */}
      {activeTab !== 'network_issues' && (
      <div className="space-y-6">

      {/* Filters & Search */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by program, user, zone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Card - Simplified (No Approval Workflow) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-gray-500 text-sm mb-1">Total Submissions</div>
          <div className="text-4xl text-gray-900 font-bold">{filteredSubmissions.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="text-green-700 text-sm mb-1">All Verified</div>
          <div className="text-4xl text-green-700 font-bold">✓</div>
          <p className="text-xs text-green-600 mt-2">Submissions are automatically verified upon upload</p>
        </div>
      </div>

      {/* Submissions Grouped by Program */}
      {programGroups.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-gray-400 text-xl mb-3">No submissions found</p>
          <p className="text-gray-400">
            {searchQuery ? 'Try a different search query' : 'Submissions will appear here once users start submitting'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {programGroups.map((group: any) => (
            <div
              key={group.program?.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                setSelectedProgramId(group.program?.id);
                setSelectedProgramTitle(group.program?.title || 'Program');
              }}
            >
              {/* Program Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl text-gray-900 mb-2">{group.program?.title || 'Untitled Program'}</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-red-600" />
                      <span className="text-gray-600">{group.program?.points_value || 0} points</span>
                    </div>
                    <div className="text-gray-400">•</div>
                    <div className="text-gray-600">{group.total} submissions</div>
                    <div className="text-gray-400">•</div>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>All Verified</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProgramId(group.program?.id);
                    setSelectedProgramTitle(group.program?.title || 'Program');
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View All
                </button>
              </div>

              {/* Status Breakdown */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm">
                  <Clock className="w-4 h-4" />
                  {group.pending} pending
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {group.approved} approved
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                  <XCircle className="w-4 h-4" />
                  {group.rejected} rejected
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      )}
    </div>
  );
}