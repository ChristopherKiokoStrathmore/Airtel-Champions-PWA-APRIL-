/**
 * Platform Detection Utility
 * Detects if app is running on mobile (Capacitor) or web browser
 */

import { Capacitor } from '@capacitor/core';

export const Platform = {
  // Core platform detection
  isMobile: Capacitor.isNativePlatform(),
  isWeb: !Capacitor.isNativePlatform(),
  isAndroid: Capacitor.getPlatform() === 'android',
  isIOS: Capacitor.getPlatform() === 'ios',
  
  // Feature detection
  hasNativeGPS: Capacitor.isNativePlatform(),
  hasNativeCamera: Capacitor.isNativePlatform(),
  canUseBackgroundSync: Capacitor.isNativePlatform(),
  canUsePushNotifications: Capacitor.isNativePlatform(),
  
  // Platform info
  getPlatform: () => Capacitor.getPlatform(),
  isNative: () => Capacitor.isNativePlatform(),
  
  // Web capabilities
  supportsWebRTC: typeof RTCPeerConnection !== 'undefined',
  supportsServiceWorker: 'serviceWorker' in navigator,
  supportsIndexedDB: 'indexedDB' in window,
};

/**
 * Check if user should see web interface
 * Web interface is for HQ Staff and Directors
 */
export function shouldUseWebInterface(userRole?: string): boolean {
  // If on mobile app, never use web interface
  if (Platform.isMobile) {
    return false;
  }
  
  // If on web, check if user role allows web access
  if (Platform.isWeb) {
    const webEnabledRoles = ['hq_staff', 'director', 'developer'];
    return userRole ? webEnabledRoles.includes(userRole) : false;
  }
  
  return false;
}

/**
 * Get optimal layout mode based on platform and screen size
 */
export function getLayoutMode(): 'mobile' | 'desktop' {
  // Check if forced via localStorage (for developer testing)
  const forcedMode = localStorage.getItem('force_layout_mode');
  if (forcedMode === 'mobile' || forcedMode === 'desktop') {
    return forcedMode;
  }
  
  // Auto-detect based on platform
  if (Platform.isMobile) {
    return 'mobile';
  }
  
  // For web, check screen size
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 768 ? 'desktop' : 'mobile';
  }
  
  return 'mobile';
}

/**
 * Force layout mode (for developer testing)
 */
export function setLayoutMode(mode: 'mobile' | 'desktop' | 'auto') {
  if (mode === 'auto') {
    localStorage.removeItem('force_layout_mode');
  } else {
    localStorage.setItem('force_layout_mode', mode);
  }
  window.location.reload();
}

console.log('[Platform] Detected:', {
  platform: Platform.getPlatform(),
  isMobile: Platform.isMobile,
  isWeb: Platform.isWeb,
  layoutMode: getLayoutMode(),
});
