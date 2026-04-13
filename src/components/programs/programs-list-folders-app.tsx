// Programs List Folders App v2.1 - With Enhanced Debug Logging for Direct Program Opening
import { useState, useEffect } from 'react';
import { programsAPI, initializeSampleProgram } from '../../utils/supabase-direct';
import { programsAPI as programsKVAPI } from './programs-api';
import { ChevronRight, ChevronLeft, Folder, FolderOpen, BarChart3, Plus, Settings, Truck } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { ProgramSubmitModal } from './program-submit-modal';
import { LinkedCheckoutModal } from './linked-checkout-modal';
import { SubmissionSuccessModal } from './submission-success-modal';
import { ProgramAnalyticsSimple } from './program-analytics-simple';
import { usePageTracking } from '../../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../../utils/analytics';
import { FOLDER_CONFIG, groupProgramsByFolder, getFolderColorClasses } from './folder-config';
import VanCalendarForm from '../van-calendar-form';
import VanCalendarGrid from '../van-calendar-grid';
import VanCalendarCompliance from '../van-calendar-compliance';
import { GuidedTour, shouldShowProgramTour, markProgramTourDone } from '../guided-tour';

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
  linked_checkin_program_id?: string;
}

interface ProgramSubmission {
  program_id: string;
  count: number;
}

