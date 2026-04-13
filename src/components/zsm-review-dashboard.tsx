import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Filter, AlertCircle, MapPin, Clock, User } from 'lucide-react';
import { Toast } from './toast';

interface Submission {
  id: number;
  agent_id: string;
  agent_name: string;
  agent_employee_id: string;
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
  reviewed_at?: string;
  points_earned: number;
}

interface ZSMReviewDashboardProps {
  zsmName: string;
  zsmZone: string;
}

export function ZSMReviewDashboard({ zsmName, zsmZone }: ZSMReviewDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      // TODO: Load from Supabase where zsm_zone = zsmZone
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - submissions from Field Agents in this zone
      setSubmissions([
        {
          id: 1,
          agent_id: 'FA001',
          agent_name: 'John Kamau',
          agent_employee_id: 'EMP45',
          program_id: 1,
          program_name: 'Network Experience',
          program_icon: '📶',
          photo_url: 'https://images.unsplash.com/photo-1516043669149-ab3f0e8f2a64?w=600&h=600&fit=crop',
          notes: 'Poor network coverage at Westlands Shopping Mall. Multiple customer complaints about dropped calls and slow data speeds. Competitors seem to have better coverage in this area.',
          latitude: -1.2641,
          longitude: 36.8107,
          captured_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
          status: 'pending',
          points_earned: 0,
        },
        {
          id: 2,
          agent_id: 'FA002',
          agent_name: 'Mary Njeri',
          agent_employee_id: 'EMP67',
          program_id: 2,
          program_name: 'Competition Conversion',
          program_icon: '🎯',
          photo_url: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&h=600&fit=crop',
          notes: 'Successfully converted Safaricom customer to Airtel Money. Customer was attracted by our lower transaction fees and better customer service. Signed up for 4G plan as well.',
          latitude: -1.2921,
          longitude: 36.8219,
          captured_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          status: 'pending',
          points_earned: 0,
        },
        {
          id: 3,
          agent_id: 'FA003',
          agent_name: 'David Omondi',
          agent_employee_id: 'EMP89',
          program_id: 1,
          program_name: 'Network Experience',
          program_icon: '📶',
          photo_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=600&fit=crop',
          notes: 'Excellent 4G coverage in CBD area near I&M Tower. Speed test shows 45 Mbps download and 20 Mbps upload. Customers very satisfied with service quality.',
          latitude: -1.2864,
          longitude: 36.8172,
          captured_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          status: 'pending',
          points_earned: 0,
        },
        {
          id: 4,
          agent_id: 'FA004',
          agent_name: 'Grace Wanjiku',
          agent_employee_id: 'EMP23',
          program_id: 3,
          program_name: 'New Site Launch',
          program_icon: '🚀',
          photo_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=600&fit=crop',
          notes: 'New site launched at Karen. Coverage is excellent, customers already reporting faster speeds. Great opportunity to convert competitor customers in the area.',
          latitude: -1.3032,
          longitude: 36.7073,
          captured_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          status: 'approved',
          reviewed_by: zsmName,
          review_notes: 'Excellent intel! Escalated to network team for celebration. Keep up the great work!',
          reviewed_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          points_earned: 10,
        },
        {
          id: 5,
          agent_id: 'FA005',
          agent_name: 'Peter Mwangi',
          agent_employee_id: 'EMP56',
          program_id: 4,
          program_name: 'AMB Visitation',
          program_icon: '🏢',
          photo_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&h=600&fit=crop',
          notes: 'Photo is too blurry to identify the location. Cannot verify if this is actually an AMB location.',
          latitude: -1.2921,
          longitude: 36.8219,
          captured_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
          status: 'rejected',
          reviewed_by: zsmName,
          review_notes: 'Photo quality is too low. Please retake with better lighting and ensure the AMB signage is clearly visible. No points awarded.',
          reviewed_at: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
          points_earned: 0,
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setLoading(false);
    }
  };

  const handleApprove = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const handleReject = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const handleQuickApprove = async (submission: Submission) => {
    try {
      // Update submission status
      setSubmissions(submissions.map(s => 
        s.id === submission.id 
          ? { 
              ...s, 
              status: 'approved',
              reviewed_by: zsmName,
              review_notes: 'Approved - Good intel!',
              reviewed_at: new Date().toISOString(),
              points_earned: 10,
            } 
          : s
      ));

      showToastMessage(`✅ Approved submission from ${submission.agent_name}`, 'success');
    } catch (error) {
      showToastMessage('Failed to approve submission', 'error');
    }
  };

  const handleQuickReject = async (submission: Submission) => {
    try {
      // Update submission status
      setSubmissions(submissions.map(s => 
        s.id === submission.id 
          ? { 
              ...s, 
              status: 'rejected',
              reviewed_by: zsmName,
              review_notes: 'Rejected - Please improve quality',
              reviewed_at: new Date().toISOString(),
              points_earned: 0,
            } 
          : s
      ));

      showToastMessage(`❌ Rejected submission from ${submission.agent_name}`, 'info');
    } catch (error) {
      showToastMessage('Failed to reject submission', 'error');
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="mb-4">
          <h2 className="text-2xl text-gray-900 mb-1">📋 Review Submissions</h2>
          <p className="text-sm text-gray-600">{zsmZone} · Zone Commander</p>
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
            <p className="text-xl font-semibold mb-1">{stats.total}</p>
            <p className="text-xs text-gray-600">All</p>
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`p-3 rounded-lg border-2 transition-all relative ${
              filter === 'pending'
                ? 'bg-yellow-50 border-yellow-500 scale-105'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xl font-semibold mb-1">{stats.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
            {stats.pending > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs animate-pulse-badge">
                {stats.pending}
              </div>
            )}
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'approved'
                ? 'bg-green-50 border-green-500 scale-105'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xl font-semibold mb-1">{stats.approved}</p>
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
            <p className="text-xl font-semibold mb-1">{stats.rejected}</p>
            <p className="text-xs text-gray-600">Rejected</p>
          </button>
        </div>
      </div>

      {/* Submissions Queue */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex items-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg mr-4"></div>
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
              {filter === 'pending' ? (
                <CheckCircle className="w-12 h-12 text-gray-400" strokeWidth={2} />
              ) : (
                <Filter className="w-12 h-12 text-gray-400" strokeWidth={2} />
              )}
            </div>
            <p className="text-gray-600 mb-2">
              {filter === 'pending' ? 'All caught up!' : `No ${filter} submissions`}
            </p>
            <p className="text-sm text-gray-500">
              {filter === 'pending' ? 'No pending submissions to review' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission, index) => (
              <div
                key={submission.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 overflow-hidden animate-slide-in-right"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start p-4">
                  {/* Photo Thumbnail */}
                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setShowReviewModal(true);
                    }}
                    className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden mr-4 flex-shrink-0 hover:scale-105 transition-transform"
                  >
                    <img 
                      src={submission.photo_url} 
                      alt="Submission" 
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Agent & Program Info */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-lg mr-2">{submission.program_icon}</span>
                          <p className="font-semibold text-gray-900">{submission.program_name}</p>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center">
                          <User className="w-3 h-3 mr-1" strokeWidth={2} />
                          {submission.agent_name} ({submission.agent_employee_id})
                        </p>
                      </div>
                    </div>

                    {/* Notes Preview */}
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                      {submission.notes}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" strokeWidth={2} />
                        <span>{formatTimestamp(submission.captured_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" strokeWidth={2} />
                        <span>GPS: {submission.latitude.toFixed(4)}, {submission.longitude.toFixed(4)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {submission.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleQuickApprove(submission)}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center active:scale-95"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" strokeWidth={2} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleQuickReject(submission)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center active:scale-95"
                        >
                          <XCircle className="w-4 h-4 mr-2" strokeWidth={2} />
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowReviewModal(true);
                          }}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm font-medium flex items-center justify-center active:scale-95"
                        >
                          <Eye className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    )}

                    {/* Status Badge (for reviewed submissions) */}
                    {submission.status !== 'pending' && (
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        submission.status === 'approved' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {submission.status === 'approved' ? (
                          <>
                            <CheckCircle className="w-3 h-3" strokeWidth={2} />
                            <span>Approved · +{submission.points_earned} pts</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" strokeWidth={2} />
                            <span>Rejected</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <ReviewModal
          submission={selectedSubmission}
          zsmName={zsmName}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedSubmission(null);
          }}
          onApprove={(reviewNotes) => {
            setSubmissions(submissions.map(s => 
              s.id === selectedSubmission.id 
                ? { 
                    ...s, 
                    status: 'approved',
                    reviewed_by: zsmName,
                    review_notes: reviewNotes,
                    reviewed_at: new Date().toISOString(),
                    points_earned: 10,
                  } 
                : s
            ));
            setShowReviewModal(false);
            setSelectedSubmission(null);
            showToastMessage(`✅ Approved submission from ${selectedSubmission.agent_name}`, 'success');
          }}
          onReject={(reviewNotes) => {
            setSubmissions(submissions.map(s => 
              s.id === selectedSubmission.id 
                ? { 
                    ...s, 
                    status: 'rejected',
                    reviewed_by: zsmName,
                    review_notes: reviewNotes,
                    reviewed_at: new Date().toISOString(),
                    points_earned: 0,
                  } 
                : s
            ));
            setShowReviewModal(false);
            setSelectedSubmission(null);
            showToastMessage(`❌ Rejected submission from ${selectedSubmission.agent_name}`, 'info');
          }}
        />
      )}

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

function ReviewModal({ 
  submission, 
  zsmName,
  onClose, 
  onApprove, 
  onReject 
}: { 
  submission: Submission; 
  zsmName: string;
  onClose: () => void; 
  onApprove: (reviewNotes: string) => void;
  onReject: (reviewNotes: string) => void;
}) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  const handleSubmitReview = () => {
    if (!reviewNotes.trim()) {
      alert('Please add review notes');
      return;
    }

    if (reviewAction === 'approve') {
      onApprove(reviewNotes);
    } else if (reviewAction === 'reject') {
      onReject(reviewNotes);
    }
  };

  const isPending = submission.status === 'pending';

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
              <p className="text-sm text-gray-500">By {submission.agent_name}</p>
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
            <img src={submission.photo_url} alt="Submission" className="w-full object-contain max-h-96" />
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {/* Agent Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" strokeWidth={2} />
                Field Agent Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{submission.agent_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Employee ID</p>
                  <p className="font-medium text-gray-900">{submission.agent_employee_id}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📝 Field Notes</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed">{submission.notes}</p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" strokeWidth={2} />
                  Location
                </h4>
                <p className="text-sm text-gray-600">
                  Lat: {submission.latitude.toFixed(6)}<br />
                  Long: {submission.longitude.toFixed(6)}
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
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Review Section */}
            {isPending ? (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">✍️ Add Review</h4>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add your review notes here... (e.g., 'Great intel! Escalated to network team.' or 'Photo quality too low, please retake.')"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {reviewNotes.length}/500 characters
                </p>
              </div>
            ) : (
              <div className={`p-4 rounded-xl border-2 ${
                submission.status === 'approved' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {submission.status === 'approved' ? '✅ Your Review (Approved)' : '❌ Your Review (Rejected)'}
                </h4>
                <p className="text-sm text-gray-700 mb-2">{submission.review_notes}</p>
                <p className="text-xs text-gray-600">
                  Reviewed by {submission.reviewed_by} · {new Date(submission.reviewed_at!).toLocaleString('en-KE', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {isPending ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setReviewAction('approve');
                    handleSubmitReview();
                  }}
                  disabled={!reviewNotes.trim()}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-colors font-medium flex items-center justify-center active:scale-95"
                >
                  <CheckCircle className="w-5 h-5 mr-2" strokeWidth={2} />
                  Approve (+10 Points)
                </button>
                <button
                  onClick={() => {
                    setReviewAction('reject');
                    handleSubmitReview();
                  }}
                  disabled={!reviewNotes.trim()}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl transition-colors font-medium flex items-center justify-center active:scale-95"
                >
                  <XCircle className="w-5 h-5 mr-2" strokeWidth={2} />
                  Reject (No Points)
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
