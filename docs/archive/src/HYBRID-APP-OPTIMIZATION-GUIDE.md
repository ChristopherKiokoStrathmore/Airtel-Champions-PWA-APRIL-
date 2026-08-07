# 📱 Hybrid App Optimization Guide for TAI Sales Intelligence

## Architecture
**React Web App → Native Android Container (APK)**

This guide ensures your app works flawlessly across all Android devices, especially on 2G/3G networks in Kenya.

---

## 🎯 Critical Optimizations Needed

### 1. **WebView Configuration** ⚠️ MUST DO

Your Android WebView needs proper configuration for modern web features.

#### Create: `android/app/src/main/java/MainActivity.java`

```java
package com.tai.salesintelligence; // Update with your package name

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.net.Uri;
import android.content.Intent;
import android.provider.MediaStore;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.IOException;

public class MainActivity extends AppCompatActivity {
    
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private String cameraPhotoPath;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        setupWebView();
    }
    
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        
        // ✅ Enable JavaScript (required for React)
        settings.setJavaScriptEnabled(true);
        
        // ✅ Enable DOM storage (for localStorage/sessionStorage)
        settings.setDomStorageEnabled(true);
        
        // ✅ Enable database storage
        settings.setDatabaseEnabled(true);
        
        // ✅ Enable file access
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        
        // ✅ Enable caching for offline support
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAppCacheEnabled(true);
        settings.setAppCachePath(getApplicationContext().getCacheDir().getAbsolutePath());
        
        // ✅ Enable geolocation
        settings.setGeolocationEnabled(true);
        
        // ✅ Enable zoom controls (optional)
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        
        // ✅ Enable modern web features
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // ✅ Performance optimizations
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK); // Offline-first
        
        // ✅ Setup WebChromeClient for geolocation, camera, file upload
        webView.setWebChromeClient(new WebChromeClient() {
            
            // Handle geolocation requests
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, 
                    GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
            
            // Handle file/camera chooser
            @Override
            public boolean onShowFileChooser(WebView webView, 
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                
                // Cleanup previous callbacks
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;
                
                // Check if camera is requested
                boolean preferCamera = false;
                String[] acceptTypes = fileChooserParams.getAcceptTypes();
                if (acceptTypes != null && acceptTypes.length > 0) {
                    for (String type : acceptTypes) {
                        if (type.equals("image/*")) {
                            preferCamera = true;
                            break;
                        }
                    }
                }
                
                // Force camera for image capture
                if (preferCamera && fileChooserParams.isCaptureEnabled()) {
                    openCamera();
                } else {
                    openFileChooser();
                }
                
                return true;
            }
        });
        
        // Load your app
        webView.loadUrl("file:///android_asset/index.html"); // For local assets
        // OR
        // webView.loadUrl("https://your-domain.com"); // For hosted version
    }
    
    private void openCamera() {
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
            File photoFile = null;
            try {
                photoFile = createImageFile();
                cameraPhotoPath = "file:" + photoFile.getAbsolutePath();
            } catch (IOException ex) {
                // Handle error
            }
            
            if (photoFile != null) {
                Uri photoURI = FileProvider.getUriForFile(this,
                    "com.tai.salesintelligence.fileprovider",
                    photoFile);
                takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                startActivityForResult(takePictureIntent, REQUEST_CAMERA);
            }
        }
    }
    
    private void openFileChooser() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("image/*");
        startActivityForResult(
            Intent.createChooser(intent, "Select Photo"),
            REQUEST_FILE_CHOOSER
        );
    }
    
    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String imageFileName = "TAI_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        return File.createTempFile(imageFileName, ".jpg", storageDir);
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        if (filePathCallback == null) return;
        
        Uri[] results = null;
        
        if (resultCode == RESULT_OK) {
            if (requestCode == REQUEST_CAMERA) {
                results = new Uri[]{Uri.parse(cameraPhotoPath)};
            } else if (requestCode == REQUEST_FILE_CHOOSER) {
                if (data != null && data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
            }
        }
        
        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    private static final int REQUEST_CAMERA = 1;
    private static final int REQUEST_FILE_CHOOSER = 2;
}
```

---

### 2. **Android Manifest Configuration** ⚠️ MUST DO

