# PWA Auto-Refresh Implementation Guide

## Overview

Your PWA is now configured to automatically refresh every 5 minutes in the background to pick up updates without requiring user intervention. This happens completely silently in the background.

## How It Works

### 1. **Service Worker Update Detection** (in `src/main.tsx`)
- Service worker is registered with `updateViaCache: 'none'` to bypass browser cache
- Updates are checked every 5 minutes via `registration.update()`
- When a new service worker is installed and active, the page automatically reloads
- This catches major app updates and new deployments

### 2. **Enhanced Service Worker** (in `public/sw.js`)
- Uses **network-first strategy** for HTML documents (index.html)
  - Always tries to fetch fresh content from the network
  - Falls back to cache if network fails
  - Keeps cached copy for offline access
  
- Uses **stale-while-revalidate** for static assets (JS, CSS, etc.)
  - Serves cached version immediately
  - Updates cache in background
  - New assets available on next visit or reload

- Automatically cleans up old cache versions on activation
- Immediately claims clients to ensure new service worker takes effect

### 3. **Fallback Health Check** (in `src/main.tsx`)
- Sends periodic `HEAD` requests every 5 minutes
- Checks if content has been updated on the server
- Helps detect deployment issues

## Configuration

### Adjust the Refresh Interval

Edit `src/main.tsx` and change this line:

```javascript
setInterval(checkForUpdates, 5 * 60 * 1000); // Change 5 to desired minutes
```

For example:
- **3 minutes**: `3 * 60 * 1000`
- **10 minutes**: `10 * 60 * 1000`
- **2 minutes**: `2 * 60 * 1000`

### Optional: Use the useAutoRefresh Hook

For more granular control, you can use the `useAutoRefresh` hook directly in any React component:

```typescript
import { useAutoRefresh } from './hooks/useAutoRefresh';

export function MyComponent() {
  // Basic usage (5 minutes default)
  useAutoRefresh();

  // Or with custom options
  useAutoRefresh({
    interval: 3 * 60 * 1000,  // 3 minutes
    enableLogging: true,
    onRefreshTriggered: () => {
      console.log('App is refreshing!');
    }
  });

  return <div>My Component</div>;
}
```

## What Gets Refreshed

### On Every 5-Minute Check:
1. ✅ New JavaScript bundles (automatic via service worker)
2. ✅ New CSS styles (automatic via service worker)
3. ✅ Updated HTML templates (fetched with no-cache headers)
4. ✅ Service worker itself (checked and updated)
5. ✅ All dynamic content from your APIs

### What Doesn't Get Deleted:
- ❌ User session data
- ❌ Local storage
- ❌ IndexedDB data
- ❌ Browser cache (except old service worker versions)

## Testing the Auto-Refresh

### Manual Test:
1. Open your app in a browser
2. Open DevTools → Application → Service Workers
3. Open DevTools → Console
4. Watch for these logs every 5 minutes:
   - `[SW] Checking for updates...`
   - `[SW] Update available - reloading application`

### Deploy Test:
1. Push a code update to your server
2. Wait up to 5 minutes
3. App will automatically reload and pick up the changes
4. Users will see the new version without manual refresh

## Deployment Requirements

For auto-refresh to work effectively:

### ✅ Do This:
- `index.html` must have proper cache headers:
  ```
  Cache-Control: no-cache, no-store, must-revalidate
  ```
- Service worker updates must be properly deployed
- Your build tool should generate new asset filenames on rebuild (Vite does this by default)

### ❌ Avoid This:
- Don't cache `index.html` permanently on CDN
- Don't use aggressive cache headers on your main entry point
- Don't disable service workers in deployment

## Browser Support

Auto-refresh works on all modern browsers:
- ✅ Chrome 40+
- ✅ Firefox 44+
- ✅ Safari 11.1+
- ✅ Edge 15+
- ✅ Mobile browsers (iOS Safari 11.3+, Chrome Android)

## Troubleshooting

### "App keeps doing hard refreshes"
- Check if your HTML has proper cache headers
- Ensure service worker version updates are intentional
- Reduce refresh interval if too aggressive

### "Changes aren't showing up after 5 minutes"
- Check DevTools → Console for errors
- Ensure new assets have unique filenames (Vite handles this)
- Clear browser cache and restart (Ctrl+Shift+Delete)

### "Service worker not updating"
- Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Clear service workers: DevTools → Application → Service Workers → Unregister
- Check browser console for registration errors

## Production Considerations

- **Server Load**: Each client pings every 5 minutes, scale accordingly
- **Storage**: Service worker cache grows over time; old versions auto-clean
- **User Experience**: Refresh happens silently; users won't notice
- **Analytics**: Page reloads increment page view counts (consider tracking separately)

## Advanced: Manual Refresh Trigger

To manually trigger a refresh from your app code:

```javascript
// Force a hard refresh
window.location.href = window.location.href;

// Or force service worker update check
if (navigator.serviceWorker?.controller) {
  navigator.serviceWorker.getRegistration().then(reg => {
    reg?.update();
  });
}

// Or send message to service worker to clear cache
navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_CACHE' });
```

## Related Files

- `src/main.tsx` - Service worker registration and update checks
- `public/sw.js` - Service worker cache/fetch logic
- `src/hooks/useAutoRefresh.ts` - Optional React hook for fine-grained control

