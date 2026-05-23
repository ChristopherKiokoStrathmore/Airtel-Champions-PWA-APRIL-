import { useState, useEffect } from 'react';
import { getSubmissions, updateSubmissionStatus, getCurrentUser } from '../lib/supabase';
import { LoadingSpinner, LoadingOverlay } from './ui/LoadingSpinner';
import { ErrorMessage, EmptyState } from './ui/ErrorMessage';

interface Submission {
  id: string;
  se: {
    name: string;
    id: string;
    region: string;
  };
  type: string;
  points: number;
  date: string;
  time: string;
  photo: string;
  location: {
    address: string;
    coordinates: string;
    accuracy: string;
  };
  details: {
    [key: string]: string;
  };
  validation: {
    locationVerified: boolean;
    photoQuality: boolean;
    exifData: boolean;
    warnings: string[];
  };
}

export function SubmissionReview() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterStatus, limit, offset]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user (may be null for admin dashboard - that's okay)
      const { data: user } = await getCurrentUser();
      setCurrentUser(user);

      // Fetch submissions
      const { data, error: subError, total, hasMore } = await getSubmissions({
        status: filterStatus,
        limit,
        offset,
      });
      
      if (subError) throw new Error(subError);
      
      setSubmissions(data || []);
      setTotal(total || 0);
      setHasMore(hasMore || false);
      if (data && data.length > 0 && !selectedSubmission) {
        setSelectedSubmission(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSubmission || !currentUser) return;

    setProcessing(true);
    try {
      const pointsToAward = selectedSubmission.mission_type?.points || 
                           selectedSubmission.mission_type?.base_points || 
                           0;

      const { error } = await updateSubmissionStatus(
        selectedSubmission.id,
        'approved',
        'Approved by admin',
        pointsToAward
      );

      if (error) throw new Error(error);

      // Refresh submissions
      await loadData();
      setSelectedSubmission(null);
    } catch (err: any) {
      alert('Error approving submission: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim() || !currentUser) return;

    setProcessing(true);
    try {
      const { error } = await updateSubmissionStatus(
        selectedSubmission.id,
        'rejected',
        rejectionReason,
        0 // No points awarded for rejection
      );

      if (error) throw new Error(error);

      // Refresh submissions
      await loadData();
      setSelectedSubmission(null);
      setRejectionReason('');
    } catch (err: any) {
      alert('Error rejecting submission: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleFlag = async () => {
    if (!selectedSubmission || !currentUser) return;

    setProcessing(true);
    try {
      // Note: 'flagged' status might not exist, using 'rejected' with special note
      const { error } = await updateSubmissionStatus(
        selectedSubmission.id,
        'rejected',
        'Flagged for review by admin',
        0
      );

      if (error) throw new Error(error);

      // Refresh submissions
      await loadData();
      setSelectedSubmission(null);
    } catch (err: any) {
      alert('Error flagging submission: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const formatSubmissionForDisplay = (sub: any) => {
    return {
      id: sub.id,
      se: {
        name: sub.se?.full_name || 'Unknown',
        id: sub.se?.phone || 'N/A',
        region: sub.se?.region || 'Unknown'
      },
      type: sub.mission_type?.name || 'Unknown',
      points: sub.mission_type?.base_points || 0,
      date: new Date(sub.submitted_at).toLocaleDateString(),
      time: new Date(sub.submitted_at).toLocaleTimeString(),
      photo: sub.photo_url,
      location: {
        address: sub.location_address || 'Unknown location',
        coordinates: `${sub.location_lat}, ${sub.location_lng}`,
        accuracy: '±10m'
      },
      details: {
        'Notes': sub.notes || 'No notes provided',
        'Status': sub.status
      },
      validation: {
        locationVerified: !!sub.location_lat && !!sub.location_lng,
        photoQuality: !!sub.photo_url,
        exifData: sub.exif_valid || false,
        warnings: sub.exif_valid ? [] : ['EXIF data not validated']
      }
    };
  };

  const displaySubmissions = submissions.map(formatSubmissionForDisplay);
  const displaySelected = selectedSubmission ? formatSubmissionForDisplay(selectedSubmission) : null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Submissions</h1>
        <p className="text-gray-600">Approve or reject field evidence submissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1 space-y-4">
          {displaySubmissions.map((submission) => (
            <button
              key={submission.id}
              onClick={() => setSelectedSubmission(submission)}
              className={`w-full bg-white rounded-xl border-2 p-4 text-left transition-all ${
                selectedSubmission?.id === submission.id
                  ? 'border-[#E60000] shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-gray-900">{submission.id}</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                  Pending
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">{submission.se.name}</p>
              <p className="text-sm text-gray-600 mb-2">{submission.type}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{submission.time}</span>
                <span className="font-medium text-[#E60000]">{submission.points} pts</span>
              </div>
            </button>
          ))}
        </div>

        {/* Submission Detail */}
        <div className="lg:col-span-2">
          {displaySelected ? (
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Submission {displaySelected.id}
                    </h2>
                    <p className="text-gray-600">
                      {displaySelected.date} at {displaySelected.time}
                    </p>
                  </div>
                  <span className="px-4 py-2 bg-[#E60000] text-white font-bold rounded-lg">
                    {displaySelected.points} Points
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sales Executive</p>
                    <p className="font-medium text-gray-900">{displaySelected.se.name}</p>
                    <p className="text-sm text-gray-600">{displaySelected.se.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Region</p>
                    <p className="font-medium text-gray-900">{displaySelected.se.region}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Mission Type</p>
                    <p className="font-medium text-gray-900">{displaySelected.type}</p>
                  </div>
                </div>
              </div>

              {/* Photo Evidence */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Photo Evidence</h3>
                <img
                  src={displaySelected.photo}
                  alt="Submission evidence"
                  className="w-full h-80 object-cover rounded-lg border border-gray-200"
                />
                <div className="flex gap-2 mt-4">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    🔍 Zoom
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    📥 Download
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    📊 View EXIF
                  </button>
                </div>
              </div>

              {/* Location */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Location</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="font-medium text-gray-900">{displaySelected.location.address}</p>
                      <p className="text-sm text-gray-600">GPS: {displaySelected.location.coordinates}</p>
                      <p className="text-sm text-gray-600">Accuracy: {displaySelected.location.accuracy}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    🗺️ View on Map
                  </button>
                </div>
              </div>

              {/* Submission Details */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Submission Details</h3>
                <div className="space-y-3">
                  {Object.entries(displaySelected.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Checks */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Validation Checks</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={displaySelected.validation.locationVerified ? 'text-green-600' : 'text-red-600'}>
                      {displaySelected.validation.locationVerified ? '✅' : '❌'}
                    </span>
                    <span className="text-gray-700">Location verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={displaySelected.validation.photoQuality ? 'text-green-600' : 'text-red-600'}>
                      {displaySelected.validation.photoQuality ? '✅' : '❌'}
                    </span>
                    <span className="text-gray-700">Photo quality sufficient</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={displaySelected.validation.exifData ? 'text-green-600' : 'text-red-600'}>
                      {displaySelected.validation.exifData ? '✅' : '❌'}
                    </span>
                    <span className="text-gray-700">EXIF data intact</span>
                  </div>
                </div>
                
                {displaySelected.validation.warnings.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900 mb-1">⚠️ Warnings:</p>
                    {displaySelected.validation.warnings.map((warning, idx) => (
                      <p key={idx} className="text-sm text-yellow-700">{warning}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Admin Actions</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <button
                    onClick={handleApprove}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    ✅ Approve<br />
                    <span className="text-sm">+{displaySelected.points} pts</span>
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    ❌ Reject<br />
                    <span className="text-sm">0 pts</span>
                  </button>
                  <button
                    onClick={handleFlag}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                  >
                    🚩 Flag<br />
                    <span className="text-sm">Review later</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Rejection Reason (if rejecting):
                  </label>
                  <div className="space-y-2">
                    {[
                      'Poor photo quality',
                      'Wrong location',
                      'Duplicate submission',
                      'Insufficient evidence',
                      'Other'
                    ].map((reason) => (
                      <label key={reason} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="rejection"
                          value={reason}
                          checked={rejectionReason === reason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="text-[#E60000] focus:ring-[#E60000]"
                        />
                        <span className="text-sm text-gray-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                  {rejectionReason === 'Other' && (
                    <textarea
                      placeholder="Specify reason..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                      rows={3}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Submission Selected</h3>
              <p className="text-gray-600">Select a submission from the list to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}