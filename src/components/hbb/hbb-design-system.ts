// HBB Design System - Consistent UI/UX Constants
export const HBB_DESIGN_SYSTEM = {
  // Spacing scale (4px base)
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },
  
  // Border radius
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.25rem', // 20px
  },
  
  // Colors
  colors: {
    primary: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  
  // Typography
  typography: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
} as const;

// Helper functions for consistent styling
export const hbb = {
  spacing: (value: keyof typeof HBB_DESIGN_SYSTEM.spacing) => HBB_DESIGN_SYSTEM.spacing[value],
  radius: (value: keyof typeof HBB_DESIGN_SYSTEM.radius) => HBB_DESIGN_SYSTEM.radius[value],
  color: (color: string, shade: number = 500) => HBB_DESIGN_SYSTEM.colors[color as keyof typeof HBB_DESIGN_SYSTEM.colors]?.[shade as keyof typeof HBB_DESIGN_SYSTEM.colors.primary] || color,
  shadow: (value: keyof typeof HBB_DESIGN_SYSTEM.shadows) => HBB_DESIGN_SYSTEM.shadows[value],
  transition: (value: keyof typeof HBB_DESIGN_SYSTEM.transitions) => HBB_DESIGN_SYSTEM.transitions[value],
  typography: (size: keyof typeof HBB_DESIGN_SYSTEM.typography) => {
    const [fontSize, styles] = HBB_DESIGN_SYSTEM.typography[size];
    return { fontSize, ...styles };
  },
  textColor: (level: 'primary' | 'secondary' | 'tertiary' | 'inverse') => {
    switch (level) {
      case 'primary': return hbb.color('gray', 900);
      case 'secondary': return hbb.color('gray', 600);
      case 'tertiary': return hbb.color('gray', 500);
      case 'inverse': return '#FFFFFF';
      default: return hbb.color('gray', 700);
    }
  },
};
