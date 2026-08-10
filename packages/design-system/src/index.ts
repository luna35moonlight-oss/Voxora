/**
 * Voxora design tokens — premium dark interface with pink / purple / blue.
 * Playful without childish. Not a generic corporate dashboard.
 */
export const colors = {
  background: {
    base: '#0B0614',
    elevated: '#151022',
    soft: '#1C1430',
  },
  brand: {
    pink: '#FF4FA3',
    purple: '#8B5CF6',
    blue: '#4CC9F0',
  },
  text: {
    primary: '#F7F2FF',
    secondary: '#B7A9D9',
    muted: '#7E719E',
    inverse: '#140B1F',
  },
  state: {
    success: '#3DDC97',
    warning: '#F6C945',
    error: '#FF5C7A',
    info: '#4CC9F0',
    locked: '#6B5B8C',
    focus: '#C084FC',
  },
  border: {
    subtle: '#2A203F',
    strong: '#4A3A6A',
  },
} as const;

export const typography = {
  fontFamily: {
    display: 'System',
    body: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    hero: 36,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.6,
  },
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const elevation = {
  none: 0,
  low: 2,
  mid: 6,
  high: 12,
} as const;

export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  elevation,
  motion,
} as const;

export type VoxoraTokens = typeof tokens;
