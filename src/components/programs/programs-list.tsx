import { useState, useEffect } from 'react';
import { programsAPI, initializeSampleProgram, supabase } from '../../utils/supabase-direct';
import { ChevronRight, ChevronLeft, Truck } from 'lucide-react';
import { ProgramSubmitModal } from './program-submit-modal';
import { SubmissionSuccessModal } from './submission-success-modal';
import { SetupInstructions } from '../setup-instructions';
import { usePageTracking } from '../../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../../utils/analytics';
import VanCalendarForm from '../van-calendar-form';
import VanCalendarGrid from '../van-calendar-grid';
import VanCalendarCompliance from '../van-calendar-compliance';

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
}

interface ProgramSubmission {
  program_id: string;
  count: number;
}

export function ProgramsList({ onBack, onPointsUpdated }: { onBack?: () => void; onPointsUpdated?: () => void }) {
  // Track page view automatically
  usePageTracking(ANALYTICS_PAGES.PROGRAMS);
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [submissions, setSubmissions] = useState<ProgramSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [setupError, setSetupError] = useState<{ error: string; code?: string } | null>(null);
  const [attemptingAutoFix, setAttemptingAutoFix] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{ points: number; newTotal: number; programTitle: string; submissionDetails?: any } | null>(null);
  const [showVanCalendar, setShowVanCalendar] = useState(false);
  const [vanCalendarView, setVanCalendarView] = useState<'form' | 'grid' | 'compliance'>('form');
  const [vanCalendarEnabled, setVanCalendarEnabled] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    loadData();
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
        console.log('[Programs List] ℹ️ Van Calendar setting not found, defaulting to enabled');
        setVanCalendarEnabled(true);
        return;
      }

      if (data) {
        const enabled = data.value === 'true' || data.value === true;
        console.log('[Programs List] ✅ Van Calendar enabled:', enabled);
        setVanCalendarEnabled(enabled);
      } else {
        setVanCalendarEnabled(true);
      }
    } catch (err) {
      console.error('[Programs List] ❌ Error checking Van Calendar settings:', err);
      setVanCalendarEnabled(true);
    }
  };

  const loadData = async () => {
    try {
      // Get user from localStorage (TAI uses custom auth)
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
        console.error('[ProgramsList] No user in localStorage');
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);
      console.log('[ProgramsList] User from localStorage:', user);
      
      if (!user.id) {
        console.error('[ProgramsList] User has no ID');
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setUserRole(user.role || ''); // Capture user role for Van Calendar

      console.log('[ProgramsList] Fetching programs for role:', user.role);

      // 🎯 NEW: Direct Supabase access (no Edge Function!)
      // Initialize sample program if needed
      await initializeSampleProgram();
      
      // Fetch programs directly from database
      const activePrograms = await programsAPI.getPrograms(user.role);
      
      console.log('[ProgramsList] ✅ Received programs:', activePrograms.length);
      if (activePrograms.length > 0) {
        console.log('[ProgramsList] First program:', {
          title: activePrograms[0].title,
          target_roles: activePrograms[0].target_roles,
          user_role: user.role,
        });
      } else {
        console.warn('[ProgramsList] ⚠️ No programs found for role:', user.role);
      }
      
      setPrograms(activePrograms);

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

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 rounded-xl p-4 h-20 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
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

        {/* Programs List */}
        {programs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No active programs available</p>
            <p className="text-xs text-gray-500 mt-1">Check back later for new opportunities</p>
          </div>
        ) : (
          <>
            {/* ⚠️ OLD VAN CALENDAR CARD - DISABLED (Now using Van Calendar as a Program)
                After running VAN_CALENDAR_PROGRAM_MIGRATION.sql, Van Calendar appears as a normal program card below.
                This old standalone card is no longer needed.
            */}
            {false && vanCalendarEnabled && (
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
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-700 rounded-xl p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] mb-4"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-lg mb-1">🚐 Van Weekly Calendar</h4>
                    <p className="text-xs text-blue-100">
                      {userRole === 'zonal_sales_manager' 
                        ? 'Submit weekly van routes and schedules'
                        : userRole === 'hq_command_center' || userRole === 'director'
                        ? 'View all van calendars and compliance'
                        : 'View van schedules and route planning'
                      }
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 flex-shrink-0" />
                </div>
              </button>
            )}

            {/* Regular Programs */}
            {programs.map((program) => {
            const count = getSubmissionCount(program.id);
            const colorClasses = getColorClasses(program.color);

            return (
              <button
                key={program.id}
                onClick={() => setSelectedProgram(program)}
                className={`w-full ${colorClasses} border rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="text-4xl flex-shrink-0">
                    {program.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-lg mb-1">{program.title}</h4>
                    <p className="text-sm opacity-80">
                      {count} submission{count !== 1 ? 's' : ''} made
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-6 h-6 flex-shrink-0 opacity-60" />
                </div>
              </button>
            );
          })}
          </>
        )}
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

      {/* Setup Instructions Modal */}
      {setupError && (
        <SetupInstructions
          error={setupError.error}
          code={setupError.code}
        />
      )}

      {/* VAN CALENDAR MODAL - Full Screen */}
      {showVanCalendar && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 shadow-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVanCalendar(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {userRole === 'zonal_sales_manager'
                    ? '🚐 Van Weekly Calendar - Submit Routes'
                    : userRole === 'hq_command_center' || userRole === 'director'
                    ? '🚐 Van Calendar - All Submissions'
                    : '🚐 Van Calendar'
                  }
                </h2>
                <p className="text-xs text-blue-100 mt-1">
                  {userRole === 'zonal_sales_manager'
                    ? 'Submit your weekly van routes'
                    : userRole === 'hq_command_center' || userRole === 'director'
                    ? 'View all van calendars and compliance'
                    : 'Van route planning and schedules'
                  }
                </p>
              </div>

              {/* View Tabs for HQ/Director */}
              {(userRole === 'hq_command_center' || userRole === 'director') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setVanCalendarView('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      vanCalendarView === 'grid'
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    📅 Calendar
                  </button>
                  <button
                    onClick={() => setVanCalendarView('compliance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      vanCalendarView === 'compliance'
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    📊 Compliance
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
          </div>
        </div>
      )}
    </>
  );
}