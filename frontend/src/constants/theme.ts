import { Platform } from 'react-native';

export const COLORS = {
  // ===== Primary — Medical Blue (from hospital logo) =====
  primary: '#1E40AF',
  primaryDark: '#1E3A8A',
  primaryLight: '#3B82F6',
  primaryPale: '#DBEAFE',

  // ===== Accent — Hospital Orange (restrained) =====
  accent: '#EA580C',
  accentLight: '#FDBA74',
  accentPale: '#FFEDD5',

  // ===== Secondary — Healthcare blue =====
  secondary: '#0284C7',
  secondaryLight: '#E0F2FE',
  secondaryPale: '#7DD3FC',

  // ===== Neutral Surfaces =====
  background: '#F8FAFC',
  backgroundAlt: '#F1F5FA',
  backgroundSection: '#F0F4FA',
  heroBg: '#F0F9FF',
  promoBg: '#FFF7F0',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  divider: '#E2E8F0',

  // ===== Typography =====
  text: '#0F172A',
  textDark: '#0B1220',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textDisabled: '#94A3B8',

  // ===== Status =====
  success: '#059669',
  successPale: '#D1FAE5',
  warning: '#D97706',
  warningPale: '#FEF3C7',
  danger: '#DC2626',
  dangerPale: '#FEE2E2',
  info: '#0284C7',
  infoPale: '#E0F2FE',

  // ===== Paper form replica (unchanged) =====
  paperBg: '#FFFFFF',
  paperText: '#1E293B',
  paperBorder: '#0F172A',
  paperLine: '#334155',
  paperDotted: '#64748B',
};

export const FONT_FAMILY = {
  body: Platform.OS === 'ios' ? '-apple-system' : 'Roboto',
  heading: Platform.OS === 'ios' ? '-apple-system' : 'Roboto',
  mono: 'monospace',
  serif: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
  hero: 32,
};

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xl2: 20,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  flat: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const TYPOGRAPHY = {
  // Page titles
  pageTitle: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.black,
    lineHeight: 34,
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY.heading,
    letterSpacing: -0.5,
  },
  // Section headers
  sectionTitle: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
    letterSpacing: 0.3,
  },
  // Body text
  body: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: 22,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: 18,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
  },
  // Metadata / labels
  caption: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
  },
  meta: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY.body,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
};

export const ELEVATION = {
  none: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  low: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
};
