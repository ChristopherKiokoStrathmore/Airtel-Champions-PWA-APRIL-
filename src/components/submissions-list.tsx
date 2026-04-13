import { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';

interface Submission {
  id: number;
  program_id: number;
  program_name: string;
  program_icon: string;
  photo_url: string;
  notes: string;
  latitude: number;
  longitude: number;
  captured_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  review_notes?: string;
  points_earned: number;
}

interface SubmissionsListProps {
  onBack: () => void;
}

export function SubmissionsList({ onBack }: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      // TODO: Load from Supabase
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      setSubmissions([
        {
          id: 1,
          program_id: 1,
          program_name: 'Network Experience',
          program_icon: '📶',
          photo_url: 'https://images.unsplash.com/photo-1516043669149-ab3f0e8f2a64?w=400&h=400&fit=crop',
          notes: 'Poor network coverage at Westlands area. Multiple customer complaints about dropped calls.',
          latitude: -1.2641,
          longitude: 36.8107,
          captured_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'approved',
          reviewed_by: 'James Mwangi (ZSM)',
          review_notes: 'Great intel. Escalated to network team.',
          points_earned: 10,
        },
        {
          id: 2,
          program_id: 2,
          program_name: 'Competition Conversion',
          program_icon: '🎯',
          photo_url: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=400&h=400&fit=crop',
          notes: 'Successfully converted Safaricom customer to Airtel Money. Customer cited better rates and customer service.',
          latitude: -1.2921,
          longitude: 36.8219,
          captured_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          points_earned: 0,
        },
        {
          id: 3,
          program_id: 1,
          program_name: 'Network Experience',
          program_icon: '📶',
          photo_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=400&fit=crop',
          notes: 'Excellent 4G coverage in CBD area. Speed test shows 45 Mbps download.',
          latitude: -1.2864,
          longitude: 36.8172,
          captured_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'approved',
          reviewed_by: 'James Mwangi (ZSM)',
          review_notes: 'Good positive feedback!',
          points_earned: 10,
        },
        {
          id: 4,
          program_id: 3,
          program_name: 'New Site Launch',
          program_icon: '🚀',
          photo_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
          notes: 'Blurry photo, unclear what site this is.',
          latitude: -1.3032,
          longitude: 36.7073,
          captured_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          status: 'rejected',
          reviewed_by: 'James Mwangi (ZSM)',
          review_notes: 'Photo quality too low. Please retake with better lighting.',
          points_earned: 0,
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <AlertCircle className="w-4 h-4" strokeWidth={2} />,
          text: 'Under Review',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-4 h-4" strokeWidth={2} />,
          text: 'Approved',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-4 h-4" strokeWidth={2} />,
          text: 'Rejected',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" strokeWidth={2} />,
          text: 'Unknown',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    totalPoints: submissions.reduce((sum, s) => sum + s.points_earned, 0),
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3 hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl text-gray-900">My Submissions</h2>
              <p className="text-sm text-gray-500">{stats.total} total · {stats.totalPoints} points earned</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'all'
                ? 'bg-blue-50 border-blue-500 scale-105'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xl mb-1">{stats.total}</p>
            <p className="text-xs text-gray-600">All</p>
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'pending'
                ? 'bg-yellow-50 border-yellow-500 scale-105'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xl mb-1">{stats.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'approved'
                ? 'bg-green-50 border-green-500 scale-105'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xl mb-1">{stats.approved}</p>
            <p className="text-xs text-gray-600">Approved</p>
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'rejected'
                ? 'bg-red-50 border-red-500 scale-105'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xl mb-1">{stats.rejected}</p>
            <p className="text-xs text-gray-600">Rejected</p>
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex items-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-12 h-12 text-gray-400" strokeWidth={2} />
            </div>
            <p className="text-gray-600 mb-2">No {filter !== 'all' && filter} submissions</p>
            <p className="text-sm text-gray-500">
              {filter === 'all' ? 'Start capturing intelligence!' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission, index) => {
              const statusBadge = getStatusBadge(submission.status);

              return (
                <button
                  key={submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                  className="w-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 overflow-hidden animate-slide-in-right"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start p-4">
                    {/* Photo Thumbnail */}
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                      <img 
                        src={submission.photo_url} 
                        alt="Submission" 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                      {/* Program & Status */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">{submission.program_icon}</span>
                          <p className="font-semibold text-gray-900">{submission.program_name}</p>
                        </div>
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusBadge.bgColor} ${statusBadge.textColor} ${statusBadge.borderColor}`}
                        >
                          {statusBadge.icon}
                          <span>{statusBadge.text}</span>
                        </div>
                      </div>

                      {/* Notes Preview */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {submission.notes}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" strokeWidth={2} />
                          <span>{formatTimestamp(submission.captured_at)}</span>
                        </div>
                        {submission.status === 'approved' && (
                          <div className="flex items-center text-green-600 font-medium">
                            <span>+{submission.points_earned} pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}

function SubmissionDetailModal({ submission, onClose }: { submission: Submission; onClose: () => void }) {
  const statusBadge = (() => {
    switch (submission.status) {
      case 'pending':
        return { icon: <AlertCircle className="w-5 h-5" />, text: 'Under Review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
      case 'approved':
        return { icon: <CheckCircle className="w-5 h-5" />, text: 'Approved', color: 'bg-green-50 text-green-700 border-green-200' };
      case 'rejected':
        return { icon: <XCircle className="w-5 h-5" />, text: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' };
      default:
        return { icon: <AlertCircle className="w-5 h-5" />, text: 'Unknown', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up-bottom overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <span className="text-3xl mr-3">{submission.program_icon}</span>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{submission.program_name}</h3>
              <p className="text-sm text-gray-500">Submission #{submission.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Photo */}
          <div className="w-full bg-gray-900">
            <img src={submission.photo_url} alt="Submission" className="w-full object-contain max-h-80" />
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {/* Status */}
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 ${statusBadge.color}`}>
              {statusBadge.icon}
              <span className="font-semibold">{statusBadge.text}</span>
              {submission.status === 'approved' && (
                <span className="ml-auto font-bold">+{submission.points_earned} Points</span>
              )}
            </div>

            {/* Notes */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📝 Notes</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl">{submission.notes}</p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" strokeWidth={2} />
                  Location
                </h4>
                <p className="text-sm text-gray-600">
                  {submission.latitude.toFixed(6)}, {submission.longitude.toFixed(6)}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" strokeWidth={2} />
                  Captured
                </h4>
                <p className="text-sm text-gray-600">
                  {new Date(submission.captured_at).toLocaleString('en-KE', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Review Feedback */}
            {(submission.status === 'approved' || submission.status === 'rejected') && submission.review_notes && (
              <div className={`p-4 rounded-xl border-2 ${submission.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {submission.status === 'approved' ? '✅ ZSM Feedback' : '❌ Rejection Reason'}
                </h4>
                <p className="text-sm text-gray-700 mb-2">{submission.review_notes}</p>
                {submission.reviewed_by && (
                  <p className="text-xs text-gray-600">— {submission.reviewed_by}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
