/**
 * useShare — Web Share API hook
 * Allows sharing text/URLs to any native app (WhatsApp, SMS, Messenger…)
 * Falls back to clipboard copy on unsupported browsers.
 *
 * Usage:
 *   const { share, canShare } = useShare();
 *   share({ title: 'Check this out', text: '...', url: 'https://...' });
 */

import { useCallback } from 'react';

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export function useShare() {
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    if (canShare) {
      try {
        await navigator.share(data);
        return true;
      } catch (err: any) {
        // User cancelled or permission denied — not actionable errors, fall through to clipboard
        if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') {
          // silent fallback
        } else {
          console.warn('[Share] Web Share API failed, falling back to clipboard:', err);
        }
      }
    }

    // Fallback: copy to clipboard
    const text = [data.title, data.text, data.url].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      return true; // caller should show "Copied!" toast
    } catch {
      return false;
    }
  }, [canShare]);

  return { share, canShare };
}