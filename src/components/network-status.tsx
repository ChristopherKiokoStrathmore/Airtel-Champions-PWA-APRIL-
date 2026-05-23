import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal, CloudOff, RefreshCw } from 'lucide-react';
import { OfflineManager } from '../utils/offline-manager';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState<string>('unknown');
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
      setNetworkQuality(OfflineManager.getNetworkQuality());
      setQueuedCount(OfflineManager.getQueue().length);
    };

    updateStatus();

    // Setup offline manager listeners
    OfflineManager.setupListeners(
      () => {
        setIsOnline(true);
        updateStatus();
      },
      () => {
        setIsOnline(false);
        updateStatus();
      }
    );

    // Listen for queue updates
    const handleQueueUpdate = (e: any) => {
      setQueuedCount(e.detail.count);
    };

    const handleSyncStarted = () => {
      setSyncing(true);
      setSyncResult(null);
    };

    const handleSyncCompleted = (e: any) => {
      setSyncing(false);
      setSyncResult({
        success: e.detail.success,
        failed: e.detail.failed,
      });
      
      // Clear sync result after 3 seconds
      setTimeout(() => setSyncResult(null), 3000);
    };

    window.addEventListener('offline-queue-updated', handleQueueUpdate);
    window.addEventListener('offline-sync-started', handleSyncStarted);
    window.addEventListener('offline-sync-completed', handleSyncCompleted);

    // Update periodically
    const interval = setInterval(updateStatus, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('offline-queue-updated', handleQueueUpdate);
      window.removeEventListener('offline-sync-started', handleSyncStarted);
      window.removeEventListener('offline-sync-completed', handleSyncCompleted);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncing) return;
    await OfflineManager.syncQueue();
  };

  const getNetworkIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (networkQuality === '2g' || networkQuality === '3g') {
      return <Signal className="w-4 h-4" />;
    }
    return <Wifi className="w-4 h-4" />;
  };

  const getNetworkColor = () => {
    if (!isOnline) return 'bg-red-600';
    if (networkQuality === '2g') return 'bg-orange-600';
    if (networkQuality === '3g') return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getNetworkLabel = () => {
    if (!isOnline) return 'Offline Mode';
    if (networkQuality === '2g') return '2G Network - Very Slow';
    if (networkQuality === '3g') return '3G Network - Slow';
    if (networkQuality === '4g') return '4G Network';
    if (networkQuality === 'wifi') return 'WiFi Connected';
    return 'Online';
  };

  // Don't show if online with good connection and no queue
  if (isOnline && queuedCount === 0 && networkQuality !== '2g' && networkQuality !== '3g') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className={`${getNetworkColor()} text-white px-4 py-2.5 shadow-lg transition-all`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            {getNetworkIcon()}
            <span className="text-sm font-semibold">{getNetworkLabel()}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Status */}
            {syncing && (
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs">Syncing...</span>
              </div>
            )}

            {/* Sync Result */}
            {syncResult && (
              <div className="text-xs bg-white/20 px-2 py-1 rounded">
                ✅ {syncResult.success} synced
                {syncResult.failed > 0 && ` · ❌ ${syncResult.failed} failed`}
              </div>
            )}

            {/* Queue Count */}
            {queuedCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
                  <CloudOff className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{queuedCount}</span>
                </div>

                {isOnline && !syncing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualSync();
                    }}
                    className="text-xs bg-white/30 hover:bg-white/40 px-3 py-1 rounded-full font-semibold transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sync Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && queuedCount > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20 max-w-7xl mx-auto">
            <div className="text-xs space-y-1.5">
              {(() => {
                const stats = OfflineManager.getQueueStats();
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="opacity-90">Pending Submissions:</span>
                      <span className="font-bold">{stats.submission || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="opacity-90">Pending Posts:</span>
                      <span className="font-bold">{stats.post || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="opacity-90">Pending Photos:</span>
                      <span className="font-bold">{stats.photo || 0}</span>
                    </div>
                    {stats.other > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="opacity-90">Other:</span>
                        <span className="font-bold">{stats.other}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              
              <div className="mt-2 pt-2 border-t border-white/20 text-white/80">
                {isOnline 
                  ? '✅ Will sync automatically when connection improves'
                  : '⚠️ Submissions will sync when you\'re back online'
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