export function ProgramsListFoldersApp({ 
  onBack, 
  onPointsUpdated, 
  initialProgramId 
}: { 
  onBack?: () => void; 
  onPointsUpdated?: () => void;
  initialProgramId?: string;
}) {
  console.log('[ProgramsList] 🚀 Component render with initialProgramId:', initialProgramId);
  
  usePageTracking(ANALYTICS_PAGES.PROGRAMS);
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [submissions, setSubmissions] = useState<ProgramSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [analyticsProgram, setAnalyticsProgram] = useState<Program | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{ points: number; newTotal: number; programTitle: string; submissionDetails?: any } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'submit' | 'analytics'>('submit');
  const [showFolderConfig, setShowFolderConfig] = useState(false);
  const [showVanCalendar, setShowVanCalendar] = useState(false);
  const [vanCalendarView, setVanCalendarView] = useState<'form' | 'grid' | 'compliance'>('form');
  const [userRole, setUserRole] = useState<string>('');
  const [vanCalendarEnabled, setVanCalendarEnabled] = useState(true); // Default: enabled
  const [tourProgram, setTourProgram] = useState<Program | null>(null); // Program tour state

  useEffect(() => {
    console.log('[ProgramsList] 🎬 Component mounted with initialProgramId:', initialProgramId);
    loadData();
    checkVanCalendarSettings();
  }, []);

  // Check if Van Calendar is enabled (database-controlled)
  const checkVanCalendarSettings = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('kv_store_28f2f653')
        .select('value')
        .eq('key', 'feature_van_calendar_enabled')
        .maybeSingle();

      if (error) {
        console.log('[ProgramsList] ℹ️ Van Calendar setting not found, defaulting to enabled');
        setVanCalendarEnabled(true);
        return;
      }

      if (data) {
        const enabled = data.value === 'true' || data.value === true;
        console.log('[ProgramsList] ✅ Van Calendar enabled:', enabled);
        setVanCalendarEnabled(enabled);
      } else {
        // If no setting exists, default to enabled
        setVanCalendarEnabled(true);
      }
    } catch (err) {
      console.error('[ProgramsList] ❌ Error checking Van Calendar settings:', err);
      setVanCalendarEnabled(true); // Default to enabled on error
    }
  };

  // Watch for initialProgramId changes and auto-open program
  useEffect(() => {
    console.log('[ProgramsList] 🔍 Checking auto-open:', { 
      initialProgramId, 
      programsLoaded: programs.length,
      currentSelection: selectedProgram?.title 
    });
    
    if (initialProgramId && programs.length > 0) {
      const programToOpen = programs.find(p => p.id === initialProgramId);
      console.log('[ProgramsList] 🎯 Found program to open:', programToOpen?.title);
      
      if (programToOpen && programToOpen.id !== selectedProgram?.id) {
        console.log('[ProgramsList] ✅ Opening program from prop:', programToOpen.title);
        setSelectedProgram(programToOpen);
      }
    }
  }, [initialProgramId, programs]);

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

      // Store user role for Van Calendar access
      setUserRole(user.role || '');

      console.log('[ProgramsList] ✅ User loaded:', {
        id: user.id,
        role: user.role,
        name: user.full_name,
        canSubmit: ['sales_executive', 'zonal_sales_manager', 'zone_business_lead'].includes(user.role)
      });

      setUserId(user.id);

      // Initialize sample program if needed
      await initializeSampleProgram();
      
      // Fetch programs
      const activePrograms = await programsAPI.getPrograms(user.role);
      
      // Merge linked_checkin_program_id from form configs into programs
      try {
        const allConfigs = await programsKVAPI.getAllProgramFormConfigs();
        activePrograms.forEach((prog: any) => {
          if (allConfigs[prog.id]?.linked_checkin_program_id) {
            prog.linked_checkin_program_id = allConfigs[prog.id].linked_checkin_program_id;
            console.log('[ProgramsList] 🔗 Linked checkout program:', prog.title, '→', prog.linked_checkin_program_id);
          }
        });
        console.log('[ProgramsList] ✅ Merged linked checkin configs into programs');
      } catch (cfgErr) {
        console.warn('[ProgramsList] ⚠️ Could not load form configs for linked checkout:', cfgErr);
      }
      
      setPrograms(activePrograms);

      // Auto-expand all folders initially
      setExpandedFolders(new Set(FOLDER_CONFIG.map(f => f.id)));

      // Load user's submission counts
      const supabase = getSupabaseClient();
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

      // Auto-select program if initialProgramId is provided
      console.log('[ProgramsList] 🔍 Checking initial program:', { 
        initialProgramId, 
        programsCount: activePrograms.length 
      });
      
      if (initialProgramId && activePrograms.length > 0) {
        const programToOpen = activePrograms.find(p => p.id === initialProgramId);
        console.log('[ProgramsList] 🎯 Found initial program:', programToOpen?.title);
        
        if (programToOpen) {
          console.log('[ProgramsList] ✅ Auto-opening program in loadData:', programToOpen.title);
          setSelectedProgram(programToOpen);
        }
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
    const isLinkedCheckout = !!(program as any).linked_checkin_program_id;
    console.log('[ProgramsList] 🎯 Program clicked:', {
      program: program.title,
      viewMode,
      isLinkedCheckout,
      linkedTo: (program as any).linked_checkin_program_id || null,
      willOpen: viewMode === 'analytics' ? 'Analytics Modal' : isLinkedCheckout ? 'Linked Checkout Modal' : 'Submit Modal'
    });
    
    if (viewMode === 'analytics') {
      setAnalyticsProgram(program);
    } else {
      // Always open the program modal first
      setSelectedProgram(program);
      // Then check if we should show the tour INSIDE the opened modal
      if (shouldShowProgramTour(program.id)) {
        console.log('[ProgramsList] 🎓 Will show program tour inside modal for:', program.title);
        // Delay slightly to let the modal render its data-tour elements
        setTimeout(() => setTourProgram(program), 600);
      }
    }
  };

  // Group programs by folder
  const groupedPrograms = groupProgramsByFolder(programs);

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
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                    viewMode === 'submit'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Submit</span>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                    viewMode === 'analytics'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </div>
                </button>
              </div>
              
              {/* Folder Config Info */}
              <button
                onClick={() => setShowFolderConfig(true)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                title="Folder Info"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Info</span>
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
                {/* Render folders */}
                {FOLDER_CONFIG.map(folder => {
                  const folderGroup = groupedPrograms[folder.id];
                  if (!folderGroup || folderGroup.programs.length === 0) return null;
                  
                  const isExpanded = expandedFolders.has(folder.id);
                  const folderColorClasses = getFolderColorClasses(folder.color);

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
                              <div className="font-bold text-lg">{folderGroup.programs.length}</div>
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
                          {folderGroup.programs.map(program => {
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
                {groupedPrograms['unfoldered']?.programs.length > 0 && (
                  <div className="space-y-2">
                    {FOLDER_CONFIG.length > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        <Folder className="w-4 h-4" />
                        Other Programs
                      </div>
                    )}
                    {groupedPrograms['unfoldered'].programs.map(program => {
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

      {/* Submit Modal - Route to LinkedCheckoutModal or ProgramSubmitModal */}
      {selectedProgram && (
        (selectedProgram as any).linked_checkin_program_id ? (
          <LinkedCheckoutModal
            program={selectedProgram}
            userId={userId}
            onClose={() => { setSelectedProgram(null); setTourProgram(null); }}
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
        ) : (
          <ProgramSubmitModal
            program={selectedProgram}
            userId={userId}
            onClose={() => { setSelectedProgram(null); setTourProgram(null); }}
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
        )
      )}

      {/* Analytics Dashboard */}
      {analyticsProgram && (
        <ProgramAnalyticsSimple
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

      {/* Folder Config Info Modal */}
      {showFolderConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Folder className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Folder Configuration</h2>
                    <p className="text-blue-100 text-sm mt-1">Programs are auto-organized by category</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFolderConfig(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-2">How It Works</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Programs are automatically grouped by their <strong>category</strong> field</li>
                    <li>• Folders are defined in code (no database needed)</li>
                    <li>• Edit <code className="bg-white px-2 py-0.5 rounded">/components/programs/folder-config.ts</code> to customize</li>
                  </ul>
                </div>

                <h3 className="font-bold text-gray-900 text-lg">Current Folders ({FOLDER_CONFIG.length})</h3>
                
                {FOLDER_CONFIG.map(folder => {
                  const folderGroup = groupedPrograms[folder.id];
                  const programCount = folderGroup?.programs.length || 0;
                  const colorClasses = getFolderColorClasses(folder.color);

                  return (
                    <div key={folder.id} className={`${colorClasses} border-2 rounded-xl p-4`}>
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{folder.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{folder.name}</h4>
                          <p className="text-sm opacity-80 mt-1">{folder.description}</p>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="font-semibold">Category: <code className="bg-white/50 px-2 py-0.5 rounded">{folder.category}</code></span>
                            <span className="font-semibold">{programCount} programs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">To Add/Edit Folders:</h4>
                  <ol className="text-sm text-gray-700 space-y-1">
                    <li>1. Open <code className="bg-white px-2 py-0.5 rounded">/components/programs/folder-config.ts</code></li>
                    <li>2. Edit the <code className="bg-white px-2 py-0.5 rounded">FOLDER_CONFIG</code> array</li>
                    <li>3. Set the <strong>category</strong> field to match your programs</li>
                    <li>4. Save and reload the app</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                onClick={() => setShowFolderConfig(false)}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VAN CALENDAR MODAL - Full Screen */}
      {showVanCalendar && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowVanCalendar(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <Truck className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Van Weekly Calendar</h2>
                  <p className="text-blue-100 text-sm">
                    {userRole === 'zonal_sales_manager' 
                      ? 'Submit your weekly van routes'
                      : userRole === 'hq_command_center' || userRole === 'director'
                      ? 'View all van calendars and compliance'
                      : 'Van route planning and schedules'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-navigation for HQ roles */}
            {(userRole === 'hq_command_center' || userRole === 'director') && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setVanCalendarView('grid')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    vanCalendarView === 'grid'
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  📅 Calendar Grid
                </button>
                <button
                  onClick={() => setVanCalendarView('compliance')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    vanCalendarView === 'compliance'
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  📊 Compliance Report
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {vanCalendarView === 'form' && <VanCalendarForm />}
            {vanCalendarView === 'grid' && <VanCalendarGrid />}
            {vanCalendarView === 'compliance' && <VanCalendarCompliance />}
          </div>
        </div>
      )}

      {/* Program Tour — shows inside the opened program modal */}
      {tourProgram && (
        <GuidedTour
          type="program"
          programId={tourProgram.id}
          programTitle={tourProgram.title}
          onComplete={() => {
            // Tour done — modal is already open, just dismiss the tour overlay
            setTourProgram(null);
          }}
        />
      )}
    </>
  );
}