/**
 * TAI Programs API Client
 * 
 * Centralized API for all Programs operations.
 * This replaces direct Supabase calls with backend API routes.
 * 
 * Benefits:
 * - Backend handles permissions (service_role)
 * - Business logic centralized
 * - Easy to add validation, caching, rate limiting
 * - Can switch between KV store and tables without frontend changes
 */

import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { logPWAAction, ACTION_TYPES } from '../../lib/activity-tracker';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653`;

// Helper for API calls
async function apiCall(endpoint: string, options?: RequestInit) {
  const storedUser = localStorage.getItem('tai_user');
  const userId = storedUser ? JSON.parse(storedUser)?.id : null;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...(userId ? { 'X-User-Id': userId } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    
    // Enhanced error handling
    if (error.instructions) {
      console.error('[ProgramsAPI] Instructions:', error.instructions);
    }
    
    throw new Error(error.error || error.message || `API error: ${response.status}`);
  }

  return response.json();
}

export const programsAPI = {
  /**
   * List all programs for a specific user role
   * @param userRole - Role of the current user (sales_executive, director, etc.)
   * @param userId - ID of the current user
   * @returns Array of programs with submission status
   */
  async listPrograms(userRole: string, userId: string) {
    console.log('[ProgramsAPI] Fetching programs for role:', userRole, 'user:', userId);
    
    try {
      const data = await apiCall(`/programs?role=${encodeURIComponent(userRole)}&user_id=${encodeURIComponent(userId)}`);
      
      console.log('[ProgramsAPI] ✅ Loaded programs:', data.programs?.length || 0);
      
      return data;
    } catch (error: any) {
      console.error('[ProgramsAPI] ❌ Error loading programs:', error.message);
      
      // Check if it's a permission error
      if (error.message.includes('permission denied') || error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Database permission error. Please run /database/COMPLETE-PROGRAMS-FIX.sql in Supabase SQL Editor.');
      }
      
      throw error;
    }
  },

  /**
   * Get a single program with all its fields
   * @param programId - ID of the program
   * @returns Program object with fields array
   */
  async getProgram(programId: string) {
    console.log('[ProgramsAPI] Fetching program:', programId);
    
    const data = await apiCall(`/programs/${programId}`);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load program');
    }
    
    console.log('[ProgramsAPI] ✅ Loaded program:', data.program?.title, 'with', data.program?.fields?.length, 'fields');
    
    return data;
  },

  /**
   * Create a new program (HQ/Director only)
   * @param programData - Program creation data
   * @returns Created program object
   */
  async createProgram(programData: {
    title: string;
    description?: string;
    icon?: string;
    color?: string;
    points_value?: number;
    target_roles: string[];
    category?: string;
    created_by?: string;
    fields?: Array<{
      field_name: string;
      field_label: string;
      field_type: string;
      is_required?: boolean;
      placeholder?: string;
      help_text?: string;
      options?: string[];
      validation?: any;
    }>;
  }) {
    console.log('[ProgramsAPI] Creating program:', programData.title);
    
    const data = await apiCall('/programs', {
      method: 'POST',
      body: JSON.stringify(programData),
    });
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create program');
    }
    
    console.log('[ProgramsAPI] ✅ Program created:', data.program?.id);
    
    return data;
  },

  /**
   * Submit a response to a program (SE/ZSM/ZBM)
   * @param programId - ID of the program
   * @param submissionData - Submission data
   * @returns Submission object with points info
   */
  async submitResponse(programId: string, submissionData: {
    user_id: string;
    responses: Record<string, any>;
    gps_location?: { lat: number; lng: number };
    photos?: string[];
  }) {
    console.log('[ProgramsAPI] Submitting response to program:', programId);
    
    const data = await apiCall(`/programs/${programId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to submit response');
    }
    
    console.log('[ProgramsAPI] ✅ Submission created:', data.submission?.id, 'Points pending:', data.points_pending);
    
    // Track submission activity
    logPWAAction(ACTION_TYPES.SUBMISSION_CREATE, {
      programId,
      submissionId: data.submission?.id,
      pointsPending: data.points_pending,
    });
    
    return data;
  },

  /**
   * Get all submissions for a program
   * @param programId - ID of the program
   * @param status - Optional status filter (pending, approved, rejected)
   * @returns Array of submissions
   */
  async getSubmissions(programId: string, status?: 'pending' | 'approved' | 'rejected') {
    console.log('[ProgramsAPI] Fetching submissions for program:', programId, status ? `(status: ${status})` : '');
    
    const endpoint = status 
      ? `/programs/${programId}/submissions?status=${status}`
      : `/programs/${programId}/submissions`;
    
    const data = await apiCall(endpoint);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load submissions');
    }
    
    console.log('[ProgramsAPI] ✅ Loaded submissions:', data.submissions?.length || 0);
    
    return data;
  },

  /**
   * Upload a photo for a program submission
   * @param file - Photo file
   * @param userId - ID of the user uploading
   * @param programId - ID of the program
   * @returns Upload result with URL
   */
  async uploadPhoto(file: File, userId: string, programId: string) {
    console.log('[ProgramsAPI] Uploading photo for program:', programId);
    
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('user_id', userId);
    formData.append('program_id', programId);
    
    const response = await fetch(`${API_BASE}/programs/upload-photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Failed to upload photo');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to upload photo');
    }
    
    console.log('[ProgramsAPI] ✅ Photo uploaded:', data.path);
    
    return data;
  },

  /**
   * Get signed URLs for photo paths (for viewing)
   * @param paths - Array of photo paths
   * @returns Array of signed URLs
   */
  async getSignedUrls(paths: string[]) {
    console.log('[ProgramsAPI] Getting signed URLs for', paths.length, 'photos');
    
    const data = await apiCall('/programs/get-signed-urls', {
      method: 'POST',
      body: JSON.stringify({ paths }),
    });
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get signed URLs');
    }
    
    console.log('[ProgramsAPI] ✅ Generated', data.urls?.length || 0, 'signed URLs');
    
    return data;
  },

  /**
   * Get analytics for a program (Director/HQ)
   * This endpoint needs to be implemented in backend
   * @param programId - ID of the program
   * @returns Analytics data
   */
  async getProgramAnalytics(programId: string) {
    console.log('[ProgramsAPI] Fetching analytics for program:', programId);
    
    // First, get all submissions
    const { submissions } = await this.getSubmissions(programId);
    
    // Calculate analytics client-side for now
    const totalSubmissions = submissions?.length || 0;
    const approvedSubmissions = submissions?.filter((s: any) => s.status === 'approved').length || 0;
    const pendingSubmissions = submissions?.filter((s: any) => s.status === 'pending').length || 0;
    const rejectedSubmissions = submissions?.filter((s: any) => s.status === 'rejected').length || 0;
    
    // Count unique users
    const uniqueUsers = new Set(submissions?.map((s: any) => s.user_id)).size;
    
    // Calculate response breakdown by field
    const responseBreakdown: Record<string, Record<string, number>> = {};
    
    submissions?.forEach((submission: any) => {
      if (submission.responses) {
        Object.entries(submission.responses).forEach(([field, value]: [string, any]) => {
          if (!responseBreakdown[field]) {
            responseBreakdown[field] = {};
          }
          
          const valueStr = String(value);
          responseBreakdown[field][valueStr] = (responseBreakdown[field][valueStr] || 0) + 1;
        });
      }
    });
    
    console.log('[ProgramsAPI] ✅ Analytics calculated:', totalSubmissions, 'submissions,', uniqueUsers, 'users');
    
    return {
      success: true,
      analytics: {
        totalSubmissions,
        approvedSubmissions,
        pendingSubmissions,
        rejectedSubmissions,
        uniqueUsers,
        responseBreakdown,
        submissionsByDay: this._groupSubmissionsByDay(submissions || []),
      },
    };
  },

  /**
   * Helper: Group submissions by day
   * @private
   */
  _groupSubmissionsByDay(submissions: any[]) {
    const byDay: Record<string, number> = {};
    
    submissions.forEach(submission => {
      const day = new Date(submission.submitted_at || submission.created_at).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });
    
    return byDay;
  },

  /**
   * Get submissions with hierarchical filtering
   * ZSM sees only their zone's SEs, ZBM sees their zone's SEs, etc.
   * 
   * @param programId - ID of the program
   * @param currentUser - Current user object with role and zone info
   * @returns Filtered submissions
   */
  async getFilteredSubmissions(programId: string, currentUser: {
    id: string;
    role: string;
    zone?: string;
    region?: string;
  }) {
    console.log('[ProgramsAPI] Fetching filtered submissions for:', currentUser.role, currentUser.zone);
    
    // Get all submissions
    const { submissions } = await this.getSubmissions(programId);
    
    // If Director or HQ, return all
    if (currentUser.role === 'director' || currentUser.role === 'hq_command_center' || currentUser.role === 'hq_staff') {
      console.log('[ProgramsAPI] ✅ Returning all submissions (Director/HQ access)');
      return { success: true, submissions };
    }
    
    // If ZBM or ZSM, filter by zone/region
    // This logic needs to be enhanced based on your hierarchy
    // For now, return all (implement filtering in backend for better performance)
    
    console.log('[ProgramsAPI] ⚠ Hierarchical filtering not yet implemented, returning all');
    
    return { success: true, submissions };
  },

  // ============================================
  // SESSION CHECK-IN API
  // ============================================

  /**
   * Get or create today's check-in session for a program
   */
  async getCheckinSession(programId: string) {
    console.log('[ProgramsAPI] Getting check-in session for program:', programId);
    const data = await apiCall(`/programs/${programId}/checkin/open`);
    return data;
  },

  /**
   * Save session data (sites, promoters, GAs)
   */
  async saveCheckinSession(programId: string, sessionData: {
    session_id: string;
    sites: any[];
    promoters: any[];
    total_gas: number;
  }) {
    console.log('[ProgramsAPI] Saving check-in session:', sessionData.session_id);
    const data = await apiCall(`/programs/${programId}/checkin/save`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
    return data;
  },

  /**
   * Close a check-in session (after 6 PM EAT)
   */
  async closeCheckinSession(programId: string, sessionData: {
    session_id: string;
    sites: any[];
    promoters: any[];
    total_gas: number;
  }) {
    console.log('[ProgramsAPI] Closing check-in session:', sessionData.session_id);
    const data = await apiCall(`/programs/${programId}/checkin/close`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
    return data;
  },

  /**
   * List all check-in sessions for a program (HQ/Director reporting)
   */
  async listCheckinSessions(programId: string, status?: 'open' | 'closed') {
    console.log('[ProgramsAPI] Listing check-in sessions for program:', programId);
    const endpoint = status
      ? `/programs/${programId}/checkin/sessions?status=${status}`
      : `/programs/${programId}/checkin/sessions`;
    const data = await apiCall(endpoint);
    return data;
  },

  /**
   * Get all session checkin flags (which programs have session_checkin_enabled)
   * Stored in the make-server KV store (not a DB column)
   */
  async getCheckinFlags(): Promise<Record<string, boolean>> {
    try {
      console.log('[ProgramsAPI] Fetching session checkin flags');
      const data = await apiCall('/checkin/flags');
      console.log('[ProgramsAPI] ✅ Checkin flags:', data.flags);
      return data.flags || {};
    } catch (err: any) {
      console.error('[ProgramsAPI] Error fetching checkin flags:', err);
      return {};
    }
  },

  /**
   * Set the session_checkin_enabled flag for a program
   * @param programId - Program ID
   * @param enabled - Whether session checkin is enabled
   */
  async setCheckinFlag(programId: string, enabled: boolean) {
    console.log('[ProgramsAPI] Setting checkin flag for program:', programId, '→', enabled);
    const data = await apiCall(`/checkin/flag/${programId}`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
    console.log('[ProgramsAPI] ✅ Checkin flag saved:', data);
    return data;
  },

  /**
   * Get the full form config for a specific program
   */
  async getProgramFormConfig(programId: string): Promise<Record<string, any>> {
    try {
      console.log('[ProgramsAPI] Fetching form config for program:', programId);
      const data = await apiCall(`/checkin/config/${programId}`);
      console.log('[ProgramsAPI] ✅ Form config:', data.config);
      return data.config || {};
    } catch (err: any) {
      console.error('[ProgramsAPI] Error fetching form config:', err);
      return {};
    }
  },

  /**
   * Save the full form config for a program
   */
  async saveProgramFormConfig(programId: string, config: Record<string, any>) {
    console.log('[ProgramsAPI] Saving form config for program:', programId, '→', config);
    const data = await apiCall(`/checkin/config/${programId}`, {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
    console.log('[ProgramsAPI] ✅ Form config saved:', data);
    return data;
  },

  /**
   * Get all program form configs (for HQ settings overview)
   */
  async getAllProgramFormConfigs(): Promise<Record<string, any>> {
    try {
      console.log('[ProgramsAPI] Fetching all program form configs');
      const data = await apiCall('/checkin/configs');
      console.log('[ProgramsAPI] ✅ All form configs:', Object.keys(data.configs || {}).length);
      return data.configs || {};
    } catch (err: any) {
      console.error('[ProgramsAPI] Error fetching all form configs:', err);
      return {};
    }
  },
};

export default programsAPI;