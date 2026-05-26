/**
 * Dashboard design primitives — shared across Shujaa, Networks, and any
 * future role-specific dashboards. Keeps visual language consistent without
 * coupling to the generic shadcn layer.
 */

import React from 'react';
import { AlertCircle, CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from './utils';

// ── Typography ────────────────────────────────────────────────

/** Small all-caps section heading used above card groups. */
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400', className)}>
      {children}
    </p>
  );
}

// ── Surfaces ──────────────────────────────────────────────────

/** White rounded card with a consistent drop shadow. */
export function DashCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl bg-white shadow-[0_1px_8px_rgba(15,23,42,0.05)]', className)}>
      {children}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────

/** Derive two-letter initials from a name string. */
export function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.trim().slice(0, 2).toUpperCase() || '??';
}

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const avatarSizeMap: Record<AvatarSize, string> = {
  xs: 'h-7 w-7 rounded-lg text-xs',
  sm: 'h-9 w-9 rounded-xl text-xs',
  md: 'h-10 w-10 rounded-xl text-sm',
  lg: 'h-[52px] w-[52px] rounded-[14px] text-sm',
};

/**
 * Rounded-square initials avatar. Pass `style` to set a custom background
 * (e.g. the Airtel red gradient for the Shujaa hero).
 */
export function InitialsAvatar({
  name,
  size = 'md',
  className,
  style,
}: {
  name: string;
  size?: AvatarSize;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center bg-slate-100 font-black text-slate-600',
        avatarSizeMap[size],
        className,
      )}
      style={style}
    >
      {makeInitials(name)}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────

/**
 * Full-section empty state: icon in a soft tile, title, description, and an
 * optional primary action button.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconStyle,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  iconStyle?: React.CSSProperties;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100"
        style={iconStyle}
      >
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-[15px] font-black text-slate-950">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-[200px] text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ── Feedback banners ──────────────────────────────────────────

/** Inline error or success banner with an icon and message. */
export function FeedbackBanner({
  type,
  children,
}: {
  type: 'error' | 'success';
  children: React.ReactNode;
}) {
  const isError = type === 'error';
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-4 py-3',
        isError ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50',
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      )}
      <p className={cn('text-sm font-medium', isError ? 'text-red-700' : 'text-emerald-700')}>
        {children}
      </p>
    </div>
  );
}

// ── Buttons ───────────────────────────────────────────────────

/** 36 × 36 icon-only action button. Pass `danger` to get red hover. */
export function IconButton({
  children,
  onClick,
  title,
  danger = false,
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  danger?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition active:scale-95 disabled:pointer-events-none disabled:opacity-40',
        danger
          ? 'hover:bg-red-50 hover:text-red-500'
          : 'hover:bg-slate-100 hover:text-slate-700',
        className,
      )}
    >
      {children}
    </button>
  );
}

// ── Loading skeletons ─────────────────────────────────────────

/** Single animated pulse block — pass className to set size and shape. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-slate-100', className)} />;
}

/** A pre-built skeleton card shaped like an issue/customer row. */
export function SkeletonIssueCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-stretch">
        <SkeletonBlock className="w-1 shrink-0" />
        <div className="flex-1 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-2.5 w-24 rounded-full" />
              <SkeletonBlock className="h-3.5 w-40 rounded-full" />
              <SkeletonBlock className="h-3 w-52 rounded-full" />
            </div>
            <SkeletonBlock className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex gap-3">
            <SkeletonBlock className="h-2.5 w-20 rounded-full" />
            <SkeletonBlock className="h-2.5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A pre-built skeleton card shaped like a customer list row. */
export function SkeletonCustomerCard() {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
      <SkeletonBlock className="h-11 w-11 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2.5">
        <SkeletonBlock className="h-3 w-32 rounded-full" />
        <SkeletonBlock className="h-2.5 w-20 rounded-full" />
      </div>
      <SkeletonBlock className="h-2.5 w-10 rounded-full" />
    </div>
  );
}

// ── Page backgrounds ──────────────────────────────────────────

/** The standard light gray Apple-style page background used across dashboards. */
export const PAGE_BG = '#f5f5f7';
