import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { MapPin, Calendar, User, CheckCircle, XCircle, Eye, Download, ChevronDown, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Submission {
  id: string;
  program_id: string;
  user_id: string;
  responses: Record<string, any>;
  photos: Record<string, any>;
  gps_location: {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
  } | null;
  location?: any; // Backward compatibility for old code
  status: string;
  points_awarded: number;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    phone_number: string;
    region: string;
    zsm: string;
    zbm: string;
  };
}

interface ProgramSubmissionsProps {
  programId: string;
  programTitle: string;
  onClose: () => void;
}

export function ProgramSubmissions({ programId, programTitle, onClose }: ProgramSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [programFields, setProgramFields] = useState<any[]>([]);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; label: string } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [fullSubmission, setFullSubmission] = useState<Submission | null>(null);
  const PAGE_SIZE = 2; // Load 2 at a time to avoid timeout

  useEffect(() => {
    loadSubmissions();
  }, [programId]);

  // Auto-load more submissions when hasMore is true
  useEffect(() => {
    if (hasMore && !loading && !loadingMore) {
      // Ultra-fast loading - 100ms delay between batches
      const timer = setTimeout(() => {
        loadSubmissions(false);
      }, 100); // 100ms = 0.1 seconds for ultra-fast loading (20 submissions/second!)

      return () => clearTimeout(timer);
    }
  }, [hasMore, loading, loadingMore, offset]);

  // ⚡ LAZY LOAD PHOTOS: Only load photos when viewing detail modal
  useEffect(() => {
    if (!selectedSubmission) {
      setFullSubmission(null);
      return;
    }

    // If photos are already loaded in selectedSubmission, use them
    if (selectedSubmission.photos && Object.keys(selectedSubmission.photos).length > 0) {
      setFullSubmission(selectedSubmission);
      return;
    }

    // Otherwise, fetch photos
    const loadPhotos = async () => {
      setLoadingPhotos(true);
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('photos')
          .eq('id', selectedSubmission.id)
          .single();

        if (!error && data) {
          setFullSubmission({ ...selectedSubmission, photos: data.photos || {} });
        } else {
          setFullSubmission(selectedSubmission);
        }
      } catch (err) {
        console.error('[ProgramSubmissions] Error loading photos:', err);
        setFullSubmission(selectedSubmission);
      } finally {
        setLoadingPhotos(false);
      }
    };

    loadPhotos();
  }, [selectedSubmission]);

  const loadSubmissions = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setSubmissions([]);
      } else {
        setLoadingMore(true);
      }
      
      // TAI uses localStorage authentication, not Supabase Auth
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
        throw new Error('Not authenticated');
      }

      const userData = JSON.parse(storedUser);
      console.log('[ProgramSubmissions] Loading submissions for program:', programId);

      // Load program details to get field labels from the program_fields table (only on initial load)
      if (reset) {
        const { data: programFieldsData, error: programError } = await supabase
          .from('program_fields')
          .select('*')
          .eq('program_id', programId);

        if (programError) {
          console.error('[ProgramSubmissions] Error loading program fields:', programError);
        } else {
          setProgramFields(programFieldsData || []);
          console.log('[ProgramSubmissions] ✅ Loaded program fields:', programFieldsData?.length || 0);
        }
      }

      // 🚀 PAGINATION: Load only 2 submissions at a time to avoid timeout
      const currentOffset = reset ? 0 : offset;
      console.log(`[ProgramSubmissions] Loading ${PAGE_SIZE} submissions (offset: ${currentOffset})...`);
      
      // ⚡ EGRESS OPTIMIZATION: Select ONLY the fields we need (exclude photos initially)
      const { data: submissionsData, error: dbError } = await supabase
        .from('submissions')
        .select('id, program_id, user_id, responses, gps_location, status, points_awarded, created_at, updated_at')
        // ⚠️ REMOVED: agent_id (column doesn't exist), photos (egress optimization - load separately)
        .eq('program_id', programId)
        .order('created_at', { ascending: false }) // ⏰ Sort by latest submission first
        .range(currentOffset, currentOffset + PAGE_SIZE - 1); // Load 2 at a time

      if (dbError) {
        console.error('[ProgramSubmissions] Database error:', dbError);
        setError(`Database timeout error. Loading 2 submissions at a time to avoid this issue.`);
        setSubmissions([]);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      console.log('[ProgramSubmissions] ✅ Loaded', submissionsData?.length || 0, 'submissions');
      
      // Check if there are more submissions to load
      const hasMoreData = submissionsData && submissionsData.length === PAGE_SIZE;
      setHasMore(hasMoreData);
      
      if (!submissionsData || submissionsData.length === 0) {
        if (reset) {
          setSubmissions([]);
        }
        setHasMore(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(submissionsData.map(s => s.user_id))];
      
      // Load users separately
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, full_name, employee_id, phone_number, role, zone, region, zsm, zbm')
        .in('id', userIds);

      if (usersError) {
        console.error('[ProgramSubmissions] Error loading users:', usersError);
      }

      // Create user lookup map
      const userMap = new Map(usersData?.map(u => [u.id, u]) || []);
      
      // Transform data to match expected format
      const transformedData = submissionsData.map(sub => ({
        ...sub,
        user: userMap.get(sub.user_id),
      }));
      
      // Append to existing submissions or replace
      if (reset) {
        setSubmissions(transformedData);
      } else {
        setSubmissions(prev => [...prev, ...transformedData]);
      }
      
      // Update offset for next page
      setOffset(currentOffset + PAGE_SIZE);
      
    } catch (err: any) {
      console.error('[Programs] Error loading submissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    if (!confirm('Approve this submission?')) return;

    try {
      console.log('[ProgramSubmissions] Approving submission:', submissionId);
      
      // Get the submission to award points
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) throw new Error('Submission not found');

      // Update submission status directly in database
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('[ProgramSubmissions] Error updating submission:', updateError);
        throw new Error(updateError.message);
      }

      // Get current user points
      const { data: userData, error: getUserError } = await supabase
        .from('app_users')
        .select('total_points')
        .eq('id', submission.user_id)
        .single();

      if (getUserError) {
        console.error('[ProgramSubmissions] Error getting user points:', getUserError);
        // Don't throw - submission is already approved
      } else {
        // Update user points with new total
        const currentPoints = userData?.total_points || 0;
        const newPoints = currentPoints + submission.points_awarded;
        
        const { error: pointsError } = await supabase
          .from('app_users')
          .update({ 
            total_points: newPoints
          })
          .eq('id', submission.user_id);

        if (pointsError) {
          console.error('[ProgramSubmissions] Error updating points:', pointsError);
          // Don't throw - submission is already approved
        }
      }

      console.log('[ProgramSubmissions] ✅ Submission approved');
      alert('Submission approved!');
      loadSubmissions();
      setSelectedSubmission(null);
    } catch (err: any) {
      console.error('[Programs] Error approving submission:', err);
      alert(err.message);
    }
  };

  const handleReject = async (submissionId: string) => {
    if (!confirm('Reject this submission?')) return;

    try {
      console.log('[ProgramSubmissions] Rejecting submission:', submissionId);

      // Update submission status directly in database
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('[ProgramSubmissions] Error updating submission:', updateError);
        throw new Error(updateError.message);
      }

      console.log('[ProgramSubmissions] ✅ Submission rejected');
      alert('Submission rejected.');
      loadSubmissions();
      setSelectedSubmission(null);
    } catch (err: any) {
      console.error('[Programs] Error rejecting submission:', err);
      alert(err.message);
    }
  };

  const handleDeleteSubmission = async (submissionId: string, submitterName: string) => {
    if (!confirm(`Delete submission from ${submitterName}? This action cannot be undone and will permanently remove this submission.`)) {
      return;
    }

    try {
      console.log('[ProgramSubmissions] Deleting submission:', submissionId);

      // Delete submission directly from database
      const { error: deleteError } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);

      if (deleteError) {
        console.error('[ProgramSubmissions] Error deleting submission:', deleteError);
        throw new Error(deleteError.message);
      }

      console.log('[ProgramSubmissions] ✅ Submission deleted successfully');
      alert('Submission deleted successfully!');
      
      // Close detail modal if open
      setSelectedSubmission(null);
      
      // Reload submissions
      loadSubmissions();
    } catch (err: any) {
      console.error('[ProgramSubmissions] Error deleting submission:', err);
      alert(err.message || 'Failed to delete submission');
    }
  };

  const exportToCSV = () => {
    const headers = ['SE Name', 'Phone', 'Region', 'ZSM', 'ZBM', 'Submitted At', 'Points', 'GPS Lat', 'GPS Lng', 'Type', 'Sites Count', 'Promoters Count', 'Total GAs'];
    const rows = submissions.map(sub => {
      const isSession = sub.responses?._session_type === 'session_checkin';
      return [
        sub.user?.full_name || 'Unknown',
        sub.user?.phone_number || '',
        sub.user?.region || '',
        sub.user?.zsm || '',
        sub.user?.zbm || '',
        new Date(sub.created_at).toLocaleString(),
        sub.points_awarded,
        sub.gps_location?.lat || '',
        sub.gps_location?.lng || '',
        isSession ? 'Session Check-In' : 'Standard',
        isSession ? sub.responses?.sites_count || 0 : '',
        isSession ? sub.responses?.promoters_count || 0 : '',
        isSession ? sub.responses?.total_gas || 0 : '',
        ...Object.entries(sub.responses || {}).filter(([k]) => !k.startsWith('_') && !['sites', 'promoters', 'total_gas', 'sites_count', 'promoters_count'].includes(k)).map(([, v]) => typeof v === 'object' ? JSON.stringify(v) : v),
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${programTitle}_submissions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const headers = ['SE Name', 'Phone', 'Region', 'ZSM', 'ZBM', 'Submitted At', 'Points', 'GPS Lat', 'GPS Lng'];
    const rows = submissions.map(sub => [
      sub.user?.full_name || 'Unknown',
      sub.user?.phone_number || '',
      sub.user?.region || '',
      sub.user?.zsm || '',
      sub.user?.zbm || '',
      new Date(sub.created_at).toLocaleString(),
      sub.points_awarded,
      sub.gps_location?.lat || '',
      sub.gps_location?.lng || '',
      ...Object.values(sub.responses),
    ]);

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
    XLSX.writeFile(workbook, `${programTitle}_submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const headers = ['SE Name', 'Phone', 'Region', 'ZSM', 'ZBM', 'Submitted At', 'Points', 'GPS Lat', 'GPS Lng'];
    const rows = submissions.map(sub => [
      sub.user?.full_name || 'Unknown',
      sub.user?.phone_number || '',
      sub.user?.region || '',
      sub.user?.zsm || '',
      sub.user?.zbm || '',
      new Date(sub.created_at).toLocaleString(),
      sub.points_awarded,
      sub.gps_location?.lat || '',
      sub.gps_location?.lng || '',
      ...Object.values(sub.responses),
    ]);

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 20,
      theme: 'grid',
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 10 },
    });

    doc.save(`${programTitle}_submissions_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📊 {programTitle}</h2>
              <p className="text-sm text-gray-600 mt-1">Submissions Dashboard</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Total Count */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5 mb-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-700">{submissions.length}</div>
              <div className="text-sm font-semibold text-blue-600 mt-1">Total Submissions</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                disabled={submissions.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4" />
              </button>
              {showExportDropdown && submissions.length > 0 && (
                <div className="absolute left-0 mt-2 w-48 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50">
                  <button
                    onClick={() => {
                      exportToCSV();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-t-lg font-medium flex items-center gap-3"
                  >
                    <span className="text-lg">📄</span>
                    <div>
                      <div className="font-semibold">CSV</div>
                      <div className="text-xs text-gray-500">Comma-separated values</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      exportToExcel();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors font-medium flex items-center gap-3"
                  >
                    <span className="text-lg">📊</span>
                    <div>
                      <div className="font-semibold">Excel (XLSX)</div>
                      <div className="text-xs text-gray-500">Microsoft Excel format</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      exportToPDF();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-b-lg font-medium flex items-center gap-3"
                  >
                    <span className="text-lg">📕</span>
                    <div>
                      <div className="font-semibold">PDF</div>
                      <div className="text-xs text-gray-500">Portable Document Format</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No submissions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map(submission => (
                <div
                  key={submission.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-gray-600" />
                        <span className="font-bold text-gray-900">
                          {submission.user?.full_name || 'Unknown'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                        <div>📞 {submission.user?.phone_number}</div>
                        <div>📍 {submission.user?.region}</div>
                        <div>👔 ZSM: {submission.user?.zsm}</div>
                        <div>🏢 ZBM: {submission.user?.zbm}</div>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(submission.created_at).toLocaleString()}
                        </div>
                        {submission.gps_location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            GPS: {submission.gps_location.lat.toFixed(4)}, {submission.gps_location.lng.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* Session Check-In Badge */}
                      {submission.responses?._session_type === 'session_checkin' && (
                        <div className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                          📋 Session
                          <span className="ml-1">
                            {submission.responses?.sites_count || 0} sites · {submission.responses?.promoters_count || 0} promoters · {submission.responses?.total_gas || 0} GAs
                          </span>
                        </div>
                      )}
                      {/* Only show points for non-Director roles */}
                      {submission.user?.role !== 'director' && (
                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-bold">
                          {submission.points_awarded} pts
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(submission);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubmission(submission.id, submission.user?.full_name || 'Unknown');
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Auto-Loading Indicator */}
          {loadingMore && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 bg-blue-50 border-2 border-blue-200 rounded-lg px-6 py-4 shadow-md">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Loading more submissions...</p>
                  <p className="text-xs text-blue-600 mt-1">📊 Loaded {submissions.length} so far • Auto-loading 2 at a time</p>
                </div>
              </div>
            </div>
          )}
          {/* All Loaded */}
          {!hasMore && !loadingMore && submissions.length > 0 && (
            <div className="mt-6 text-center">
              <div className="inline-block bg-green-100 border-2 border-green-300 rounded-lg px-6 py-3 shadow-md">
                <p className="text-sm font-semibold text-green-800">✅ All submissions loaded ({submissions.length} total)</p>
                <p className="text-xs text-green-600 mt-1">Database query complete</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && fullSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Submission Details</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* DEBUG: Log submission data */}
            {console.log('[ProgramSubmissions] Selected submission:', fullSubmission)}
            {console.log('[ProgramSubmissions] GPS Location field:', fullSubmission?.gps_location)}
            {console.log('[ProgramSubmissions] Responses data:', fullSubmission?.responses)}
            
            {/* Extract GPS from responses if location field is empty */}
            {(() => {
              // Try to get GPS from multiple sources
              let gpsData = fullSubmission?.gps_location || fullSubmission?.location;
              
              console.log('[ProgramSubmissions] GPS Data from gps_location field:', gpsData);
              
              // If location is null, check if GPS is embedded in responses
              if (!gpsData && fullSubmission?.responses) {
                const lat = fullSubmission.responses._gps_latitude || 
                           fullSubmission.responses._latitude ||
                           fullSubmission.responses.latitude ||
                           fullSubmission.responses.gps_latitude;
                           
                const lng = fullSubmission.responses._gps_longitude ||
                           fullSubmission.responses._longitude ||
                           fullSubmission.responses.longitude ||
                           fullSubmission.responses.gps_longitude;
                           
                const accuracy = fullSubmission.responses._gps_accuracy ||
                                fullSubmission.responses._accuracy ||
                                fullSubmission.responses.accuracy ||
                                fullSubmission.responses.gps_accuracy ||
                                10; // default accuracy
                
                if (lat && lng) {
                  gpsData = { lat, lng, accuracy, timestamp: '' };
                  console.log('[ProgramSubmissions] ✅ Extracted GPS from responses:', gpsData);
                }
              }
              
              console.log('[ProgramSubmissions] Final GPS Data:', gpsData);
              
              return gpsData ? (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">📍 GPS Location</h4>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-300 shadow-md space-y-3">
                    {/* Coordinates - Clickable */}
                    <a
                      href={`https://www.google.com/maps?q=${gpsData.lat},${gpsData.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-white/50 rounded-lg p-3 transition-all group cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 mb-1">Tap to view on Google Maps</div>
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-gray-600">Latitude:</span>
                              <span className="ml-2 font-mono font-semibold text-blue-900">{Number(gpsData.lat).toFixed(6)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Longitude:</span>
                              <span className="ml-2 font-mono font-semibold text-blue-900">{Number(gpsData.lng).toFixed(6)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Accuracy:</span>
                              <span className="ml-2 font-semibold text-green-700">±{Number(gpsData.accuracy).toFixed(0)}m</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-blue-600 font-semibold group-hover:gap-2 transition-all">
                            <span>Open in Google Maps</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </a>
                    
                    {/* Quick Copy Coordinates */}
                    <button
                      onClick={() => {
                        const coords = `${gpsData.lat},${gpsData.lng}`;
                        navigator.clipboard.writeText(coords);
                        alert('Coordinates copied to clipboard!');
                      }}
                      className="w-full text-center text-xs text-gray-600 hover:text-gray-900 py-2 hover:bg-white/50 rounded transition-all"
                    >
                      📋 Copy coordinates: {Number(gpsData.lat).toFixed(6)}, {Number(gpsData.lng).toFixed(6)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">📍 GPS Location</h4>
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">⚠️</div>
                      <div>
                        <div className="font-semibold text-yellow-800">GPS Location Not Available</div>
                        <div className="text-sm text-yellow-700 mt-1">This submission was made before GPS auto-capture was enabled.</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Responses */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">📝 Responses</h4>
              <div className="space-y-3">
                {Object.entries(fullSubmission?.responses || {}).map(([key, value]) => {
                  console.log('[ProgramSubmissions] Response key:', key, 'Available fields:', programFields.map(f => f.id));
                  
                  // Find the field label from program fields by UUID
                  const field = programFields.find(f => f.id === key);
                  
                  console.log('[ProgramSubmissions] Found field for', key, ':', field);
                  
                  // Use field label if found, otherwise format the key nicely
                  let label = key; // Default to showing the key
                  if (field) {
                    label = field.label || field.field_name || key;
                  } else if (key.startsWith('_')) {
                    // Format metadata keys nicely (e.g., _shop_name → Shop Name)
                    label = key
                      .substring(1) // Remove underscore
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                  }
                  
                  // Skip GPS and timestamp metadata (already shown above)
                  if (key.startsWith('_gps') || key.startsWith('_timestamp') || key === 'metadata' || key.startsWith('_submission_')) {
                    return null;
                  }
                  
                  // Skip shop detail keys that end with _shop_code, _fp_code, etc. (we'll display them separately)
                  if (key.endsWith('_shop_code') || key.endsWith('_fp_code') || key.endsWith('_usdm_name') || key.endsWith('_partner_name')) {
                    return null;
                  }
                  
                  // Skip empty values
                  if (!value || (typeof value === 'string' && value.trim() === '')) {
                    return null;
                  }
                  
                  // Check if this field has associated shop details
                  const shopCode = fullSubmission?.responses[`${key}_shop_code`];
                  const fpCode = fullSubmission?.responses[`${key}_fp_code`];
                  const usdmName = fullSubmission?.responses[`${key}_usdm_name`];
                  const partnerName = fullSubmission?.responses[`${key}_partner_name`];
                  
                  return (
                    <div key={key}>
                      <div className="border-b border-gray-200 pb-2">
                        <div className="text-sm text-gray-600 font-semibold">{label}</div>
                        <div className="text-gray-900">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      </div>
                      
                      {/* Show shop details if available */}
                      {(shopCode || fpCode || usdmName || partnerName) && (
                        <div className="mt-2 mb-3 bg-green-50 border-2 border-green-300 rounded-lg p-3">
                          <div className="text-xs font-semibold text-green-900 mb-2">✅ Shop Details</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {partnerName && (
                              <div>
                                <span className="text-gray-600">Partner Name:</span>
                                <div className="font-semibold text-gray-900">{partnerName}</div>
                              </div>
                            )}
                            {shopCode && (
                              <div>
                                <span className="text-gray-600">Shop Code:</span>
                                <div className="font-semibold text-gray-900">{shopCode}</div>
                              </div>
                            )}
                            {fpCode && (
                              <div>
                                <span className="text-gray-600">FP Code:</span>
                                <div className="font-semibold text-gray-900">{fpCode}</div>
                              </div>
                            )}
                            {usdmName && (
                              <div>
                                <span className="text-gray-600">USDM Name:</span>
                                <div className="font-semibold text-gray-900">{usdmName}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Photos */}
            {fullSubmission?.photos && Object.keys(fullSubmission.photos).length > 0 && (() => {
              console.log('[ProgramSubmissions] Photo data structure:', fullSubmission.photos);
              return (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">📷 Photos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(fullSubmission.photos).map(([key, photoData]: [string, any]) => {
                      console.log('[ProgramSubmissions] Processing photo:', key, photoData);
                      
                      // Find the field label for this photo field (try to match by UUID or field name)
                      const field = programFields.find(f => 
                        f.id === key || 
                        f.field_name === key ||
                        f.label?.toLowerCase() === key.toLowerCase()
                      );
                      
                      // Format label nicely
                      let label = key;
                      if (field) {
                        label = field.label || field.field_name || key;
                      } else if (key.startsWith('_')) {
                        // Format metadata keys nicely (e.g., _photo → Photo)
                        label = key
                          .substring(1)
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                      } else {
                        // UUID or other key - just capitalize
                        label = 'Photo Field';
                      }
                      
                      // Handle different photo data structures
                      let photoUrl = '';
                      if (typeof photoData === 'string') {
                        photoUrl = photoData; // Direct URL string
                      } else if (photoData?.url) {
                        photoUrl = photoData.url; // Object with url property
                      } else if (photoData?.uri) {
                        photoUrl = photoData.uri; // Object with uri property
                      } else if (photoData?.path) {
                        photoUrl = photoData.path; // Object with path property
                      }
                      
                      console.log('[ProgramSubmissions] Photo URL extracted:', photoUrl);
                      
                      return (
                        <div key={key} className="space-y-2">
                          <div className="text-sm font-semibold text-gray-700">{label}</div>
                          {photoUrl ? (
                            <>
                              <img
                                src={photoUrl}
                                alt={label}
                                className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => setZoomedPhoto({ url: photoUrl, label })}
                                onError={(e) => {
                                  console.error('[ProgramSubmissions] Image load error for:', key, photoUrl);
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage Error%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              {photoData?.gps && (
                                <div className="text-xs text-gray-600">
                                  📍 {photoData.gps.lat?.toFixed(6)}, {photoData.gps.lng?.toFixed(6)}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                              <div className="text-center p-4">
                                <div className="text-4xl mb-2">📷</div>
                                <div className="text-sm font-semibold">Photo data unavailable</div>
                                <div className="text-xs mt-1 text-gray-400 font-mono max-w-xs overflow-hidden text-ellipsis">
                                  {JSON.stringify(photoData).substring(0, 80)}...
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* No photos message if photos object is empty or undefined */}
            {(!fullSubmission?.photos || Object.keys(fullSubmission.photos || {}).length === 0) && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3">📷 Photos</h4>
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <div className="text-sm font-semibold text-gray-700">No photos attached</div>
                  <div className="text-xs text-gray-500 mt-1">This submission doesn't have any photos</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDeleteSubmission(selectedSubmission.id, selectedSubmission.user?.full_name || 'Unknown');
                }}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Photo Modal */}
      {zoomedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Photo: {zoomedPhoto.label}</h3>
              <button
                onClick={() => setZoomedPhoto(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="flex justify-center">
              <img
                src={zoomedPhoto.url}
                alt={zoomedPhoto.label}
                className="w-full h-auto object-contain rounded-lg border border-gray-200"
                onError={(e) => {
                  console.error('[ProgramSubmissions] Image load error for:', zoomedPhoto.label, zoomedPhoto.url);
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage Error%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}