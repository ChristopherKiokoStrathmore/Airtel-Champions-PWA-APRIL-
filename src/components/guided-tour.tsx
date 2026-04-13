import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
type TourType = 'app' | 'program';

interface GuidedTourProps {
  type: TourType;
  programId?: string;
  programTitle?: string;
  onComplete: () => void;
  onSkipAll?: () => void;
}

// ─── LocalStorage ───────────────────────────────────────────
const TOUR_SKIP_ALL_KEY = 'tai_tour_skip_all';
const TOUR_APP_SKIP_COUNT_KEY = 'tai_tour_app_skip_count';
const TOUR_PROGRAMS_DONE_KEY = 'tai_tour_programs_done';
const TOUR_VERSION_KEY = 'tai_tour_version';
const CURRENT_TOUR_VERSION = 5;

function ensureTourVersion() {
  const stored = parseInt(localStorage.getItem(TOUR_VERSION_KEY) || '0', 10);
  if (stored < CURRENT_TOUR_VERSION) {
    console.log('[GuidedTour] Version', stored, '->', CURRENT_TOUR_VERSION);
    localStorage.removeItem(TOUR_SKIP_ALL_KEY);
    localStorage.removeItem(TOUR_APP_SKIP_COUNT_KEY);
    localStorage.removeItem(TOUR_PROGRAMS_DONE_KEY);
    localStorage.setItem(TOUR_VERSION_KEY, String(CURRENT_TOUR_VERSION));
  }
}

// ─── Public API ─────────────────────────────────────────────

export function shouldShowAppTour(): boolean {
  ensureTourVersion();
  if (localStorage.getItem(TOUR_SKIP_ALL_KEY) === 'true') return false;
  return parseInt(localStorage.getItem(TOUR_APP_SKIP_COUNT_KEY) || '0', 10) < 3;
}

export function shouldShowProgramTour(programId: string): boolean {
  ensureTourVersion();
  if (localStorage.getItem(TOUR_SKIP_ALL_KEY) === 'true') return false;
  try { return !JSON.parse(localStorage.getItem(TOUR_PROGRAMS_DONE_KEY) || '[]').includes(programId); }
  catch { return true; }
}

export function incrementAppTourSkip() {
  const c = parseInt(localStorage.getItem(TOUR_APP_SKIP_COUNT_KEY) || '0', 10);
  localStorage.setItem(TOUR_APP_SKIP_COUNT_KEY, String(c + 1));
}

export function markProgramTourDone(programId: string) {
  try {
    const d = JSON.parse(localStorage.getItem(TOUR_PROGRAMS_DONE_KEY) || '[]');
    if (!d.includes(programId)) { d.push(programId); localStorage.setItem(TOUR_PROGRAMS_DONE_KEY, JSON.stringify(d)); }
  } catch { localStorage.setItem(TOUR_PROGRAMS_DONE_KEY, JSON.stringify([programId])); }
}

export function skipAllTours() { localStorage.setItem(TOUR_SKIP_ALL_KEY, 'true'); }

// ─── Step Definitions ───────────────────────────────────────

interface Step {
  target: string;
  title: string;
  body: string;
  placement: 'top' | 'bottom';
}

const APP_STEPS: Step[] = [
  {
    target: 'comms-bar',
    title: 'Quick Actions',
    body: 'Message, call, view history & announcements — all here.',
    placement: 'bottom',
  },
  {
    target: 'top-performers',
    title: 'Top Performers',
    body: 'Today\'s leaders, live. Tap anyone to see their profile.',
    placement: 'bottom',
  },
  {
    target: 'programs-activity',
    title: 'Programs',
    body: 'Submit field data & earn points. Two taps away.',
    placement: 'top',
  },
  {
    target: 'bottom-nav',
    title: 'Navigation',
    body: 'Home, Leaderboard, Hall of Fame, Explore & Profile.',
    placement: 'top',
  },
];

const PROGRAM_STEPS: Step[] = [
  { target: 'program-header', title: 'Program Overview', body: 'See the program name, status & key info at a glance.', placement: 'bottom' },
  { target: 'program-fields', title: 'Fill In Details', body: 'Add sites, MSISDNs, photos & field data here.', placement: 'bottom' },
  { target: 'program-submit', title: 'Submit or Save', body: 'Submit when done, or save & continue later.', placement: 'top' },
];

