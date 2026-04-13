import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, X, Share, ChevronUp, Smartphone, Zap, Bell, WifiOff, ArrowDown } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PWA Install Prompt
// Shows a beautiful install banner for Android/Desktop (beforeinstallprompt)
// and an iOS-specific share sheet guide (iOS Safari doesn't fire the event).
// Auto-dismisses after install and respects "dismiss for 7 days" preference.
// ─────────────────────────────────────────────────────────────────────────────

const DISMISS_KEY = 'pwa_install_dismissed_at';
const INSTALLED_KEY = 'pwa_installed';
const DISMISS_DAYS = 7; // Don't show again for 7 days after dismiss

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function wasDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const dismissedAt = parseInt(ts, 10);
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function wasAlreadyInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Don't show if already installed or running as PWA
    if (isInStandaloneMode() || wasAlreadyInstalled() || wasDismissedRecently()) {
      return;
    }

    // Detect platform
    if (isIOS()) {
      setPlatform('ios');
    } else if (isAndroid()) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Android/Desktop: Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after a short delay (let user see the app first)
      bannerTimerRef.current = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If app was installed via browser UI
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] ✅ App installed!');
      setShowBanner(false);
      setDeferredPrompt(null);
      try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
    });

    // iOS: Show guide after delay (no beforeinstallprompt on iOS)
    if (isIOS()) {
      bannerTimerRef.current = setTimeout(() => {
        setShowBanner(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      console.log('[PWA] Install choice:', result.outcome);
      if (result.outcome === 'accepted') {
        try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
      }
    } catch (err) {
      console.error('[PWA] Install error:', err);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
    setInstalling(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSGuide(false);
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch {}
  }, []);

  const handleShowIOSGuide = useCallback(() => {
    setShowIOSGuide(true);
  }, []);

  if (!showBanner) return null;

  // ────────────────────── iOS GUIDE MODAL ──────────────────────
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-end justify-center p-0">
        <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#E60000] to-[#CC0000] p-6 pb-5">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Smartphone className="w-7 h-7 text-[#E60000]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Install Airtel Champions</h3>
                <p className="text-white/80 text-sm">Add to your home screen</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Share className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Step 1: Tap Share</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Tap the <strong>Share</strong> button at the bottom of Safari
                  <span className="inline-flex items-center ml-1">
                    <ChevronUp className="w-3 h-3 text-blue-600 inline" />
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold">+</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Step 2: Add to Home Screen</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <span className="text-lg">🎉</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Step 3: Done!</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  The app will appear on your home screen just like a real app
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-gray-50 rounded-2xl p-4 mt-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Why Install?</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-600 font-medium">Faster</p>
                </div>
                <div className="text-center">
                  <Bell className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-600 font-medium">Notifications</p>
                </div>
                <div className="text-center">
                  <WifiOff className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-600 font-medium">Works Offline</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer pointer */}
          <div className="px-6 pb-6">
            <button
              onClick={handleDismiss}
              className="w-full py-3 bg-gray-100 text-gray-500 rounded-2xl text-sm font-medium"
            >
              Maybe Later
            </button>
          </div>

          {/* Bottom arrow pointing to Safari share button */}
          <div className="flex justify-center pb-4">
            <ArrowDown className="w-6 h-6 text-[#E60000] animate-bounce" />
          </div>
        </div>

        <style>{`
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
        `}</style>
      </div>
    );
  }

  // ────────────────────── MAIN INSTALL BANNER ──────────────────────
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden">
        {/* Red accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#E60000] via-[#FF1A1A] to-[#E60000]" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* App icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E60000] to-[#CC0000] flex items-center justify-center shadow-md shrink-0">
              <span className="text-2xl font-black text-white">AC</span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm">Install Airtel Champions</h3>
                <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">FREE</span>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">
                {platform === 'ios'
                  ? 'Add to home screen for the full app experience'
                  : 'Install for faster access, push notifications & offline mode'
                }
              </p>

              {/* Feature pills */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[9px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Fast
                </span>
                <span className="text-[9px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium flex items-center gap-1">
                  <Bell className="w-2.5 h-2.5" /> Notifications
                </span>
                <span className="text-[9px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium flex items-center gap-1">
                  <WifiOff className="w-2.5 h-2.5" /> Offline
                </span>
              </div>
            </div>

            {/* Dismiss X */}
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 -mt-0.5"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {platform === 'ios' ? (
              <button
                onClick={handleShowIOSGuide}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#E60000] to-[#CC0000] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md shadow-red-200"
              >
                <Share className="w-4 h-4" />
                Show Me How
              </button>
            ) : (
              <button
                onClick={handleInstall}
                disabled={installing || !deferredPrompt}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#E60000] to-[#CC0000] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md shadow-red-200 disabled:opacity-50"
              >
                {installing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Install App
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-gray-500 text-sm font-medium rounded-xl bg-gray-50"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
