import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { Trophy, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';

interface Program {
  id: string;
  title: string;
  description: string;
  points_value: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  total_submissions: number;
  user_submission_count: number;
  submitted_today: boolean;
}

interface ProgramListProps {
  onStartProgram: (programId: string) => void;
}

export function ProgramList({ onStartProgram }: ProgramListProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      // ✅ BYPASS EDGE FUNCTION - Fetch directly from database
      console.log('[ProgramList] Loading programs from database...');
      
      // Get current user's role from localStorage
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
        throw new Error('Not logged in');
      }
      
      const user = JSON.parse(storedUser);
      const userRole = user.role || 'sales_executive';
      
      console.log('[ProgramList] User role:', userRole);
      
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active')
        .contains('target_roles', [userRole])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ProgramList] Database error:', error);
        throw new Error(error.message || 'Failed to load programs');
      }

      console.log('[ProgramList] ✅ Loaded programs:', data?.length || 0);
      setPrograms(data || []);
    } catch (err: any) {
      console.error('[Programs] Error loading programs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">🎯 Active Programs</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-sm text-red-800">Failed to load programs: {error}</p>
        <button
          onClick={loadPrograms}
          className="mt-3 text-sm text-red-600 hover:text-red-700 font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <p className="text-gray-600">📋 No active programs available</p>
        <p className="text-sm text-gray-500 mt-1">Check back later for new missions!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">🎯 Active Programs ({programs.length})</h3>
      </div>

      <div className="space-y-3">
        {programs.map(program => {
          const daysRemaining = getDaysRemaining(program.end_date);
          const isUrgent = daysRemaining !== null && daysRemaining <= 2;

          return (
            <div
              key={program.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => onStartProgram(program.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">
                    📋 {program.title}
                  </h4>
                  {program.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {program.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-center">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      <span className="font-bold">{program.points_value}</span>
                    </div>
                    <div className="text-xs opacity-75">points</div>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center gap-4 mb-4">
                {program.submitted_today ? (
                  <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Submitted Today</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-orange-600 text-sm font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>Not Submitted</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{program.total_submissions} submissions</span>
                </div>

                {daysRemaining !== null && (
                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                    <Clock className="w-4 h-4" />
                    <span>
                      {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ends today!'}
                    </span>
                  </div>
                )}
              </div>

              {/* User Progress */}
              {program.user_submission_count > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4">
                  <p className="text-sm text-blue-800">
                    🎯 You've submitted <span className="font-bold">{program.user_submission_count}</span> time
                    {program.user_submission_count !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartProgram(program.id);
                }}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                  program.submitted_today
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg'
                }`}
              >
                {program.submitted_today ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Again ({program.points_value} pts)
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    Start Program ({program.points_value} pts)
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}