#### Update: `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.tai.salesintelligence">

    <!-- ✅ Required Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    
    <!-- Camera & Storage -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    
    <!-- Location (for GPS tagging) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    
    <!-- Hardware features (not required, but preferred) -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    
    <!-- ✅ Network optimization for 2G/3G -->
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
    
    <!-- ✅ Background sync (for offline queue) -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    
    <application
        android:name=".TAIApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="TAI Sales Intelligence"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.TAI"
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">
        
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:exported="true"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <!-- ✅ FileProvider for camera (Android 7+) -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="com.tai.salesintelligence.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
        
    </application>

</manifest>
```

---

### 3. **Offline-First Architecture** ⚠️ CRITICAL FOR 2G/3G

You're already using localStorage, but need to enhance it:

#### Create: `/utils/offline-manager.ts`

```typescript
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
}

export class OfflineManager {
  private static QUEUE_KEY = 'tai_offline_queue';
  private static MAX_RETRIES = 3;
  
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
   * Queue request for later (when offline)
   */
  static queueRequest(endpoint: string, method: string, data: any) {
    const queue = this.getQueue();
    const request: QueuedRequest = {
      id: `${Date.now()}_${Math.random()}`,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    queue.push(request);
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    
    console.log('[OfflineManager] ✅ Queued request:', endpoint);
    return request.id;
  }
  
  /**
   * Get queued requests
   */
  static getQueue(): QueuedRequest[] {
    const queue = localStorage.getItem(this.QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  }
  
  /**
   * Sync queued requests when online
   */
  static async syncQueue(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline()) {
      console.log('[OfflineManager] ⚠️ Cannot sync: offline');
      return { success: 0, failed: 0 };
    }
    
    const queue = this.getQueue();
    if (queue.length === 0) {
      console.log('[OfflineManager] ✅ Queue empty, nothing to sync');
      return { success: 0, failed: 0 };
    }
    
    console.log(`[OfflineManager] 🔄 Syncing ${queue.length} queued requests...`);
    
    let success = 0;
    let failed = 0;
    const remainingQueue: QueuedRequest[] = [];
    
    for (const request of queue) {
      try {
        // Attempt to send request
        const response = await fetch(request.endpoint, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.data.authorization || '',
          },
          body: JSON.stringify(request.data),
        });
        
        if (response.ok) {
          console.log('[OfflineManager] ✅ Synced:', request.id);
          success++;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('[OfflineManager] ❌ Sync failed:', request.id, error);
        request.retryCount++;
        
        if (request.retryCount < this.MAX_RETRIES) {
          remainingQueue.push(request);
        } else {
          console.error('[OfflineManager] ⚠️ Max retries reached, discarding:', request.id);
          failed++;
        }
      }
    }
    
    // Update queue
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(remainingQueue));
    
    console.log(`[OfflineManager] 🎯 Sync complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }
  
  /**
   * Clear queue
   */
  static clearQueue() {
    localStorage.removeItem(this.QUEUE_KEY);
    console.log('[OfflineManager] 🗑️ Queue cleared');
  }
  
  /**
   * Listen for online/offline events
   */
  static setupListeners(onOnline?: () => void, onOffline?: () => void) {
    window.addEventListener('online', () => {
      console.log('[OfflineManager] 🌐 Back online!');
      this.syncQueue();
      onOnline?.();
    });
    
    window.addEventListener('offline', () => {
      console.log('[OfflineManager] 📴 Gone offline');
      onOffline?.();
    });
  }
}
```

---

### 4. **IndexedDB for Large Offline Data** ⚠️ RECOMMENDED

localStorage has a 5-10MB limit. For 662 SEs with posts, photos, etc., use IndexedDB:

#### Create: `/utils/indexed-db.ts`

```typescript
/**
 * IndexedDB wrapper for offline-first data storage
 * Stores posts, submissions, user data locally
 */

const DB_NAME = 'TAI_Database';
const DB_VERSION = 1;

interface Store {
  name: string;
  keyPath: string;
  indexes?: { name: string; keyPath: string; unique: boolean }[];
}

const STORES: Store[] = [
  {
    name: 'posts',
    keyPath: 'id',
    indexes: [
      { name: 'user_id', keyPath: 'user_id', unique: false },
      { name: 'timestamp', keyPath: 'created_at', unique: false },
    ],
  },
  {
    name: 'submissions',
    keyPath: 'id',
    indexes: [
      { name: 'program_id', keyPath: 'program_id', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
    ],
  },
  {
    name: 'users',
    keyPath: 'id',
  },
  {
    name: 'leaderboard',
    keyPath: 'rank',
  },
];

export class IndexedDBManager {
  private static db: IDBDatabase | null = null;
  
  /**
   * Initialize database
   */
  static async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] ✅ Database initialized');
        resolve();
      };
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create object stores
        STORES.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath,
            });
            
            // Create indexes
            store.indexes?.forEach(index => {
              objectStore.createIndex(index.name, index.keyPath, {
                unique: index.unique,
              });
            });
            
            console.log(`[IndexedDB] Created store: ${store.name}`);
          }
        });
      };
    });
  }
  
  /**
   * Save data to store
   */
  static async save(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Get data from store
   */
  static async get(storeName: string, key: any): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Get all data from store
   */
  static async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Delete data from store
   */
  static async delete(storeName: string, key: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Clear all data from store
   */
  static async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```

---

### 5. **Service Worker for Offline Caching** ⚠️ RECOMMENDED

#### Create: `/public/service-worker.js`

```javascript
const CACHE_NAME = 'tai-v1.0.0';
const RUNTIME_CACHE = 'tai-runtime';

// Files to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  // Add other critical assets
];

// Install event - cache critical files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching files');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests (Supabase, etc.)
  if (url.origin !== location.origin) {
    // Network-first for API calls
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // Cache-first for static assets
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return caches.open(RUNTIME_CACHE)
          .then(cache => {
            return fetch(request).then(response => {
              // Cache successful responses
              if (response && response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            });
          });
      })
  );
});
```

#### Register Service Worker in `/App.tsx`:

```typescript
// Add to App.tsx useEffect
useEffect(() => {
  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('[SW] ✅ Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('[SW] ❌ Service Worker registration failed:', error);
      });
  }
}, []);
```

---

### 6. **Network Detection & User Feedback**

#### Create: `/components/network-status.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { OfflineManager } from '../utils/offline-manager';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState<string>('unknown');
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
      setNetworkQuality(OfflineManager.getNetworkQuality());
      setQueuedCount(OfflineManager.getQueue().length);
    };