// ─── Measure Target ─────────────────────────────────────────

interface Rect { top: number; left: number; width: number; height: number; }

function useTargetRect(selector: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
    if (!el) { setRect(null); return; }

    // Find the scrollable parent (the flex-1 overflow-y-auto div)
    const scrollParent = el.closest('.overflow-y-auto') || el.parentElement;

    // Scroll element into view within its scroll container
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const t = setTimeout(measure, 400);
    return () => clearTimeout(t);
  }, [selector]);

  useEffect(() => {
    const onResize = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [selector]);

  return rect;
}

// ─── Component ────────────────────��─────────────────────────

export function GuidedTour({ type, programId, onComplete, onSkipAll }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'entering' | 'visible' | 'stepping' | 'exiting'>('entering');

  const steps = type === 'app' ? APP_STEPS : PROGRAM_STEPS;
  const current = steps[step];
  const total = steps.length;
  const isLast = step === total - 1;

  const rect = useTargetRect(current.target);

  // Entrance
  useEffect(() => {
    const t = setTimeout(() => setPhase('visible'), 60);
    return () => clearTimeout(t);
  }, []);

  // Step transition
  useEffect(() => {
    if (phase === 'stepping') {
      const t = setTimeout(() => setPhase('visible'), 50);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const exit = useCallback((cb: () => void) => {
    setPhase('exiting');
    setTimeout(cb, 250);
  }, []);

  const next = useCallback(() => {
    if (isLast) {
      exit(() => {
        if (type === 'app') localStorage.setItem(TOUR_APP_SKIP_COUNT_KEY, '3');
        else if (programId) markProgramTourDone(programId);
        onComplete();
      });
    } else {
      setPhase('stepping');
      setStep(s => s + 1);
    }
  }, [isLast, type, programId, onComplete, exit]);

  const prev = useCallback(() => {
    if (step > 0) { setPhase('stepping'); setStep(s => s - 1); }
  }, [step]);

  const skip = useCallback(() => {
    exit(() => {
      if (type === 'app') incrementAppTourSkip();
      else if (programId) markProgramTourDone(programId);
      onComplete();
    });
  }, [type, programId, onComplete, exit]);

  const neverShow = useCallback(() => {
    exit(() => { skipAllTours(); onSkipAll?.(); onComplete(); });
  }, [onComplete, onSkipAll, exit]);

  // Swipe
  const tx = useRef(0);
  const onTS = (e: React.TouchEvent) => { tx.current = e.touches[0].clientX; };
  const onTE = (e: React.TouchEvent) => {
    const d = tx.current - e.changedTouches[0].clientX;
    if (Math.abs(d) > 50) { d > 0 && !isLast ? next() : d < 0 && step > 0 ? prev() : null; }
  };

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [next, prev, skip]);

  // ── Layout math ───────────────────────────────────────────
  const PAD = 6;
  const spot = rect ? {
    x: rect.left - PAD,
    y: rect.top - PAD,
    w: rect.width + PAD * 2,
    h: rect.height + PAD * 2,
  } : null;

  const tooltipPos = (): React.CSSProperties => {
    if (!spot) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const vH = window.innerHeight;
    const gap = 10;
    if (current.placement === 'bottom') {
      const top = spot.y + spot.h + gap;
      if (top + 160 > vH - 10) return { bottom: vH - spot.y + gap, left: 20, right: 20 };
      return { top, left: 20, right: 20 };
    }
    const bottom = vH - spot.y + gap;
    if (bottom + 160 > vH - 10) return { top: spot.y + spot.h + gap, left: 20, right: 20 };
    return { bottom, left: 20, right: 20 };
  };

  // Arrow pointing toward the target
  const arrowStyle = (): React.CSSProperties | null => {
    if (!spot) return null;
    const isAbove = current.placement === 'top';
    return {
      position: 'absolute' as const,
      left: '50%',
      transform: 'translateX(-50%)',
      ...(isAbove ? { bottom: -5 } : { top: -5 }),
      width: 0, height: 0,
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      ...(isAbove
        ? { borderTop: '6px solid rgba(30, 58, 138, 0.95)' }
        : { borderBottom: '6px solid rgba(30, 58, 138, 0.95)' }
      ),
    };
  };

  const opacity = phase === 'visible' ? 1 : phase === 'stepping' ? 0.92 : 0;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{ transition: 'opacity 250ms ease', opacity }}
      onTouchStart={onTS}
      onTouchEnd={onTE}
    >
      {/* ── Overlay with spotlight cutout ────────────────────── */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spot && (
              <rect
                x={spot.x} y={spot.y} width={spot.w} height={spot.h}
                rx="12" ry="12" fill="black"
                style={{ transition: 'all 450ms cubic-bezier(.4,0,.2,1)' }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Tap-away to dismiss */}
      <div className="absolute inset-0" onClick={skip} />

      {/* ── Spotlight border ─────────────────────────────────── */}
      {spot && (
        <div
          className="absolute pointer-events-none rounded-xl"
          style={{
            top: spot.y - 1, left: spot.x - 1,
            width: spot.w + 2, height: spot.h + 2,
            border: '1.5px solid rgba(96, 165, 250, 0.7)',
            boxShadow: '0 0 0 1px rgba(96,165,250,0.15), 0 0 24px rgba(96,165,250,0.2)',
            transition: 'all 450ms cubic-bezier(.4,0,.2,1)',
            animation: 'tour-glow 2.5s ease-in-out infinite',
          }}
        />
      )}

      {/* ── Tooltip ──────────────────────────────────────────── */}
      <div
        className="absolute z-10"
        style={{
          ...tooltipPos(),
          pointerEvents: 'auto',
          transition: 'all 400ms cubic-bezier(.4,0,.2,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          {/* Arrow */}
          {arrowStyle() && <div style={arrowStyle()!} />}

          {/* Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(30, 58, 138, 0.95)',
              backdropFilter: 'blur(20px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(96,165,250,0.15)',
            }}
          >
            <div className="px-4 pt-3.5 pb-3">
              {/* Title row */}
              <div className="flex items-center justify-between mb-1">
                <h3
                  className="text-[13px] font-semibold tracking-tight"
                  style={{ color: '#93C5FD', letterSpacing: '-0.01em' }}
                >
                  {current.title}
                </h3>
                <button
                  onClick={skip}
                  className="w-5 h-5 rounded-full flex items-center justify-center ml-3 flex-shrink-0 active:scale-90 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <X className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.5)' }} />
                </button>
              </div>

              {/* Body */}
              <p
                className="text-[12px] leading-[1.5] font-normal"
                style={{ color: 'rgba(255,255,255,0.78)' }}
              >
                {current.body}
              </p>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Dots */}
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? 14 : 5,
                      height: 5,
                      background: i === step
                        ? '#60A5FA'
                        : i < step
                          ? 'rgba(96,165,250,0.4)'
                          : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>

              {/* Nav */}
              <div className="flex items-center gap-1.5">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg active:scale-95 transition-all"
                    style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)' }}
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-lg active:scale-95 transition-all"
                  style={{
                    color: '#1E3A8A',
                    background: '#60A5FA',
                    boxShadow: '0 2px 8px rgba(96,165,250,0.35)',
                  }}
                >
                  {isLast ? 'Done' : 'Next'}
                  {!isLast && <ArrowRight className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Skip link - only on first step */}
            {step === 0 && (
              <div
                className="flex items-center justify-center pb-2.5 gap-3"
              >
                <button
                  onClick={skip}
                  className="text-[10px] font-medium active:scale-95 transition-all"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Skip tour
                </button>
                <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                <button
                  onClick={neverShow}
                  className="text-[10px] font-medium active:scale-95 transition-all"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  Don't show again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes tour-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(96,165,250,0.15), 0 0 24px rgba(96,165,250,0.15); }
          50% { box-shadow: 0 0 0 1px rgba(96,165,250,0.25), 0 0 32px rgba(96,165,250,0.3); }
        }
      `}</style>
    </div>
  );
}