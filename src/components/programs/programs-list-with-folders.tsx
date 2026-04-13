import { useState, useEffect } from 'react';
import { programsAPI, initializeSampleProgram } from '../../utils/supabase-direct';
import { ChevronRight, ChevronLeft, Folder, FolderOpen, Settings, BarChart3, Plus } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { ProgramSubmitModal } from './program-submit-modal';
import { SubmissionSuccessModal } from './submission-success-modal';
import { ProgramAnalyticsDashboard } from './program-analytics-dashboard';
import { FolderManagement } from './folder-management';
import { usePageTracking } from '../../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../../utils/analytics';

interface Program {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  points_value: number;
  status: string;
  target_roles: string[];
  category?: string;
  folder_id?: string;
}

interface ProgramFolder {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
}

interface ProgramSubmission {
  program_id: string;
  count: number;
}

export function ProgramsListWithFolders({ onBack, onPointsUpdated }: { onBack?: () => void; onPointsUpdated?: () => void }) {
  usePageTracking(ANALYTICS_PAGES.PROGRAMS);
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [folders, setFolders] = useState<ProgramFolder[]>([]);
  const [submissions, setSubmissions] = useState<ProgramSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [analyticsProgram, setAnalyticsProgram] = useState<Program | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{ points: number; newTotal: number; programTitle: string; submissionDetails?: any } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showFolderManagement, setShowFolderManagement] = useState(false);
  const [viewMode, setViewMode] = useState<'submit' | 'analytics'>('submit');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
        console.error('[ProgramsList] No user in localStorage');
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);
      if (!user.id) {
        console.error('[ProgramsList] User has no ID');
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Initialize sample program if needed
      await initializeSampleProgram();
      
      // Fetch programs
      const activePrograms = await programsAPI.getPrograms(user.role);
      setPrograms(activePrograms);

      // Fetch folders
      const supabase = getSupabaseClient();
      const { data: foldersData } = await supabase
        .from('program_folders')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (foldersData) {
        setFolders(foldersData);
        // Auto-expand all folders initially
        setExpandedFolders(new Set(foldersData.map(f => f.id)));
      }

      // Load user's submission counts
      const { data: submissionData } = await supabase
        .from('submissions')
        .select('program_id')
        .eq('user_id', user.id);

      if (submissionData) {
        const counts = submissionData.reduce((acc: any, sub: any) => {
          acc[sub.program_id] = (acc[sub.program_id] || 0) + 1;
          return acc;
        }, {});

        const submissionCounts = Object.keys(counts).map(programId => ({
          program_id: programId,
          count: counts[programId]
        }));

        setSubmissions(submissionCounts);
      }
    } catch (err) {
      console.error('[ProgramsList] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionCount = (programId: string) => {
    const submission = submissions.find(s => s.program_id === programId);
    return submission?.count || 0;
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

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleProgramClick = (program: Program) => {
    if (viewMode === 'analytics') {
      setAnalyticsProgram(program);
    } else {
      setSelectedProgram(program);
    }
  };

  // Group programs by folder
  const programsByFolder = programs.reduce((acc, program) => {
    const key = program.folder_id || 'unfoldered';
    if (!acc[key]) acc[key] = [];
    acc[key].push(program);
    return acc;
  }, {} as Record<string, Program[]>);

  const unfolderedPrograms = programsByFolder['unfoldered'] || [];

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 h-20 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
              )}
              <span className="text-2xl">📊</span>
              <h3 className="text-xl font-semibold text-gray-900">Programs</h3>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('submit')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    viewMode === 'submit'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Submit
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    viewMode === 'analytics'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </div>
                </button>
              </div>
              
              {/* Folder Management Button */}
              <button
                onClick={() => setShowFolderManagement(true)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                title="Manage Folders"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Folders</span>
              </button>
            </div>
          </div>

          {/* View Mode Indicator */}
          <div className="mt-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              {viewMode === 'submit' ? (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="font-semibold">Submit Mode:</span>
                  <span>Click any program to submit</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-semibold">Analytics Mode:</span>
                  <span>Click any program to view analytics</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Programs List */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {programs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <p className="text-gray-600">No active programs available</p>
                <p className="text-xs text-gray-500 mt-1">Check back later for new opportunities</p>
              </div>
            ) : (
              <>
                {/* Folders */}
                {folders.map(folder => {
                  const folderPrograms = programsByFolder[folder.id] || [];
                  if (folderPrograms.length === 0) return null;
                  
                  const isExpanded = expandedFolders.has(folder.id);
                  const folderColorClasses = getColorClasses(folder.color);

                  return (
                    <div key={folder.id} className="space-y-2">
                      {/* Folder Header */}
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className={`w-full ${folderColorClasses} border-2 rounded-xl p-4 hover:shadow-lg transition-all`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl flex-shrink-0">
                            {isExpanded ? <FolderOpen className="w-8 h-8" /> : <Folder className="w-8 h-8" />}
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="font-bold text-lg mb-1">{folder.icon} {folder.name}</h4>
                            <p className="text-sm opacity-80">{folder.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-center px-3 py-1 bg-white/50 rounded-lg">
                              <div className="font-bold text-lg">{folderPrograms.length}</div>
                              <div className="text-xs opacity-80">programs</div>
                            </div>
                            <ChevronRight 
                              className={`w-6 h-6 flex-shrink-0 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`} 
                            />
                          </div>
                        </div>
                      </button>

                      {/* Folder Programs */}
                      {isExpanded && (
                        <div className="ml-6 space-y-2 pl-4 border-l-2 border-gray-200">
                          {folderPrograms.map(program => {
                            const count = getSubmissionCount(program.id);
                            const colorClasses = getColorClasses(program.color);

                            return (
                              <button
                                key={program.id}
                                onClick={() => handleProgramClick(program)}
                                className={`w-full ${colorClasses} border rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="text-4xl flex-shrink-0">
                                    {program.icon}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <h4 className="font-semibold text-lg mb-1">{program.title}</h4>
                                    <p className="text-sm opacity-80">
                                      {count} submission{count !== 1 ? 's' : ''} made
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {viewMode === 'analytics' && (
                                      <div className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                                        ANALYTICS
                                      </div>
                                    )}
                                    <ChevronRight className="w-6 h-6 flex-shrink-0 opacity-60" />
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unfoldered Programs */}
                {unfolderedPrograms.length > 0 && (
                  <div className="space-y-2">
                    {folders.length > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        <Folder className="w-4 h-4" />
                        Other Programs
                      </div>
                    )}
                    {unfolderedPrograms.map(program => {
                      const count = getSubmissionCount(program.id);
                      const colorClasses = getColorClasses(program.color);

                      return (
                        <button
                          key={program.id}
                          onClick={() => handleProgramClick(program)}
                          className={`w-full ${colorClasses} border rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-4xl flex-shrink-0">
                              {program.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="font-semibold text-lg mb-1">{program.title}</h4>
                              <p className="text-sm opacity-80">
                                {count} submission{count !== 1 ? 's' : ''} made
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {viewMode === 'analytics' && (
                                <div className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                                  ANALYTICS
                                </div>
                              )}
                              <ChevronRight className="w-6 h-6 flex-shrink-0 opacity-60" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {selectedProgram && (
        <ProgramSubmitModal
          program={selectedProgram}
          userId={userId}
          onClose={() => setSelectedProgram(null)}
          onSuccess={(pointsAwarded, newTotal, submissionDetails) => {
            setSuccessData({
              points: pointsAwarded,
              newTotal: newTotal,
              programTitle: selectedProgram.title,
              submissionDetails
            });
            setSelectedProgram(null);
            setShowSuccessModal(true);
            loadData();
            if (onPointsUpdated) onPointsUpdated();
          }}
        />
      )}

      {/* Analytics Dashboard */}
      {analyticsProgram && (
        <ProgramAnalyticsDashboard
          program={analyticsProgram}
          onClose={() => setAnalyticsProgram(null)}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <SubmissionSuccessModal
          pointsEarned={successData.points}
          newTotalPoints={successData.newTotal}
          programTitle={successData.programTitle}
          submissionDetails={successData.submissionDetails}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessData(null);
          }}
        />
      )}

      {/* Folder Management Modal */}
      {showFolderManagement && (
        <FolderManagement
          onClose={() => setShowFolderManagement(false)}
          onFoldersUpdated={() => loadData()}
        />
      )}
    </>
  );
}
