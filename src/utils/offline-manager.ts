/**
 * Offline Manager for 2G/3G Networks
 * Handles offline queue, sync, and network detection
 */

interface QueuedRequest {
  id: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: number;
  retryCount: number;
  type: 'submission' | 'post' | 'photo' | 'other';
}

export class OfflineManager {
  private static QUEUE_KEY = 'tai_offline_queue';
  private static MAX_RETRIES = 3;
  private static syncInProgress = false;
  
  /**
   * Check if online
   */
  static isOnline(): boolean {
    return navigator.onLine;
  }
  
  /**
   * Get network quality estimate
   */
  static getNetworkQuality(): '2g' | '3g' | '4g' | 'wifi' | 'unknown' {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    if (!connection) return 'unknown';
    
    const type = connection.effectiveType;
    return type || 'unknown';
  }
  
  /**
   * Get download speed estimate (Mbps)
   */
  static getDownloadSpeed(): number {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    if (!connection) return 0;
    
    // downlink is in Mbps
    return connection.downlink || 0;
  }
  
  /**
   * Queue request for later (when offline)
   */
  static queueRequest(
    endpoint: string, 
    method: string, 
    data: any,
    type: QueuedRequest['type'] = 'other'
  ): string {
    const queue = this.getQueue();
    const request: QueuedRequest = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      type,
    };
    
    queue.push(request);
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    
    console.log(`[OfflineManager] ✅ Queued ${type} request:`, endpoint);
    
