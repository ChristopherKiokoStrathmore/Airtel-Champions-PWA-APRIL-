// Programs Widget Home v2.0 - With Folder Support
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { Plus, TrendingUp, Users, Folder, ChevronDown } from 'lucide-react';

interface Program {
  id: string;
  title: string;
  description: string;
  points_value: number;
  status: string;
  created_at: string;
}

interface ProgramSubmission {
  id: string;
  program_id: string;
  created_at: string;
  status: string;
}

interface ProgramFolder {
  name: string;
  programIds: string[];
}

export function ProgramsWidgetHome({ 
  onViewAll, 
  onPointsUpdated,
  onProgramClick 
}: { 
  onViewAll: () => void; 
  onPointsUpdated?: () => void;
  onProgramClick?: (programId: string) => void;
}) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [submissions, setSubmissions] = useState<ProgramSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<{ [key: string]: ProgramFolder }>({});
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadData();
    loadFolders();

    // Listen for folder changes (cross-window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'program_folders') {
        console.log('[Programs Widget Home] Folders updated (cross-window), reloading...');
        loadFolders();
      }
    };

    // Listen for folder changes (same-window)
    const handleFolderUpdate = () => {
      console.log('[Programs Widget Home] Folders updated (same-window), reloading...');
      loadFolders();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('foldersUpdated', handleFolderUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('foldersUpdated', handleFolderUpdate);
    };
  }, []);

  const loadFolders = () => {
    try {
      console.log('[Programs Widget Home] 🔍 Loading folders...');
      
      // Try localStorage first
      const stored = localStorage.getItem('program_folders');
      console.log('[Programs Widget Home] 📦 localStorage data:', stored);
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('[Programs Widget Home] ✅ Successfully parsed folders');
          console.log('[Programs Widget Home] 📊 Total folders found:', Object.keys(parsed).length);
          console.log('[Programs Widget Home] 📁 Folder details:', parsed);
          setFolders(parsed);
        } catch (parseErr) {
          console.error('[Programs Widget Home] ❌ Parse error:', parseErr);
          // Try sessionStorage backup
          const sessionBackup = sessionStorage.getItem('program_folders_backup');
          if (sessionBackup) {
            console.log('[Programs Widget Home] 🔄 Recovering from sessionStorage backup');
            const parsed = JSON.parse(sessionBackup);
            setFolders(parsed);
          }
        }
      } else {
        console.log('[Programs Widget Home] ⚠️ No data in localStorage');
        // Try sessionStorage backup
        const sessionBackup = sessionStorage.getItem('program_folders_backup');
        if (sessionBackup) {
          console.log('[Programs Widget Home] 🔄 Found folders in sessionStorage backup');
          const parsed = JSON.parse(sessionBackup);
          console.log('[Programs Widget Home] 📊 Recovered', Object.keys(parsed).length, 'folders');
          setFolders(parsed);
          // Restore to localStorage
          localStorage.setItem('program_folders', sessionBackup);
        } else {
          console.log('[Programs Widget Home] ℹ️ No folders in any storage');
        }
      }
    } catch (error) {
      console.error('[Programs Widget Home] ❌ Fatal error loading folders:', error);
    }
  };

  const loadData = async () => {
    try {
      // Load active programs
      const { data: programsData } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      // Load recent submissions (last 24 hours)
      // 🚨 TEMPORARILY DISABLED - Database timeout issue
      // This query was causing massive timeouts on submissions table
      // TODO: Re-enable after database index is added
      /*
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false });
      */

      setPrograms(programsData || []);
      setSubmissions([]); // Empty submissions until index is added
    } catch (error) {
      console.error('[Programs Widget] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-5 mb-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalSubmissionsToday = submissions.length;
  const activePrograms = programs.length;
  const pendingReviews = submissions.filter(s => s.status === 'pending').length;

  // Organize programs into folders and standalone
  const organizePrograms = () => {
    const programsInFolders = new Set<string>();
    const foldersList: Array<{ id: string; name: string; programs: Program[] }> = [];

    // Build folders with their programs
    Object.entries(folders).forEach(([folderId, folder]) => {
      const folderPrograms = programs.filter(p => folder.programIds.includes(p.id));
      if (folderPrograms.length > 0) {
        foldersList.push({
          id: folderId,
          name: folder.name,
          programs: folderPrograms
        });
        folderPrograms.forEach(p => programsInFolders.add(p.id));
      }
    });

    // Get standalone programs (not in any folder)
    const standalonePrograms = programs.filter(p => !programsInFolders.has(p.id));

    console.log('[Programs Widget Home] 📁 Organized Programs:', { 
      totalFolders: foldersList.length, 
      totalStandalone: standalonePrograms.length,
      folders: foldersList.map(f => ({ name: f.name, programCount: f.programs.length })),
      standalonePrograms: standalonePrograms.map(p => p.title)
    });

    return { foldersList, standalonePrograms };
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleProgramClick = (programId: string, programTitle: string) => {
    console.log('[Programs Widget Home] 🎯 Program clicked:', programTitle, programId);
    if (onProgramClick) {
      onProgramClick(programId);
    } else {
      onViewAll();
    }
  };

  const { foldersList, standalonePrograms } = organizePrograms();

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>📋</span>
          <span>Programs Activity</span>
        </h3>
        <button
          onClick={onViewAll}
          className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
        >
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-700">{activePrograms}</div>
          <div className="text-xs text-red-600 mt-1">Active</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{totalSubmissionsToday}</div>
          <div className="text-xs text-blue-600 mt-1">Today</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 text-center border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{pendingReviews}</div>
          <div className="text-xs text-yellow-600 mt-1">Pending</div>
        </div>
      </div>

      {/* Recent Programs */}
      {programs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm mb-3">No active programs</p>
          <button
            onClick={onViewAll}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm shadow-md inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Program
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Folders */}
          {foldersList.map(folder => {
            const isExpanded = expandedFolders[folder.id];

            return (
              <div key={folder.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl overflow-hidden border border-blue-200">
                {/* Folder Header - Compact Style */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Folder className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <h4 className="font-bold text-gray-900 truncate text-base">
                      {folder.name}
                    </h4>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold whitespace-nowrap">
                      Programs
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Could add delete functionality here if needed
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="text-blue-600 hover:text-blue-700 transition-all"
                    >
                      <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Folder Programs (Expanded) */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {folder.programs.map(program => {
                      const programSubmissions = submissions.filter(s => s.program_id === program.id);
                      const submissionCount = programSubmissions.length;

                      return (
                        <button
                          key={program.id}
                          onClick={() => handleProgramClick(program.id, program.title)}
                          className="w-full text-left bg-white hover:bg-gray-50 rounded-xl p-4 transition-all border border-gray-200 hover:border-gray-300 hover:shadow-sm group"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-gray-900 mb-2 text-base">
                                {program.title}
                              </h5>
                              <div className="flex items-center gap-4">
                                  {program.points_value > 0 ? (
                                    <div className="flex items-center gap-1 text-sm text-red-600">
                                      <TrendingUp className="w-4 h-4" />
                                      <span className="font-semibold">{program.points_value} pts</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <TrendingUp className="w-4 h-4" />
                                      <span className="font-semibold">No Points</span>
                                    </div>
                                  )}
                                <div className="flex items-center gap-1 text-sm text-blue-600">
                                  <Users className="w-4 h-4" />
                                  <span>{submissionCount} submission{submissionCount !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl border border-orange-200">
                                📋
                              </div>
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

          {/* Standalone Programs */}
          {standalonePrograms.map(program => {
            const programSubmissions = submissions.filter(s => s.program_id === program.id);
            const submissionCount = programSubmissions.length;

            return (
              <button
                key={program.id}
                onClick={() => handleProgramClick(program.id, program.title)}
                className="w-full text-left bg-white hover:bg-gray-50 rounded-xl p-4 transition-all border border-gray-200 hover:border-gray-300 hover:shadow-sm group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 mb-2 text-base">
                      {program.title}
                    </h4>
                    <div className="flex items-center gap-4">
                      {program.points_value > 0 ? (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-semibold">{program.points_value} pts</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-semibold">No Points</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <Users className="w-4 h-4" />
                        <span>{submissionCount} submission{submissionCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl border border-orange-200">
                      📋
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {/* View All Button */}
          <button
            onClick={onViewAll}
            className="w-full mt-3 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl transition-all font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>View All Programs</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}