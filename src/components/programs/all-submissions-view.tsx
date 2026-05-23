import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { Calendar, User, Award, Filter, Search, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
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

export function AllSubmissionsView() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedProgramTitle, setSelectedProgramTitle] = useState<string>('');

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter]);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl text-gray-900 mb-2">All Submissions</h1>
        <p className="text-gray-500">Monitor and review program submissions across the organization</p>
      </div>

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
  );
}