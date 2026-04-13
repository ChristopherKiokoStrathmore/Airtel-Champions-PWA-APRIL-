/**
 * API Helper - Centralized fetch wrapper for make-server calls
 * Automatically includes X-User-Id header from localStorage (direct DB auth mode)
 */
import { projectId, publicAnonKey } from './supabase/info';

export const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653`;

/** Get current user ID from localStorage */
function getCurrentUserId(): string | null {
  try {
    const stored = localStorage.getItem('tai_user');
    if (stored) {
      const user = JSON.parse(stored);
      return user?.id || null;
    }
  } catch (e) {
    console.error('[API Helper] Failed to get user from localStorage:', e);
  }
  return null;
}

/** Build headers with X-User-Id for direct DB auth */
export function getAuthHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${publicAnonKey}`,
    ...extraHeaders,
  };

  const userId = getCurrentUserId();
  if (userId) {
    headers['X-User-Id'] = userId;
  }

  return headers;
}

/** Wrapper for fetch that auto-includes auth headers */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const userId = getCurrentUserId();
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${publicAnonKey}`,
    ...(options?.headers as Record<string, string> || {}),
  };

  if (userId) {
    headers['X-User-Id'] = userId;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/** Full API call helper with JSON parsing and error handling */
export async function apiCall(endpoint: string, options?: RequestInit) {
  const response = await apiFetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `API error: ${response.status}`);
  }

  return response.json();
}