    updateStatus();

    // Setup listeners
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

    // Update every 10 seconds
    const interval = setInterval(updateStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center z-50">
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-semibold">Offline Mode</span>
          {queuedCount > 0 && (
            <span className="text-xs bg-red-700 px-2 py-1 rounded-full">
              {queuedCount} queued
            </span>
          )}
        </div>
      </div>
    );
  }

  if (networkQuality === '2g' || networkQuality === '3g') {
    return (
      <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white px-4 py-2 text-center z-50">
        <div className="flex items-center justify-center gap-2">
          <Signal className="w-4 h-4" />
          <span className="text-sm font-semibold">Slow Network ({networkQuality.toUpperCase()})</span>
        </div>
      </div>
    );
  }

  return null; // Don't show anything on good connection
}
```

Add to App.tsx:
```typescript
import { NetworkStatus } from './components/network-status';

// In your App component
<NetworkStatus />
```

---

### 7. **Image Optimization for 2G/3G**

You already have compression, but enhance it:

#### Update: `/utils/imageCompression.ts`

```typescript
export const compressImage = async (
  file: File,
  maxSizeMB: number = 0.5, // Reduce to 500KB for 2G/3G
  maxWidthOrHeight: number = 1280, // Reduce resolution
  networkQuality?: string
): Promise<{ file: File; compressedSize: number; originalSize: number }> => {
  
  // Adjust compression based on network quality
  let quality = 0.8;
  let maxSize = maxSizeMB;
  
  if (networkQuality === '2g') {
    quality = 0.6;
    maxSize = 0.3; // 300KB max on 2G
    maxWidthOrHeight = 960;
  } else if (networkQuality === '3g') {
    quality = 0.7;
    maxSize = 0.5;
    maxWidthOrHeight = 1280;
  }
  
  // ... rest of compression logic
};
```

---

### 8. **Battery Optimization**

#### Reduce background activity:

```typescript
// In App.tsx or main component
useEffect(() => {
  let syncInterval: any;
  
  // Only sync when app is active
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // App in background - pause syncing
      clearInterval(syncInterval);
      console.log('[App] Paused background sync');
    } else {
      // App in foreground - resume syncing
      syncInterval = setInterval(() => {
        OfflineManager.syncQueue();
      }, 60000); // Every 1 minute when active
      console.log('[App] Resumed syncing');
    }
  });
  
  return () => clearInterval(syncInterval);
}, []);
```

---

### 9. **Secure Token Storage**

#### CRITICAL: Don't store tokens in localStorage in WebView

Create: `/utils/secure-storage.ts`

```typescript
/**
 * Secure storage for sensitive data
 * Uses native Android SharedPreferences (encrypted)
 */

