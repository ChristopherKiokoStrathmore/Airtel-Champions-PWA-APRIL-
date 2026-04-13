// Programs Dashboard v3.0 - With localStorage Folder Sync  
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';
import { ProgramCreator } from './program-creator';
import { ProgramCreatorEnhanced } from './program-creator-enhanced';
import { ProgramSubmissions } from './program-submissions';
import { ProgramAnalytics } from './program-analytics';
import { ProgramExcelImporter } from './program-excel-importer';
import { ProgramGFormsImporter } from './program-gforms-importer';
import { ProgramDetails } from './program-details';
import { ProgramSubmitModal } from './program-submit-modal';
import { LinkedCheckoutModal } from './linked-checkout-modal';
import { ProgramsTest } from './programs-test';
import { DiagnosticPanel } from '../diagnostic-panel';
import { programsAPI } from './programs-api';
import VanCalendarForm from '../van-calendar-form';
import VanCalendarGrid from '../van-calendar-grid';
import VanCalendarCompliance from '../van-calendar-compliance';
import VanCalendarView from '../van-calendar-view';
import { Plus, BarChart3, FileText, Play, Pause, Trash2, Eye, Upload, Link2, Edit2, Activity, ArrowLeft, Check, Folder, FolderPlus, X, Truck, ChevronRight, Calendar } from 'lucide-react';

interface Program {
  id: string;
  title: string;
  description: string;
  points_value: number;
  target_roles: string[];
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  fields?: any[]; // Add fields to interface
  is_expired?: boolean; // Add is_expired to interface
}

