
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

// Register service worker with update detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('SW registered: ', registration);

        // Check for updates immediately and then periodically
        const checkForUpdates = () => {
          registration.update().catch((err) => {
            console.warn('[SW Update] Error checking for updates:', err);
          });
        };

        // Check for updates every 5 minutes
        checkForUpdates(); // Initial check
        setInterval(checkForUpdates, 5 * 60 * 1000);

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is ready and there's an active controller
                console.log('[SW] Update available - reloading application');
                // Hard refresh to pick up new version
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Fallback: Server health check and refresh (every 5 minutes)
function scheduleServerHealthCheck() {
  setInterval(() => {
    // Send a no-op request to check if content has changed
    fetch('/?_t=' + Date.now(), { 
      method: 'HEAD',
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }).catch(() => {
      // Silently handle errors
    });
  }, 5 * 60 * 1000);
}

scheduleServerHealthCheck();

createRoot(document.getElementById("root")!).render(<App />);
