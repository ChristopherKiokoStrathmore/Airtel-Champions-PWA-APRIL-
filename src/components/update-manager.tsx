import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase-direct';
import { Download, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Capacitor imports — only available inside APK, safely skip on web
let CapacitorUpdater: any = null;
let CapApp: any = null;
const isCapacitorAvailable = typeof window !== 'undefined' && !!(window as any).Capacitor;
if (isCapacitorAvailable) {
  try {
    import('@capgo/capacitor-updater').then(mod => { CapacitorUpdater = mod.CapacitorUpdater; }).catch(() => {});
    import('@capacitor/app').then(mod => { CapApp = mod.App; }).catch(() => {});
  } catch {}
}

// Define the current version of the app
// IMPORTANT: Update this version when deploying a new APK manually
const CURRENT_VERSION = '1.0.1'; // Zone filtering OTA fix - dependency array + userZone guard

interface AppVersion {
  id: string;
  version: string;
  bundle_url: string;
  release_notes: string;
  is_mandatory: boolean;
  created_at: string;
}

export function UpdateManager() {
  const [updateAvailable, setUpdateAvailable] = useState<AppVersion | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [readyToInstall, setReadyToInstall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Skip entirely on web — OTA updates only work inside Capacitor
    if (!isCapacitorAvailable) {
      console.log('[UpdateManager] Not running in Capacitor, skipping OTA update checks entirely');
      return;
    }

    // Use a ref to track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    let listeners: any[] = [];

    const setupListeners = async () => {
      try {
        // Only setup listeners if running in Capacitor
        if (!isCapacitorAvailable || !CapacitorUpdater) {
          console.log('Not running in Capacitor, skipping update listener setup');
          return;
        }

        const l1 = await CapacitorUpdater.addListener('download', (info: any) => {
          if (isMounted) {
            console.log('Download progress:', info.percent);
            setProgress(Math.round(info.percent));
          }
        });
        
        const l2 = await CapacitorUpdater.addListener('noNeedUpdate', () => {
          if (isMounted) {
            console.log('No update needed');
            setUpdateAvailable(null);
          }
        });
        
        const l3 = await CapacitorUpdater.addListener('updateAvailable', (info: any) => {
          if (isMounted) console.log('Update available:', info);
        });

        // Store listeners for cleanup
        listeners = [l1, l2, l3];
        
        // Only check for updates after listeners are set up
        if (isMounted) checkForUpdates();
      } catch (err) {
        console.error('Failed to setup listeners:', err);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      // Safer cleanup: check if listener exists and has remove method
      if (listeners && listeners.length > 0) {
        listeners.forEach(l => {
          try {
            if (l && typeof l.remove === 'function') {
              l.remove().catch((e: any) => console.warn('Error removing listener:', e));
            }
          } catch (e) {
            // Ignore removal errors
          }
        });
      }
    };
  }, []);

  const checkForUpdates = async () => {
    // Double-check: skip on web — OTA updates only matter inside Capacitor APK
    if (!isCapacitorAvailable) return;

    try {
      // 1. Check Supabase for the latest version
      // Use .maybeSingle() instead of .single() to avoid 406 when table is empty or missing
      const { data: latestVersion, error } = await supabase
        .from('app_versions')
        .select('*')
        .order('created_at', { ascending: false }) // Get the most recent
        .limit(1)
        .maybeSingle();

      if (error) {
        // Ignore "no rows found" (PGRST116) AND "relation does not exist" (42P01)
        // 42P01 happens when the table hasn't been created yet
        if (error.code !== 'PGRST116' && error.code !== '42P01' && !error.message?.includes('app_versions')) {
          // Only log non-network errors — network drops are expected on mobile
          if (!/failed to fetch|network/i.test(error.message || '')) {
            console.warn('Update check skipped:', error.code || error.message);
          }
        }
        return;
      }

      if (!latestVersion) return;

      console.log(`Current version: ${CURRENT_VERSION}, Latest: ${latestVersion.version}`);

      // 2. Compare versions (simple string comparison for now, can be improved with semver)
      if (isNewerVersion(latestVersion.version, CURRENT_VERSION)) {
        console.log('New update found:', latestVersion);
        setUpdateAvailable(latestVersion);
        setShowModal(true);
        
        // Notify Capacitor Updater about the update so it can manage it internally
        try {
          if (CapacitorUpdater) await CapacitorUpdater.notifyAppReady();
        } catch (e) {
          // Ignore error if not running in Capacitor
          console.log('Not running in Capacitor or plugin not installed');
        }
      }
    } catch (err: any) {
      // Silently swallow ALL errors — update check is non-critical
      // Only log non-network errors to reduce console noise on flaky connections
      if (!/failed to fetch|network/i.test(err?.message || '')) {
        console.warn('Update check skipped:', err?.message || 'unknown error');
      }
    }
  };

  const isNewerVersion = (newVer: string, currentVer: string) => {
    // Simple semver comparison
    const v1 = newVer.split('.').map(Number);
    const v2 = currentVer.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num1 > num2) return true;
      if (num1 < num2) return false;
    }
    return false;
  };

  const handleDownload = async () => {
    if (!updateAvailable) return;

    try {
      setDownloading(true);
      setError(null);

      console.log('Starting download for version:', updateAvailable.version);

      // Trigger download via Capacitor Updater
      // The plugin handles the download to the native filesystem
      if (!CapacitorUpdater) {
        setError('Updates only work in the mobile app.');
        setDownloading(false);
        return;
      }
      const version = await CapacitorUpdater.download({
        url: updateAvailable.bundle_url,
        version: updateAvailable.version,
      });

      console.log('Download complete:', version);
      setReadyToInstall(true);
      setDownloading(false);
      toast.success('Update downloaded successfully!');
      
    } catch (err: any) {
      console.error('Download failed:', err);
      setError(err.message || 'Failed to download update');
      setDownloading(false);
      
      // Fallback: If not in Capacitor, maybe just link to the web version?
      if (!window.Capacitor) {
        setError('Updates only work in the mobile app.');
      }
    }
  };

  const handleInstall = async () => {
    if (!updateAvailable) return;

    try {
      if (!CapacitorUpdater) {
        setError('Updates only work in the mobile app.');
        return;
      }
      // Install and reload the app
      await CapacitorUpdater.set({
        id: updateAvailable.version,
      });
      
      // The app should reload automatically, but just in case:
      window.location.reload();
      
    } catch (err: any) {
      console.error('Install failed:', err);
      setError('Failed to install update. Please try restarting the app.');
    }
  };

  if (!showModal || !updateAvailable) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative">
          {!updateAvailable.is_mandatory && !downloading && (
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <RefreshCw className={`w-8 h-8 text-white ${downloading ? 'animate-spin' : ''}`} />
          </div>
          
          <h3 className="text-xl font-bold">New Update Available!</h3>
          <p className="text-blue-100 text-sm mt-1">v{CURRENT_VERSION} → v{updateAvailable.version}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">What's New</h4>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 max-h-32 overflow-y-auto">
              {updateAvailable.release_notes || 'Bug fixes and performance improvements.'}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {readyToInstall ? (
              <button
                onClick={handleInstall}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200"
              >
                <RefreshCw className="w-5 h-5" />
                Install & Restart
              </button>
            ) : downloading ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Downloading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-400 mt-2">Please check your internet connection</p>
              </div>
            ) : (
              <button
                onClick={handleDownload}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                <Download className="w-5 h-5" />
                Download Update
              </button>
            )}

            {!updateAvailable.is_mandatory && !downloading && (
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
              >
                Remind me later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}