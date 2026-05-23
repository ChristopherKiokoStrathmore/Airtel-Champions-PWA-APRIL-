/**
 * Network Utilities for Airtel Champions
 * Provides robust fetch wrapper with timeout, retry, and error handling
 * Optimized for 2G/3G networks in Kenya
 */

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Fetch with timeout support
 * Critical for 2G/3G networks where requests can hang indefinitely
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
  timeout: number = 30000 // 30 seconds default
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection and try again');
    }

    // Network error (offline, DNS failure, etc)
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error('Network error - please check your internet connection');
    }

    throw error;
  }
}

/**
 * Fetch with automatic retry for failed requests
 * Useful for unreliable 2G/3G networks
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 30000,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions, timeout);

      // If response is ok, return it
      if (response.ok) {
        return response;
      }

      // Server error (5xx) - retry
      if (response.status >= 500 && attempt < retries) {
        console.warn(`[Network] Server error ${response.status}, retrying... (${attempt + 1}/${retries})`);
        await delay(retryDelay * (attempt + 1)); // Exponential backoff
        continue;
      }

      // Client error (4xx) - don't retry, return response
      return response;

    } catch (error: any) {
      lastError = error;

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }

      console.warn(`[Network] Request failed, retrying... (${attempt + 1}/${retries})`, error.message);
      await delay(retryDelay * (attempt + 1)); // Exponential backoff
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Safe JSON parse with error handling
 */
export async function safeJsonParse<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('[Network] JSON parse error:', error);
    return null;
  }
}

/**
 * Helper to delay execution (for retry logic)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if network is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Get network information (if available)
 */
export function getNetworkInfo(): {
  online: boolean;
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
} {
  const online = isOnline();

  // Check for Network Information API (may not be available on all devices)
  if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      online,
      type: connection.type,
      effectiveType: connection.effectiveType, // 'slow-2g', '2g', '3g', '4g'
      downlink: connection.downlink, // Mbps
      rtt: connection.rtt, // Round trip time in ms
    };
  }

  return { online };
}

/**
 * Check if network is slow (2G/3G)
 */
export function isSlowNetwork(): boolean {
  const info = getNetworkInfo();
  
  if (!info.online) return true;
  
  if (info.effectiveType) {
    return info.effectiveType === 'slow-2g' || info.effectiveType === '2g' || info.effectiveType === '3g';
  }
  
  // If RTT is high (>1000ms), consider it slow
  if (info.rtt && info.rtt > 1000) {
    return true;
  }
  
  return false;
}

/**
 * API helper with all error handling, timeout, and retry logic
 */
export async function apiRequest<T>(
  url: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    // Check if online first
    if (!isOnline()) {
      return {
        data: null,
        error: 'You are offline. Please check your internet connection.',
      };
    }

    // Adjust timeout based on network speed
    const networkInfo = getNetworkInfo();
    const timeout = isSlowNetwork() ? 45000 : 30000; // 45s for slow networks, 30s for fast

    const response = await fetchWithRetry(url, {
      ...options,
      timeout,
      retries: 2,
    });

    if (!response.ok) {
      const errorData = await safeJsonParse<{ error?: string; message?: string }>(response);
      return {
        data: null,
        error: errorData?.error || errorData?.message || `Request failed with status ${response.status}`,
      };
    }

    const data = await safeJsonParse<T>(response);
    return { data, error: null };

  } catch (error: any) {
    console.error('[Network] API request failed:', error);
    return {
      data: null,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  url: string,
  body: any,
  additionalOptions: FetchOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  return apiRequest<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...additionalOptions.headers,
    },
    body: JSON.stringify(body),
    ...additionalOptions,
  });
}

/**
 * GET request helper
 */
export async function apiGet<T>(
  url: string,
  additionalOptions: FetchOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  return apiRequest<T>(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...additionalOptions.headers,
    },
    ...additionalOptions,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(
  url: string,
  additionalOptions: FetchOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  return apiRequest<T>(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...additionalOptions.headers,
    },
    ...additionalOptions,
  });
}
