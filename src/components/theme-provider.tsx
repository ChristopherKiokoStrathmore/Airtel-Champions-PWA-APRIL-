import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Theme Definitions ──────────────────────────────────────────────────────
// Inspired by Steve Jobs' obsession with simplicity, craftsmanship, and delight.
// Each theme is a complete visual system — not just colors, but personality.

export interface ThemeColors {
  // Core brand
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryGradientFrom: string;
  primaryGradientTo: string;
  // Accents
  accent: string;
  accentLight: string;
  // Surfaces
  bgPage: string;
  bgCard: string;
  bgCardHover: string;
  bgSubtle: string;
  bgInput: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  // Borders
  border: string;
  borderLight: string;
  borderFocus: string;
  // Status
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;
  // Shadows
  shadowColor: string;
  // Header
  headerBg: string;
  headerText: string;
  // Bottom Nav
  navBg: string;
  navText: string;
  navActive: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: ThemeColors;
  isDark: boolean;
}

export const themes: Theme[] = [
  {
    id: 'airtel-classic',
    name: 'Airtel Classic',
    description: 'The iconic red — bold, confident, unmistakable',
    icon: '🔴',
    isDark: false,
    colors: {
      primary: '#E60000',
      primaryHover: '#CC0000',
      primaryLight: '#FEF2F2',
      primaryGradientFrom: '#E60000',
      primaryGradientTo: '#B91C1C',
      accent: '#F59E0B',
      accentLight: '#FEF3C7',
      bgPage: '#F9FAFB',
      bgCard: '#FFFFFF',
      bgCardHover: '#F3F4F6',
      bgSubtle: '#F3F4F6',
      bgInput: '#F9FAFB',
      textPrimary: '#111827',
      textSecondary: '#4B5563',
      textMuted: '#9CA3AF',
      textOnPrimary: '#FFFFFF',
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      borderFocus: '#E60000',
      success: '#059669',
      successLight: '#ECFDF5',
      warning: '#D97706',
      warningLight: '#FFFBEB',
      danger: '#DC2626',
      dangerLight: '#FEF2F2',
      info: '#2563EB',
      infoLight: '#EFF6FF',
      shadowColor: 'rgba(0,0,0,0.08)',
      headerBg: 'linear-gradient(135deg, #E60000, #B91C1C)',
      headerText: '#FFFFFF',
      navBg: '#FFFFFF',
      navText: '#6B7280',
      navActive: '#E60000',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Sleek and sophisticated — for those who work late',
    icon: '🌙',
    isDark: true,
    colors: {
      primary: '#818CF8',
      primaryHover: '#6366F1',
      primaryLight: '#1E1B4B',
      primaryGradientFrom: '#6366F1',
      primaryGradientTo: '#4F46E5',
      accent: '#F472B6',
      accentLight: '#831843',
      bgPage: '#0F172A',
      bgCard: '#1E293B',
      bgCardHover: '#334155',
      bgSubtle: '#1E293B',
      bgInput: '#0F172A',
      textPrimary: '#F1F5F9',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      textOnPrimary: '#FFFFFF',
      border: '#334155',
      borderLight: '#1E293B',
      borderFocus: '#818CF8',
      success: '#34D399',
      successLight: '#064E3B',
      warning: '#FBBF24',
      warningLight: '#78350F',
      danger: '#FB7185',
      dangerLight: '#881337',
      info: '#60A5FA',
      infoLight: '#1E3A5F',
      shadowColor: 'rgba(0,0,0,0.3)',
      headerBg: 'linear-gradient(135deg, #1E293B, #0F172A)',
      headerText: '#F1F5F9',
      navBg: '#1E293B',
      navText: '#64748B',
      navActive: '#818CF8',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calm, trustworthy — like the deep blue sea',
    icon: '🌊',
    isDark: false,
    colors: {
      primary: '#0891B2',
      primaryHover: '#0E7490',
      primaryLight: '#ECFEFF',
      primaryGradientFrom: '#0891B2',
      primaryGradientTo: '#0E7490',
      accent: '#8B5CF6',
      accentLight: '#EDE9FE',
      bgPage: '#F0FDFA',
      bgCard: '#FFFFFF',
      bgCardHover: '#F0FDFA',
      bgSubtle: '#F0FDFA',
      bgInput: '#F0FDFA',
      textPrimary: '#134E4A',
      textSecondary: '#3B7A75',
      textMuted: '#6B9F9A',
      textOnPrimary: '#FFFFFF',
      border: '#B2DFDB',
      borderLight: '#E0F2F1',
      borderFocus: '#0891B2',
      success: '#059669',
      successLight: '#ECFDF5',
      warning: '#D97706',
      warningLight: '#FFFBEB',
      danger: '#E11D48',
      dangerLight: '#FFF1F2',
      info: '#0891B2',
      infoLight: '#ECFEFF',
      shadowColor: 'rgba(8,145,178,0.08)',
      headerBg: 'linear-gradient(135deg, #0891B2, #0E7490)',
      headerText: '#FFFFFF',
      navBg: '#FFFFFF',
      navText: '#6B9F9A',
      navActive: '#0891B2',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm and energetic — golden hour vibes',
    icon: '🌅',
    isDark: false,
    colors: {
      primary: '#EA580C',
      primaryHover: '#C2410C',
      primaryLight: '#FFF7ED',
      primaryGradientFrom: '#EA580C',
      primaryGradientTo: '#DC2626',
      accent: '#7C3AED',
      accentLight: '#EDE9FE',
      bgPage: '#FFFBEB',
      bgCard: '#FFFFFF',
      bgCardHover: '#FFF7ED',
      bgSubtle: '#FEF3C7',
      bgInput: '#FFFBEB',
      textPrimary: '#78350F',
      textSecondary: '#92400E',
      textMuted: '#B45309',
      textOnPrimary: '#FFFFFF',
      border: '#FDE68A',
      borderLight: '#FEF3C7',
      borderFocus: '#EA580C',
      success: '#059669',
      successLight: '#ECFDF5',
      warning: '#D97706',
      warningLight: '#FFFBEB',
      danger: '#DC2626',
      dangerLight: '#FEF2F2',
      info: '#2563EB',
      infoLight: '#EFF6FF',
      shadowColor: 'rgba(234,88,12,0.1)',
      headerBg: 'linear-gradient(135deg, #EA580C, #DC2626)',
      headerText: '#FFFFFF',
      navBg: '#FFFFFF',
      navText: '#B45309',
      navActive: '#EA580C',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural and grounded — earth tones for focus',
    icon: '🌲',
    isDark: false,
    colors: {
      primary: '#059669',
      primaryHover: '#047857',
      primaryLight: '#ECFDF5',
      primaryGradientFrom: '#059669',
      primaryGradientTo: '#047857',
      accent: '#D97706',
      accentLight: '#FFFBEB',
      bgPage: '#F0FDF4',
      bgCard: '#FFFFFF',
      bgCardHover: '#F0FDF4',
      bgSubtle: '#DCFCE7',
      bgInput: '#F0FDF4',
      textPrimary: '#14532D',
      textSecondary: '#166534',
      textMuted: '#16A34A',
      textOnPrimary: '#FFFFFF',
      border: '#BBF7D0',
      borderLight: '#DCFCE7',
      borderFocus: '#059669',
      success: '#059669',
      successLight: '#ECFDF5',
      warning: '#D97706',
      warningLight: '#FFFBEB',
      danger: '#DC2626',
      dangerLight: '#FEF2F2',
      info: '#2563EB',
      infoLight: '#EFF6FF',
      shadowColor: 'rgba(5,150,105,0.08)',
      headerBg: 'linear-gradient(135deg, #059669, #047857)',
      headerText: '#FFFFFF',
      navBg: '#FFFFFF',
      navText: '#16A34A',
      navActive: '#059669',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Pure, minimal — let the content speak',
    icon: '⚪',
    isDark: false,
    colors: {
      primary: '#18181B',
      primaryHover: '#27272A',
      primaryLight: '#F4F4F5',
      primaryGradientFrom: '#18181B',
      primaryGradientTo: '#3F3F46',
      accent: '#18181B',
      accentLight: '#F4F4F5',
      bgPage: '#FAFAFA',
      bgCard: '#FFFFFF',
      bgCardHover: '#F4F4F5',
      bgSubtle: '#F4F4F5',
      bgInput: '#FAFAFA',
      textPrimary: '#18181B',
      textSecondary: '#52525B',
      textMuted: '#A1A1AA',
      textOnPrimary: '#FFFFFF',
      border: '#E4E4E7',
      borderLight: '#F4F4F5',
      borderFocus: '#18181B',
      success: '#18181B',
      successLight: '#F4F4F5',
      warning: '#18181B',
      warningLight: '#F4F4F5',
      danger: '#18181B',
      dangerLight: '#F4F4F5',
      info: '#18181B',
      infoLight: '#F4F4F5',
      shadowColor: 'rgba(0,0,0,0.06)',
      headerBg: 'linear-gradient(135deg, #18181B, #3F3F46)',
      headerText: '#FFFFFF',
      navBg: '#FFFFFF',
      navText: '#A1A1AA',
      navActive: '#18181B',
    },
  },
];

// ─── Context ─────────────────────────────────────────────────────────────────

interface ThemeContextType {
  theme: Theme;
  setThemeById: (id: string) => void;
  allThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes[0],
  setThemeById: () => {},
  allThemes: themes,
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

const THEME_STORAGE_KEY = 'airtel_champions_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const found = themes.find(t => t.id === saved);
        if (found) return found;
      }
    } catch {}
    return themes[0];
  });

  const setThemeById = useCallback((id: string) => {
    const found = themes.find(t => t.id === id);
    if (found) {
      setTheme(found);
      localStorage.setItem(THEME_STORAGE_KEY, id);
    }
  }, []);

  // Apply CSS custom properties to document root
  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;
    root.style.setProperty('--theme-primary', c.primary);
    root.style.setProperty('--theme-primary-hover', c.primaryHover);
    root.style.setProperty('--theme-primary-light', c.primaryLight);
    root.style.setProperty('--theme-bg-page', c.bgPage);
    root.style.setProperty('--theme-bg-card', c.bgCard);
    root.style.setProperty('--theme-bg-card-hover', c.bgCardHover);
    root.style.setProperty('--theme-bg-subtle', c.bgSubtle);
    root.style.setProperty('--theme-text-primary', c.textPrimary);
    root.style.setProperty('--theme-text-secondary', c.textSecondary);
    root.style.setProperty('--theme-text-muted', c.textMuted);
    root.style.setProperty('--theme-text-on-primary', c.textOnPrimary);
    root.style.setProperty('--theme-border', c.border);
    root.style.setProperty('--theme-border-light', c.borderLight);
    root.style.setProperty('--theme-shadow', c.shadowColor);
    root.style.setProperty('--theme-nav-bg', c.navBg);
    root.style.setProperty('--theme-nav-text', c.navText);
    root.style.setProperty('--theme-nav-active', c.navActive);
    root.style.setProperty('--theme-success', c.success);
    root.style.setProperty('--theme-danger', c.danger);
    root.style.setProperty('--theme-gradient-from', c.primaryGradientFrom);
    root.style.setProperty('--theme-gradient-to', c.primaryGradientTo);
    root.style.setProperty('--theme-accent', c.accent);
    root.style.setProperty('--theme-accent-light', c.accentLight);
    root.style.setProperty('--theme-bg-input', c.bgInput);
    root.style.setProperty('--theme-warning', c.warning);
    root.style.setProperty('--theme-info', c.info);
    root.style.setProperty('--theme-border-focus', c.borderFocus);

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', c.primary);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setThemeById, allThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Utility: Get themed class names ─────────────────────────────────────────
// These are helper functions that return inline styles for themed elements
// since Tailwind can't dynamically generate classes from JS variables.

export function themedStyles(colors: ThemeColors) {
  return {
    page: { backgroundColor: colors.bgPage, color: colors.textPrimary },
    card: {
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
      boxShadow: `0 1px 3px ${colors.shadowColor}`,
    },
    cardHover: {
      backgroundColor: colors.bgCardHover,
    },
    primaryButton: {
      background: `linear-gradient(135deg, ${colors.primaryGradientFrom}, ${colors.primaryGradientTo})`,
      color: colors.textOnPrimary,
    },
    header: {
      background: colors.headerBg,
      color: colors.headerText,
    },
    input: {
      backgroundColor: colors.bgInput,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
    badge: (type: 'success' | 'warning' | 'danger' | 'info') => ({
      backgroundColor: colors[`${type}Light`],
      color: colors[type],
    }),
  };
}