    // ── PWA Background Sync: register a sync tag so the SW retries when
    //    connectivity is restored, even if the app tab is closed. ──────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg: any) => {
        if ('sync' in reg) {
          reg.sync.register('sync-submissions')
            .then(() => console.log('[OfflineManager] 🔄 Background sync registered'))
            .catch((err: any) => console.warn('[OfflineManager] Sync registration failed:', err));
        }
      }).catch(() => {});
    }
    
    // Dispatch event so UI can update
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { 
      detail: { count: queue.length } 
    }));
    
    return request.id;
  }
  
  /**
   * Get queued requests
   */
  static getQueue(): QueuedRequest[] {
    try {
      const queue = localStorage.getItem(this.QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('[OfflineManager] Error reading queue:', error);
      return [];
    }
  }
  
  /**
   * Get queue count by type
   */
  static getQueueStats(): Record<string, number> {
    const queue = this.getQueue();
    const stats: Record<string, number> = {
      submission: 0,
      post: 0,
      photo: 0,
      other: 0,
      total: queue.length,
    };
    
    queue.forEach(req => {
      stats[req.type] = (stats[req.type] || 0) + 1;
    });
    
    return stats;
  }
  
  /**
   * Sync queued requests when online
   */
  static async syncQueue(): Promise<{ success: number; failed: number; skipped: number }> {
    if (!this.isOnline()) {
      console.log('[OfflineManager] ⚠️ Cannot sync: offline');
      return { success: 0, failed: 0, skipped: 0 };
    }
    
    if (this.syncInProgress) {
      console.log('[OfflineManager] ⚠️ Sync already in progress');
      return { success: 0, failed: 0, skipped: 0 };
    }
    
    const queue = this.getQueue();
    if (queue.length === 0) {
      return { success: 0, failed: 0, skipped: 0 };
    }
    
    console.log(`[OfflineManager] 🔄 Syncing ${queue.length} queued requests...`);
    this.syncInProgress = true;
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    const remainingQueue: QueuedRequest[] = [];
    
    // Dispatch sync started event
    window.dispatchEvent(new CustomEvent('offline-sync-started'));
    
    for (const request of queue) {
      // Check if still online
      if (!this.isOnline()) {
        console.log('[OfflineManager] ⚠️ Lost connection during sync');
        remainingQueue.push(...queue.slice(queue.indexOf(request)));
        skipped = remainingQueue.length;
        break;
      }
      
      try {
        console.log(`[OfflineManager] 🔄 Syncing ${request.type}:`, request.id);
        
        // Attempt to send request
        const response = await fetch(request.endpoint, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...(request.data.authorization && {
              'Authorization': request.data.authorization
            }),
          },
          body: JSON.stringify(request.data),
        });
        
        if (response.ok) {
          console.log(`[OfflineManager] ✅ Synced ${request.type}:`, request.id);
          success++;
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (error: any) {
        console.error(`[OfflineManager] ❌ Sync failed for ${request.type}:`, request.id, error.message);
        request.retryCount++;
        
        // Keep in queue if under max retries
        if (request.retryCount < this.MAX_RETRIES) {
          remainingQueue.push(request);
          console.log(`[OfflineManager] 🔄 Will retry (${request.retryCount}/${this.MAX_RETRIES})`);
        } else {
          console.error(`[OfflineManager] ⚠️ Max retries reached, discarding ${request.type}:`, request.id);
          failed++;
        }
      }
      
      // Small delay between requests to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Update queue with remaining items
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(remainingQueue));
    
    this.syncInProgress = false;
    
    console.log(`[OfflineManager] 🎯 Sync complete: ${success} success, ${failed} failed, ${skipped} skipped`);
    
    // Dispatch sync completed event
    window.dispatchEvent(new CustomEvent('offline-sync-completed', {
      detail: { success, failed, skipped, remaining: remainingQueue.length }
    }));
    
    // Dispatch queue updated event
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { 
      detail: { count: remainingQueue.length } 
    }));
    
    return { success, failed, skipped };
  }
  
  /**
   * Remove specific request from queue
   */
  static removeFromQueue(requestId: string): boolean {
    const queue = this.getQueue();
    const filteredQueue = queue.filter(req => req.id !== requestId);
    
    if (filteredQueue.length === queue.length) {
      return false; // Not found
    }
    
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(filteredQueue));
    
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { 
      detail: { count: filteredQueue.length } 
    }));
    
    return true;
  }
  
  /**
   * Clear entire queue
   */
  static clearQueue() {
    localStorage.removeItem(this.QUEUE_KEY);
    console.log('[OfflineManager] 🗑️ Queue cleared');
    
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { 
      detail: { count: 0 } 
    }));
  }
  
  /**
   * Listen for online/offline events
   */
  static setupListeners(onOnline?: () => void, onOffline?: () => void) {
    window.addEventListener('online', () => {
      console.log('[OfflineManager] 🌐 Back online!');
      
      // Auto-sync after coming back online
      setTimeout(() => {
        this.syncQueue();
      }, 1000);
      
      onOnline?.();
    });
    
    window.addEventListener('offline', () => {
      console.log('[OfflineManager] 📴 Gone offline');
      onOffline?.();
    });
    
    // Monitor connection changes
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', () => {
        console.log('[OfflineManager] 🔄 Network type changed:', this.getNetworkQuality());
      });
    }
  }
  
  /**
   * Get human-readable network status
   */
  static getNetworkStatus(): string {
    if (!this.isOnline()) {
      return 'Offline';
    }
    
    const quality = this.getNetworkQuality();
    const speed = this.getDownloadSpeed();
    
    switch (quality) {
      case '2g':
        return `2G (${speed.toFixed(1)} Mbps) - Very Slow`;
      case '3g':
        return `3G (${speed.toFixed(1)} Mbps) - Slow`;
      case '4g':
        return `4G (${speed.toFixed(1)} Mbps) - Fast`;
      case 'wifi':
        return `WiFi (${speed.toFixed(1)} Mbps) - Excellent`;
      default:
        return 'Online';
    }
  }
  
  /**
   * Check if should auto-upload based on network
   */
  static shouldAutoUpload(): boolean {
    if (!this.isOnline()) return false;
    
    const quality = this.getNetworkQuality();
    
    // Check user preferences
    const wifiOnly = localStorage.getItem('settings_wifiOnly') === 'true';
    
    if (wifiOnly && quality !== 'wifi') {
      console.log('[OfflineManager] ⚠️ WiFi-only mode enabled, skipping upload');
      return false;
    }
    
    return true;
  }
}