export function ProgramsDashboard({ onBack }: { onBack?: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreator, setShowCreator] = useState(false);
  const [showExcelImporter, setShowExcelImporter] = useState(false);
  const [showGFormsImporter, setShowGFormsImporter] = useState(false);
  const [selectedProgramForSubmissions, setSelectedProgramForSubmissions] = useState<Program | null>(null);
  const [selectedProgramForAnalytics, setSelectedProgramForAnalytics] = useState<Program | null>(null);
  const [selectedProgramForDetails, setSelectedProgramForDetails] = useState<Program | null>(null);
  const [selectedProgramForSubmit, setSelectedProgramForSubmit] = useState<Program | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [editingProgram, setEditingProgram] = useState<Program | null>(null); // New state for editing
  const [showDiagnostics, setShowDiagnostics] = useState(false); // New state for diagnostics
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null); // For delete confirmation
  const [submissionCount, setSubmissionCount] = useState<number>(0); // For showing submission count
  const [deleteSubmissions, setDeleteSubmissions] = useState<boolean>(false); // Whether to delete submissions too
  const [selectionMode, setSelectionMode] = useState(false); // For selecting programs to merge
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]); // Selected program IDs
  const [showFolderModal, setShowFolderModal] = useState(false); // For folder creation modal
  const [folderName, setFolderName] = useState(''); // Folder name input
  const [folders, setFolders] = useState<{ [key: string]: { name: string; programIds: string[] } }>({}); // Folders storage
  const [collapsedFolders, setCollapsedFolders] = useState<{ [key: string]: boolean }>({}); // Track collapsed state
  const [showVanCalendar, setShowVanCalendar] = useState(false); // Van Calendar modal
  const [vanCalendarView, setVanCalendarView] = useState<'form' | 'grid' | 'compliance' | 'view'>('form'); // Van Calendar view
  const [vanCalendarEnabled, setVanCalendarEnabled] = useState(true); // Van Calendar feature toggle
  const [showVanCalendarViewModal, setShowVanCalendarViewModal] = useState(false); // Van Calendar View modal

  useEffect(() => {
    loadUserRole();
    loadPrograms();
    loadFolders();
    checkVanCalendarSettings();
  }, []);

  // Check if Van Calendar is enabled (database-controlled)
  const checkVanCalendarSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('kv_store_28f2f653')
        .select('value')
        .eq('key', 'feature_van_calendar_enabled')
        .maybeSingle();

      if (error) {
        console.log('[Programs Dashboard] ℹ️ Van Calendar setting not found, defaulting to enabled');
        setVanCalendarEnabled(true);
        return;
      }

      if (data) {
        const enabled = data.value === 'true' || data.value === true;
        console.log('[Programs Dashboard] ✅ Van Calendar enabled:', enabled);
        setVanCalendarEnabled(enabled);
      } else {
        setVanCalendarEnabled(true);
      }
    } catch (err) {
      console.error('[Programs Dashboard] ❌ Error checking Van Calendar settings:', err);
      setVanCalendarEnabled(true);
    }
  };

  // Load folders from localStorage with enhanced error handling
  const loadFolders = () => {
    try {
      console.log('[Programs Dashboard] 🔍 Loading folders from localStorage...');
      
      // Try localStorage first
      const storedFolders = localStorage.getItem('program_folders');
      console.log('[Programs Dashboard] 📦 Raw localStorage data:', storedFolders);
      
      if (storedFolders) {
        try {
          const parsed = JSON.parse(storedFolders);
          console.log('[Programs Dashboard] ✅ Successfully parsed folders:', Object.keys(parsed).length, 'folders');
          setFolders(parsed);
        } catch (parseErr) {
          console.error('[Programs Dashboard] ❌ Error parsing folders JSON:', parseErr);
          // Try sessionStorage as backup
          const sessionFolders = sessionStorage.getItem('program_folders_backup');
          if (sessionFolders) {
            console.log('[Programs Dashboard] 🔄 Recovering from sessionStorage backup');
            const parsed = JSON.parse(sessionFolders);
            setFolders(parsed);
            // Restore to localStorage
            localStorage.setItem('program_folders', sessionFolders);
          }
        }
      } else {
        console.log('[Programs Dashboard] ℹ️ No folders found in localStorage');
        // Check sessionStorage backup
        const sessionFolders = sessionStorage.getItem('program_folders_backup');
        if (sessionFolders) {
          console.log('[Programs Dashboard] 🔄 Found folders in sessionStorage backup, restoring...');
          const parsed = JSON.parse(sessionFolders);
          setFolders(parsed);
          localStorage.setItem('program_folders', sessionFolders);
        }
      }
    } catch (err) {
      console.error('[Programs Dashboard] ❌ Error loading folders:', err);
    }
  };

  // Save folders to localStorage with verification and backup
  const saveFolders = (newFolders: typeof folders) => {
    try {
      const foldersJson = JSON.stringify(newFolders);
      const folderCount = Object.keys(newFolders).length;
      
      console.log('[Programs Dashboard] 💾 Saving', folderCount, 'folders to storage...');
      
      // Save to localStorage
      localStorage.setItem('program_folders', foldersJson);
      
      // Save backup to sessionStorage
      sessionStorage.setItem('program_folders_backup', foldersJson);
      
      // Verify the save worked
      const verification = localStorage.getItem('program_folders');
      if (verification === foldersJson) {
        console.log('[Programs Dashboard] ✅ Folders saved and verified successfully');
      } else {
        console.warn('[Programs Dashboard] ⚠️ Save verification failed! localStorage might not be persisting');
      }
      
      setFolders(newFolders);
      
      // Notify other components that folders have been updated
      window.dispatchEvent(new Event('foldersUpdated'));
      console.log('[Programs Dashboard] 📢 Folders updated event dispatched');
    } catch (err) {
      console.error('[Programs Dashboard] ❌ Error saving folders:', err);
      // Try sessionStorage as fallback
      try {
        sessionStorage.setItem('program_folders_backup', JSON.stringify(newFolders));
        console.log('[Programs Dashboard] 🔄 Saved to sessionStorage backup instead');
      } catch (sessionErr) {
        console.error('[Programs Dashboard] ❌ SessionStorage backup also failed:', sessionErr);
      }
    }
  };

  const loadUserRole = async () => {
    try {
      // Get user from localStorage (TAI app authentication)
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) return;
      
      const user = JSON.parse(storedUser);
      setUserRole(user.role || '');
    } catch (err) {
      console.error('[Programs] Error loading user role:', err);
    }
  };

  const loadPrograms = async () => {
    try {
      // Get user from localStorage (TAI app authentication)
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
        throw new Error('Not authenticated');
      }

      const user = JSON.parse(storedUser);
      console.log('[Programs] Loading programs for user:', user.role);
      
      // For Directors/HQ, fetch ALL programs directly from database
      if (user.role === 'director' || user.role === 'hq_staff' || user.role === 'hq_command_center' || user.role === 'developer') {
        const { data: allPrograms, error: programsError } = await supabase
          .from('programs')
          .select(`
            *,
            program_fields (*)
          `)
          .order('created_at', { ascending: false });
        
        if (programsError) {
          console.error('[Programs] Error loading all programs:', programsError);
        } else {
          console.log('[Programs] ✅ Loaded all programs for admin:', allPrograms?.length);
          // Transform program_fields array to fields for consistency
          const transformedPrograms = allPrograms?.map(prog => {
            const isExpired = prog.end_date && new Date(prog.end_date) < new Date();
            return {
              ...prog,
              fields: prog.program_fields || [],
              is_expired: isExpired,
            };
          }) || [];
          
          // Fetch session checkin flags from KV store and merge into programs
          try {
            const checkinFlags = await programsAPI.getCheckinFlags();
            const allConfigs = await programsAPI.getAllProgramFormConfigs();
            transformedPrograms.forEach((prog: any) => {
              if (checkinFlags[prog.id]) {
                prog.session_checkin_enabled = true;
              }
              // Merge linked_checkin_program_id for checkout mode
              if (allConfigs[prog.id]?.linked_checkin_program_id) {
                prog.linked_checkin_program_id = allConfigs[prog.id].linked_checkin_program_id;
              }
            });
            console.log('[Programs] ✅ Merged checkin flags + configs into programs');
          } catch (flagErr) {
            console.error('[Programs] ⚠️ Could not load checkin flags:', flagErr);
          }
          
          setPrograms(transformedPrograms);
        }
      } else {
        // For other roles (SE, ZSM, ZBM), fetch programs targeted to their role
        // and exclude expired programs
        console.log('[Programs] Fetching programs for role:', user.role);
        
        // Map role variations to search for in target_roles
        const roleSearchTerms: string[] = [user.role];
        
        // Add role variations for better matching
        if (user.role === 'zonal_sales_manager') {
          roleSearchTerms.push('ZSM', 'zsm', 'Zonal Sales Manager');
        } else if (user.role === 'sales_executive') {
          roleSearchTerms.push('SE', 'se', 'Sales Executive', 'Sales Executives');
        } else if (user.role === 'zone_business_lead') {
          roleSearchTerms.push('ZBM', 'zbm', 'Zone Business Lead');
        }
        
        console.log('[Programs] Searching for programs with target_roles containing:', roleSearchTerms);
        
        // Fetch all active programs first, then filter in JavaScript for flexibility
        const { data: allActivePrograms, error: programsError } = await supabase
          .from('programs')
          .select(`
            *,
            program_fields (*)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (programsError) {
          console.error('[Programs] Error loading role programs:', programsError);
        } else {
          console.log('[Programs] 📊 Total active programs in database:', allActivePrograms?.length);
          
          // Filter programs that target this role (with flexible matching)
          const rolePrograms = allActivePrograms?.filter(prog => {
            const targetRoles = prog.target_roles || [];
            console.log(`[Programs] Program "${prog.title}" has target_roles:`, targetRoles);
            
            // Check if any of our role search terms match any of the target roles
            const matches = roleSearchTerms.some(searchTerm => 
              targetRoles.some((targetRole: string) => 
                targetRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                searchTerm.toLowerCase().includes(targetRole.toLowerCase())
              )
            );
            
            if (matches) {
              console.log(`[Programs] ✅ "${prog.title}" matches role ${user.role}`);
            } else {
              console.log(`[Programs] ⏭️ "${prog.title}" doesn't match role ${user.role}`);
            }
            
            return matches;
          }) || [];
          
          console.log('[Programs] ✅ Loaded programs for', user.role, ':', rolePrograms.length);
          
          // Transform program_fields array to fields for consistency
          // Filter out expired programs for non-admin users
          const now = new Date();
          const transformedPrograms = rolePrograms
            .map(prog => ({
              ...prog,
              fields: prog.program_fields || [],
              is_expired: prog.end_date && new Date(prog.end_date) < now,
            }))
            .filter(prog => !prog.is_expired); // Exclude expired programs
          
          // Fetch session checkin flags from KV store and merge into programs
          try {
            const checkinFlags = await programsAPI.getCheckinFlags();
            const allConfigs = await programsAPI.getAllProgramFormConfigs();
            transformedPrograms.forEach((prog: any) => {
              if (checkinFlags[prog.id]) {
                prog.session_checkin_enabled = true;
              }
              // Merge linked_checkin_program_id for checkout mode
              if (allConfigs[prog.id]?.linked_checkin_program_id) {
                prog.linked_checkin_program_id = allConfigs[prog.id].linked_checkin_program_id;
              }
            });
            console.log('[Programs] ✅ Merged checkin flags + configs into SE programs');
          } catch (flagErr) {
            console.error('[Programs] ⚠️ Could not load checkin flags:', flagErr);
          }
          
          setPrograms(transformedPrograms);
        }
      }
    } catch (err: any) {
      console.error('[Programs] Error loading programs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (programId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    if (!confirm(`${newStatus === 'active' ? 'Activate' : 'Pause'} this program?`)) {
      return;
    }

    try {
      // Update directly in database (no server call needed for simple toggle)
      const { error } = await supabase
        .from('programs')
        .update({ status: newStatus })
        .eq('id', programId);

      if (error) {
        throw new Error(error.message || 'Failed to update program');
      }

      loadPrograms();
    } catch (err: any) {
      console.error('[Programs] Error toggling status:', err);
      alert(err.message);
    }
  };

  // Handle program selection
  const toggleProgramSelection = (programId: string) => {
    setSelectedPrograms(prev => {
      if (prev.includes(programId)) {
        return prev.filter(id => id !== programId);
      } else {
        return [...prev, programId];
      }
    });
  };

  // Create folder from selected programs
  const handleCreateFolder = () => {
    if (selectedPrograms.length < 2) {
      alert('Please select at least 2 programs to create a folder');
      return;
    }
    setShowFolderModal(true);
  };

  // Save the folder
  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    const folderId = `folder_${Date.now()}`;
    const newFolders = {
      ...folders,
      [folderId]: {
        name: folderName.trim(),
        programIds: [...selectedPrograms]
      }
    };

    saveFolders(newFolders);
    
    // Set new folder as collapsed by default
    setCollapsedFolders(prev => ({
      ...prev,
      [folderId]: true
    }));
    
    console.log(`[Programs Dashboard] ✅ Folder "${folderName}" created with ${selectedPrograms.length} programs`);
    
    setShowFolderModal(false);
    setFolderName('');
    setSelectedPrograms([]);
    setSelectionMode(false);
  };

  // Cancel selection mode
  const cancelSelectionMode = () => {
    setSelectionMode(false);
    setSelectedPrograms([]);
  };

  // Toggle folder collapse
  const toggleFolder = (folderId: string) => {
    setCollapsedFolders(prev => {
      const currentState = prev[folderId] !== false; // Default is collapsed (true)
      return {
        ...prev,
        [folderId]: !currentState
      };
    });
  };

  // Delete/ungroup a folder
  const deleteFolder = (folderId: string) => {
    if (!confirm('Remove this folder? Programs will be ungrouped but not deleted.')) {
      return;
    }
    
    const newFolders = { ...folders };
    delete newFolders[folderId];
    saveFolders(newFolders);
  };

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

    return { foldersList, standalonePrograms };
  };

  const handleDeleteProgram = async (programId: string, title: string) => {
    if (!confirm(`Delete program "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete directly from database
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) {
        throw new Error(error.message || 'Failed to delete program');
      }

      console.log('[Programs Dashboard] ✅ Program deleted successfully:', title);
      alert('Program deleted successfully');
      
      // Clear all selected program states to navigate back to list
      setSelectedProgramForDetails(null);
      setSelectedProgramForSubmissions(null);
      setSelectedProgramForAnalytics(null);
      setSelectedProgramForSubmit(null);
      setDeletingProgramId(null); // Close the delete confirmation dialog
      
      loadPrograms();
    } catch (err: any) {
      console.error('[Programs] Error deleting program:', err);
      alert(err.message);
      setDeletingProgramId(null); // Close dialog even on error
    }
  };

  const canCreatePrograms = userRole === 'director' || userRole === 'hq_staff' || userRole === 'hq_command_center' || userRole === 'developer';

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

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 w-full">
      {/* Header - Clean & Minimal */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
            )}
            <div>
              <h1 className="text-4xl text-gray-900 mb-2">Programs</h1>
              <p className="text-gray-500">
                Manage field intelligence programs
              </p>
            </div>
          </div>
        </div>
        {canCreatePrograms && (
          <div className="flex items-center gap-3">
            {/* Selection Mode Controls */}
            {!selectionMode ? (
              <button
                onClick={() => setSelectionMode(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:shadow-md transition-all flex items-center gap-2 text-sm"
              >
                <FolderPlus className="w-4 h-4" />
                Create Folder
              </button>
            ) : (
              <>
                <button
                  onClick={cancelSelectionMode}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all flex items-center gap-2 text-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={selectedPrograms.length < 2}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm ${
                    selectedPrograms.length >= 2
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  Merge ({selectedPrograms.length})
                </button>
              </>
            )}

            {/* Import Dropdown */}
            {!selectionMode && (
              <div className="relative group">
                <button
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:shadow-md transition-all flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 overflow-hidden">
                <button
                  onClick={() => setShowExcelImporter(true)}
                  className="w-full px-5 py-4 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">From Excel</div>
                    <div className="text-xs text-gray-500">.xlsx or .xls file</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowGFormsImporter(true)}
                  className="w-full px-5 py-4 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">From Google Forms</div>
                    <div className="text-xs text-gray-500">Paste form URL</div>
                  </div>
                </button>
              </div>
              </div>
            )}

            {/* Create Program Button - Prominent */}
            {!selectionMode && (
              <button
                onClick={() => setShowCreator(true)}
                className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            )}
          </div>
        )}
      </div>

      {/* Database Test Component - Shows if tables are connected - Only for Developers */}
      {userRole === 'developer' && <ProgramsTest />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={() => setShowDiagnostics(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Activity className="w-5 h-5" />
            Run Diagnostics
          </button>
        </div>
      )}

      {/* Diagnostic Button - Always visible for troubleshooting */}
      {userRole === 'developer' && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🩺 Troubleshooting Tools</h3>
              <p className="text-sm text-blue-700 mb-3">
                Having issues with "Failed to load program details" or "Questions (0)"? 
                Run diagnostics to check your database setup.
              </p>
              <button
                onClick={() => setShowDiagnostics(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg"
              >
                <Activity className="w-5 h-5" />
                🔍 Run Database Diagnostics
              </button>
            </div>
            <div className="text-5xl">🔧</div>
          </div>
        </div>
      )}

      {/* Programs List - Minimal & Clean */}
      {programs.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-gray-400 text-xl mb-3">No programs yet</p>
          <p className="text-gray-400">
            {canCreatePrograms
              ? 'Create your first program to get started'
              : 'Check back later for new programs'}
          </p>
        </div>
      ) : (() => {
        const { foldersList, standalonePrograms } = organizePrograms();
        
        const renderProgramCard = (program: Program) => (
          <div
            key={program.id}
            className={`bg-white border rounded-2xl p-6 hover:shadow-lg transition-all duration-200 ${
              selectionMode && selectedPrograms.includes(program.id)
                ? 'border-blue-500 border-2 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Top: Title and Status */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <button
                      onClick={() => toggleProgramSelection(program.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        selectedPrograms.includes(program.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {selectedPrograms.includes(program.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                  )}
                  <h2 className="text-2xl text-gray-900">{program.title}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      program.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {program.status}
                  </span>
                  {program.is_expired && (
                    <span className="px-3 py-1 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-200">
                      ⏰ Expired
                    </span>
                  )}
                </div>
                
                {program.description && (
                  <p className="text-gray-500 text-sm mb-3">{program.description}</p>
                )}
              </div>
            </div>
            
            {/* Middle: Program Details */}
            <div className="flex items-center gap-6 text-sm mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Points:</span>
                <span className="text-red-600 font-semibold text-lg">{program.points_value}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Target:</span>
                <div className="flex gap-2 flex-wrap">
                  {program.target_roles.map(role => (
                    <span
                      key={role}
                      className="px-2 py-0.5 bg-gray-50 text-gray-700 rounded text-xs"
                    >
                      {role === 'sales_executive' ? 'Sales Executives' :
                       role === 'zonal_sales_manager' ? 'ZSM' :
                       role === 'zonal_business_manager' ? 'ZBM' :
                       role === 'hq_staff' || role === 'hq_command_center' ? 'HQ' :
                       role === 'director' ? 'Director' : role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: Action Buttons - Prominent and Clear */}
            {(() => {
              // Check if current user can submit this program
              const storedUser = localStorage.getItem('tai_user');
              const currentUserRole = storedUser ? JSON.parse(storedUser).role : '';
              const canUserSubmit = !program.who_can_submit || 
                                   program.who_can_submit.length === 0 || 
                                   program.who_can_submit.includes(currentUserRole);
              
              return (
                <>
                  {/* Show Submit button prominently for users who can submit */}
                  {canUserSubmit && !canCreatePrograms && (
                    <button
                      onClick={() => setSelectedProgramForSubmit(program)}
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold mb-3 shadow-md"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Submit Form</span>
                    </button>
                  )}
                  
                  {/* Standard Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedProgramForSubmissions(program)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-semibold text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Submissions</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedProgramForAnalytics(program)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-all font-semibold text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedProgramForDetails(program)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Details</span>
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Admin Actions (if authorized) */}
            {canCreatePrograms && !selectionMode && (
              <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setEditingProgram(program);
                    setShowCreator(true);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => handleToggleStatus(program.id, program.status)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all text-sm"
                >
                  {program.status === 'active' ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Activate</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={async () => {
                    // Load submission count before showing delete confirmation
                    const { count, error } = await supabase
                      .from('submissions')
                      .select('*', { count: 'exact', head: true })
                      .eq('program_id', program.id);
                    
                    setSubmissionCount(count || 0);
                    setDeletingProgramId(program.id);
                    setDeleteSubmissions(false); // Reset checkbox
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        );

        return (
          <div className="space-y-4">
            {/* ⚠️ OLD VAN CALENDAR CARD - DISABLED (Now using Van Calendar as a Program)
                After running VAN_CALENDAR_PROGRAM_MIGRATION.sql, Van Calendar appears as a normal program card below.
                This old standalone card is no longer needed.
            */}
            {false && vanCalendarEnabled && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setShowVanCalendar(true);
                    // Set initial view based on role
                    if (userRole === 'zonal_sales_manager') {
                      setVanCalendarView('form');
                    } else if (userRole === 'hq_command_center' || userRole === 'director') {
                      setVanCalendarView('grid');
                    } else {
                      setVanCalendarView('form');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-700 rounded-xl p-5 hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Truck className="w-8 h-8" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-bold text-xl mb-1">🚐 Van Weekly Calendar</h4>
                      <p className="text-sm text-blue-100">
                        {userRole === 'zonal_sales_manager' 
                          ? 'Submit weekly van routes and schedules'
                          : userRole === 'hq_command_center' || userRole === 'director'
                          ? 'View all van calendars and compliance reports'
                          : 'View van schedules and route planning'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-center px-4 py-2 bg-white/20 rounded-lg">
                        <div className="font-bold text-lg">19</div>
                        <div className="text-xs text-blue-100">Vans</div>
                      </div>
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Folders */}
            {foldersList.map(folder => {
              const isCollapsed = collapsedFolders[folder.id] !== false; // Default to collapsed (true)
              
              return (
                <div key={folder.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl overflow-hidden">
                  {/* Folder Header */}
                  <div className="w-full px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-900">{folder.name}</h3>
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold">
                        {folder.programs.length} {folder.programs.length === 1 ? 'Program' : 'Programs'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {canCreatePrograms && !selectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFolder(folder.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                          title="Remove folder (ungroup programs)"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                      
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-all"
                        title={isCollapsed ? 'Expand folder' : 'Collapse folder'}
                      >
                        <div className={`transform transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}>
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7-7-7 7" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Folder Content - Only show when expanded */}
                  {!isCollapsed && (
                    <div className="px-4 pb-4 space-y-3">
                      {folder.programs.map(program => renderProgramCard(program))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Standalone Programs */}
            {standalonePrograms.map(program => renderProgramCard(program))}
          </div>
        );
      })()}

      {/* Modals */}
      {showCreator && (
        <ProgramCreatorEnhanced
          onClose={() => {
            setShowCreator(false);
            setEditingProgram(null);
          }}
          onSuccess={() => {
            setShowCreator(false);
            setEditingProgram(null);
            loadPrograms();
          }}
          editingProgram={editingProgram}
        />
      )}

      {showExcelImporter && (
        <ProgramExcelImporter
          onClose={() => setShowExcelImporter(false)}
          onSuccess={() => {
            setShowExcelImporter(false);
            loadPrograms();
          }}
        />
      )}

      {showGFormsImporter && (
        <ProgramGFormsImporter
          onClose={() => setShowGFormsImporter(false)}
          onSuccess={() => {
            setShowGFormsImporter(false);
            loadPrograms();
          }}
        />
      )}

      {selectedProgramForSubmissions && (
        <ProgramSubmissions
          programId={selectedProgramForSubmissions.id}
          programTitle={selectedProgramForSubmissions.title}
          onClose={() => setSelectedProgramForSubmissions(null)}
        />
      )}

      {selectedProgramForAnalytics && (
        <ProgramAnalytics
          programId={selectedProgramForAnalytics.id}
          programTitle={selectedProgramForAnalytics.title}
          onClose={() => setSelectedProgramForAnalytics(null)}
        />
      )}

      {selectedProgramForDetails && (
        <ProgramDetails
          program={selectedProgramForDetails}
          userRole={userRole}
          onClose={() => setSelectedProgramForDetails(null)}
          onSubmit={() => {
            setSelectedProgramForSubmit(selectedProgramForDetails);
            setSelectedProgramForDetails(null);
          }}
          onEdit={canCreatePrograms ? () => {
            setEditingProgram(selectedProgramForDetails);
            setSelectedProgramForDetails(null);
            setShowCreator(true);
          } : undefined}
          onDelete={canCreatePrograms ? () => {
            handleDeleteProgram(selectedProgramForDetails.id, selectedProgramForDetails.title);
            setSelectedProgramForDetails(null);
          } : undefined}
        />
      )}

      {selectedProgramForSubmit && (
        selectedProgramForSubmit.linked_checkin_program_id ? (
          <LinkedCheckoutModal
            program={selectedProgramForSubmit}
            userId={JSON.parse(localStorage.getItem('tai_user') || '{}').id || ''}
            onClose={() => setSelectedProgramForSubmit(null)}
            onSuccess={() => {
              setSelectedProgramForSubmit(null);
              loadPrograms();
            }}
          />
        ) : (
          <ProgramSubmitModal
            program={selectedProgramForSubmit}
            userId={JSON.parse(localStorage.getItem('tai_user') || '{}').id || ''}
            onClose={() => setSelectedProgramForSubmit(null)}
            onSuccess={() => {
              setSelectedProgramForSubmit(null);
              loadPrograms();
            }}
          />
        )
      )}

      {/* Diagnostic Panel */}
      {showDiagnostics && (
        <DiagnosticPanel
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {/* Van Calendar View Modal */}
      {showVanCalendarViewModal && (
        <VanCalendarView
          programId="848582a6-29a9-4992-ae11-1f8397f198d9"
          onClose={() => setShowVanCalendarViewModal(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingProgramId && (() => {
        const program = programs.find(p => p.id === deletingProgramId);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Program?</h3>
                  <p className="text-gray-600">
                    Are you sure you want to delete <span className="font-semibold text-gray-900">"{program?.title}"</span>?
                  </p>
                </div>
              </div>

              {/* Submission Count Warning */}
              {submissionCount > 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                      <div className="font-semibold text-yellow-900 mb-1">
                        {submissionCount} Submission{submissionCount !== 1 ? 's' : ''} Found
                      </div>
                      <p className="text-sm text-yellow-800 mb-3">
                        This program has {submissionCount} submission{submissionCount !== 1 ? 's' : ''} from Sales Executives. 
                        What would you like to do with them?
                      </p>
                      
                      {/* Checkbox Options */}
                      <div className="space-y-2">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="deleteOption"
                            checked={!deleteSubmissions}
                            onChange={() => setDeleteSubmissions(false)}
                            className="mt-1 w-4 h-4 text-blue-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-blue-600">
                              Keep submissions (Recommended)
                            </div>
                            <div className="text-xs text-gray-600">
                              Submissions will remain in the database for historical records
                            </div>
                          </div>
                        </label>
                        
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="deleteOption"
                            checked={deleteSubmissions}
                            onChange={() => setDeleteSubmissions(true)}
                            className="mt-1 w-4 h-4 text-red-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-red-600">
                              Delete submissions too
                            </div>
                            <div className="text-xs text-gray-600">
                              All {submissionCount} submission{submissionCount !== 1 ? 's' : ''} will be permanently deleted
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">✅</div>
                    <div>
                      <div className="font-semibold text-green-900">No Submissions</div>
                      <p className="text-sm text-green-800">
                        This program has no submissions. Safe to delete.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800">
                  <span className="font-semibold">⚠️ Warning:</span> This action cannot be undone.
                  {deleteSubmissions && submissionCount > 0 && (
                    <span className="font-semibold"> All {submissionCount} submission{submissionCount !== 1 ? 's' : ''} will be permanently deleted.</span>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setDeletingProgramId(null);
                    setDeleteSubmissions(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log('[Programs] Deleting program:', deletingProgramId, 'Delete submissions:', deleteSubmissions);
                      
                      // Delete submissions if checkbox is checked
                      if (deleteSubmissions && submissionCount > 0) {
                        const { error: submissionsError } = await supabase
                          .from('submissions')
                          .delete()
                          .eq('program_id', deletingProgramId);
                        
                        if (submissionsError) {
                          console.error('[Programs] Error deleting submissions:', submissionsError);
                          throw new Error('Failed to delete submissions: ' + submissionsError.message);
                        }
                        console.log('[Programs] ✅ Deleted', submissionCount, 'submissions');
                      }
                      
                      // Delete program fields
                      const { error: fieldsError } = await supabase
                        .from('program_fields')
                        .delete()
                        .eq('program_id', deletingProgramId);
                      
                      if (fieldsError) {
                        console.error('[Programs] Error deleting program fields:', fieldsError);
                        // Don't throw - continue with program deletion
                      }
                      
                      // Delete the program
                      const { error: programError } = await supabase
                        .from('programs')
                        .delete()
                        .eq('id', deletingProgramId);
                      
                      if (programError) {
                        throw new Error('Failed to delete program: ' + programError.message);
                      }
                      
                      console.log('[Programs] ✅ Program deleted successfully');
                      alert(deleteSubmissions && submissionCount > 0 
                        ? `Program and ${submissionCount} submission${submissionCount !== 1 ? 's' : ''} deleted successfully!`
                        : 'Program deleted successfully!');
                      
                      // Clear all states and reload
                      setDeletingProgramId(null);
                      setDeleteSubmissions(false);
                      setSelectedProgramForDetails(null);
                      setSelectedProgramForSubmissions(null);
                      setSelectedProgramForAnalytics(null);
                      setSelectedProgramForSubmit(null);
                      
                      loadPrograms();
                    } catch (err: any) {
                      console.error('[Programs] Error during deletion:', err);
                      alert(err.message || 'Failed to delete program');
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  {deleteSubmissions && submissionCount > 0 
                    ? `Delete Program + ${submissionCount} Submission${submissionCount !== 1 ? 's' : ''}`
                    : 'Delete Program'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Folder Creation Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Folder className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Folder</h3>
                <p className="text-gray-600">
                  Merging {selectedPrograms.length} programs into a folder
                </p>
              </div>
            </div>

            {/* Folder Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && folderName.trim()) {
                    handleSaveFolder();
                  }
                }}
              />
            </div>

            {/* Selected Programs Preview */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Selected Programs ({selectedPrograms.length})
              </div>
              <div className="bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto">
                {selectedPrograms.map(progId => {
                  const prog = programs.find(p => p.id === progId);
                  return prog ? (
                    <div key={progId} className="flex items-center gap-2 py-1.5">
                      <Check className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">{prog.title}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setFolderName('');
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFolder}
                disabled={!folderName.trim()}
                className={`flex-1 px-6 py-3 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl ${
                  folderName.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VAN CALENDAR MODAL - Full Screen */}
      {showVanCalendar && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowVanCalendar(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold">
                    {userRole === 'zonal_sales_manager'
                      ? '🚐 Van Weekly Calendar - Submit Routes'
                      : userRole === 'hq_command_center' || userRole === 'director'
                      ? '🚐 Van Calendar - All Submissions'
                      : '🚐 Van Calendar'
                    }
                  </h2>
                  <p className="text-sm text-blue-100 mt-1">
                    {userRole === 'zonal_sales_manager'
                      ? 'Submit your weekly van routes'
                      : userRole === 'hq_command_center' || userRole === 'director'
                      ? 'View all van calendars and compliance'
                      : 'Van route planning and schedules'
                    }
                  </p>
                </div>
              </div>

              {/* View Tabs for HQ/Director */}
              {(userRole === 'hq_command_center' || userRole === 'director') && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setVanCalendarView('view')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      vanCalendarView === 'view'
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    👁️ View Plans
                  </button>
                  <button
                    onClick={() => setVanCalendarView('grid')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      vanCalendarView === 'grid'
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    📅 Calendar
                  </button>
                  <button
                    onClick={() => setVanCalendarView('compliance')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      vanCalendarView === 'compliance'
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    📊 Compliance
                  </button>
                </div>
              )}

              {/* View Plans button for ZSM */}
              {userRole === 'zonal_sales_manager' && (
                <div className="mt-4">
                  <button
                    onClick={() => setVanCalendarView('view')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      vanCalendarView === 'view'
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    👁️ View My Submitted Plans
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {vanCalendarView === 'form' && <VanCalendarForm />}
            {vanCalendarView === 'grid' && <VanCalendarGrid />}
            {vanCalendarView === 'compliance' && <VanCalendarCompliance />}
            {vanCalendarView === 'view' && (
              <VanCalendarView
                userRole={userRole}
                currentUser={currentUser}
                onClose={() => setVanCalendarView('form')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}