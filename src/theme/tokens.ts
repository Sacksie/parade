import { Easing } from 'react-native-reanimated';

/**
 * Parade palette: onyx base, indigo for "choosing" moments (calendar, wheel
 * selection), mint for primary actions and progress.
 */
export const colors = {
  onyx: '#0A0A0E',
  surface: '#14141B',
  surfaceRaised: '#1B1B25',
  border: '#262635',
  borderStrong: '#34344A',

  text: '#F5F5F7',
  textMuted: '#9C9CB0',
  textFaint: '#6B6B80',

  mint: '#86EFBF',
  mintPressed: '#6FE3AD',
  mintInk: '#05130C',
  mintTint: 'rgba(134, 239, 191, 0.12)',

  indigo: '#6366F1',
  indigoBright: '#818CF8',
  indigoTint: 'rgba(99, 102, 241, 0.16)',
  indigoBorder: 'rgba(129, 140, 248, 0.35)',

  danger: '#F87171',
  scrim: 'rgba(4, 4, 8, 0.72)',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const type = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8, color: colors.text },
  title: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.text },
  body: { fontSize: 17, fontWeight: '500' as const, color: colors.text },
  label: { fontSize: 15, fontWeight: '600' as const, color: colors.textMuted },
  caption: { fontSize: 14, fontWeight: '500' as const, color: colors.textMuted },
} as const;

/** Strong curves — the built-in easings are too soft. */
export const ease = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
} as const;
