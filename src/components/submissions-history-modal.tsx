import { useState, useEffect } from 'react';
import { X, Calendar, Star, MapPin, Eye } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase/client';

interface Submission {
  id: string;
  program_id: string;
  user_id: string;
  responses: Record<string, any>;
  photos: any[];
  gps_location: { lat: number; lng: number } | null;
  status: string;
  points_awarded: number;
  created_at: string;
  program: {
    title: string;
    icon: string;
    color: string;
  };
}

interface SubmissionsHistoryModalProps {
  userId: string;
  userName: string;
  totalPoints: number;
  onClose: () => void;
}

export function SubmissionsHistoryModal({ userId, userName, totalPoints, onClose }: SubmissionsHistoryModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [userId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      console.log('[SubmissionsHistory] Loading submissions for user:', userId);

      // Load submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('[SubmissionsHistory] Error loading submissions:', submissionsError);
        throw new Error(submissionsError.message);
      }

      console.log('[SubmissionsHistory] ✅ Loaded', submissionsData?.length || 0, 'submissions');

      if (!submissionsData || submissionsData.length === 0) {
        setSubmissions([]);
        return;
      }

      // Get unique program IDs
      const programIds = [...new Set(submissionsData.map(s => s.program_id))];

      // Load programs
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, title, icon, color')
        .in('id', programIds);

      if (programsError) {
        console.error('[SubmissionsHistory] Error loading programs:', programsError);
      }

      // Create program lookup map
      const programMap = new Map(programsData?.map(p => [p.id, p]) || []);

      // Transform data to include program details
      const transformedData = submissionsData.map(sub => ({
        ...sub,
        program: programMap.get(sub.program_id) || {
          title: 'Unknown Program',
          icon: '📋',
          color: 'gray',
        },
      }));

      setSubmissions(transformedData);
    } catch (err: any) {
      console.error('[SubmissionsHistory] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalPoints = () => {
    return submissions.reduce((total, sub) => total + (sub.points_awarded || 0), 0);
  };

  const getColorClasses = (color: string) => {
    const colorMap: any = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      pink: 'bg-pink-50 border-pink-200 text-pink-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      red: 'bg-red-50 border-red-200 text-red-700',
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">⭐ Points History</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="text-sm opacity-90 mb-1">Total Points Earned</div>
            <div className="text-4xl font-bold">{totalPoints} pts</div>
            <div className="text-sm opacity-90 mt-1">{submissions.length} submissions</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-xl p-4 h-20 animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 text-lg mb-2">⚠️ Error</div>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-xl font-semibold text-gray-800 mb-2">No Submissions Yet</div>
              <p className="text-gray-600">Start completing programs to earn points!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map(submission => (
                <div
                  key={submission.id}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-start gap-4">
                    {/* Program Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 ${getColorClasses(submission.program.color)}`}>
                      {submission.program.icon}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-1">
                        {submission.program.title}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(submission.created_at).toLocaleDateString()}
                        </div>
                        {submission.gps_location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            GPS Captured
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                          submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {submission.status === 'approved' ? '✅ Approved' :
                           submission.status === 'rejected' ? '❌ Rejected' :
                           '📥 Submitted'}
                        </span>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl px-4 py-2">
                        <div className="text-2xl font-bold text-yellow-700">
                          +{submission.points_awarded}
                        </div>
                        <div className="text-xs text-yellow-600">points</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubmission(submission);
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Submission Details</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Program Info */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 ${getColorClasses(selectedSubmission.program.color)}`}>
                  {selectedSubmission.program.icon}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{selectedSubmission.program.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(selectedSubmission.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-700">
                  +{selectedSubmission.points_awarded} pts
                </div>
                <div className="text-sm text-yellow-600 mt-1">Points Awarded</div>
              </div>
            </div>

            {/* GPS Location */}
            {selectedSubmission.gps_location && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3">📍 GPS Location</h4>
                <a
                  href={`https://www.google.com/maps?q=${selectedSubmission.gps_location.lat},${selectedSubmission.gps_location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-blue-50 border-2 border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                >
                  <div className="text-sm font-mono text-blue-900">
                    {selectedSubmission.gps_location.lat.toFixed(6)}, {selectedSubmission.gps_location.lng.toFixed(6)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Tap to view on Google Maps →</div>
                </a>
              </div>
            )}

            {/* Responses */}
            {Object.keys(selectedSubmission.responses).length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3">📝 Responses</h4>
                <div className="space-y-2">
                  {Object.entries(selectedSubmission.responses)
                    .filter(([key]) => !key.startsWith('_'))
                    .map(([key, value]) => (
                      <div key={key} className="border-b border-gray-200 pb-2">
                        <div className="text-sm text-gray-600">{key}</div>
                        <div className="text-gray-900">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {selectedSubmission.photos && selectedSubmission.photos.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3">📷 Photos</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedSubmission.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                selectedSubmission.status === 'approved' ? 'bg-green-100 text-green-800' :
                selectedSubmission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {selectedSubmission.status === 'approved' ? '✅ Approved' :
                 selectedSubmission.status === 'rejected' ? '❌ Rejected' :
                 '📥 Submitted'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