export class SecureStorage {
  /**
   * Check if running in native container
   */
  static isNative(): boolean {
    return !!(window as any).AndroidInterface;
  }
  
  /**
   * Save secure data
   */
  static async setItem(key: string, value: string): Promise<void> {
    if (this.isNative() && (window as any).AndroidInterface) {
      // Use native secure storage
      (window as any).AndroidInterface.setSecureItem(key, value);
    } else {
      // Fallback to localStorage (web testing only)
      localStorage.setItem(key, value);
    }
  }
  
  /**
   * Get secure data
   */
  static async getItem(key: string): Promise<string | null> {
    if (this.isNative() && (window as any).AndroidInterface) {
      return (window as any).AndroidInterface.getSecureItem(key);
    } else {
      return localStorage.getItem(key);
    }
  }
  
  /**
   * Remove secure data
   */
  static async removeItem(key: string): Promise<void> {
    if (this.isNative() && (window as any).AndroidInterface) {
      (window as any).AndroidInterface.removeSecureItem(key);
    } else {
      localStorage.removeItem(key);
    }
  }
}
```

Then add to your MainActivity.java:

```java
// Add JavaScript interface for secure storage
webView.addJavascriptInterface(new AndroidInterface(this), "AndroidInterface");

public class AndroidInterface {
    private Context context;
    
    AndroidInterface(Context context) {
        this.context = context;
    }
    
    @JavascriptInterface
    public void setSecureItem(String key, String value) {
        SharedPreferences prefs = context.getSharedPreferences(
            "TAI_SecureStorage", 
            Context.MODE_PRIVATE
        );
        prefs.edit().putString(key, value).apply();
    }
    
    @JavascriptInterface
    public String getSecureItem(String key) {
        SharedPreferences prefs = context.getSharedPreferences(
            "TAI_SecureStorage", 
            Context.MODE_PRIVATE
        );
        return prefs.getString(key, null);
    }
    
    @JavascriptInterface
    public void removeSecureItem(String key) {
        SharedPreferences prefs = context.getSharedPreferences(
            "TAI_SecureStorage", 
            Context.MODE_PRIVATE
        );
        prefs.edit().remove(key).apply();
    }
}
```

---

### 10. **Build Configuration**

#### If using Capacitor: `capacitor.config.json`

```json
{
  "appId": "com.tai.salesintelligence",
  "appName": "TAI Sales Intelligence",
  "webDir": "build",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "allowNavigation": [
      "*.supabase.co"
    ]
  },
  "android": {
    "buildOptions": {
      "keystorePath": "release.keystore",
      "keystoreAlias": "tai-release"
    },
    "minWebViewVersion": 55,
    "backgroundColor": "#ffffff"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#DC2626",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false
    },
    "Camera": {
      "saveToGallery": false
    },
    "Geolocation": {
      "permissionType": "whenInUse"
    }
  }
}
```

---

## 📊 Summary Checklist

| Optimization | Priority | Status |
|-------------|----------|--------|
| WebView Configuration | 🔴 CRITICAL | ⬜ TODO |
| Android Manifest Permissions | 🔴 CRITICAL | ⬜ TODO |
| Offline Queue Manager | 🔴 CRITICAL | ⬜ TODO |
| IndexedDB for Large Data | 🟡 HIGH | ⬜ TODO |
| Service Worker | 🟡 HIGH | ⬜ TODO |
| Network Status Detection | 🟡 HIGH | ⬜ TODO |
| Image Compression (Enhanced) | 🟡 HIGH | ✅ DONE |
| Secure Token Storage | 🔴 CRITICAL | ⬜ TODO |
| Battery Optimization | 🟢 MEDIUM | ⬜ TODO |
| Native Camera Plugin | 🔴 CRITICAL | ✅ DONE |

---

## 🚀 Next Steps

1. **Implement WebView configuration** (most critical)
2. **Update AndroidManifest.xml** with all permissions
3. **Add Offline Manager** to handle 2G/3G network issues
4. **Test on real devices** (Samsung, Xiaomi, Oppo, etc.)
5. **Monitor IndexedDB usage** for large datasets

---

## 🎯 Expected Results

After these optimizations:
- ✅ Works offline with queue sync
- ✅ Camera opens directly (no file picker)
- ✅ GPS captures reliably
- ✅ Fast on 2G/3G networks
- ✅ Secure token storage
- ✅ Battery efficient
- ✅ Works across all Android devices

