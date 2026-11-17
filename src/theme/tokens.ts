import { Easing } from 'react-native-reanimated';

/**
 * Parade v2 visual system (docs/design/README.md §6).
 * Dark everywhere. Onyx ground, indigo for other people and crew roles,
 * mint for the one thing that matters on each screen.
 */
export const colors = {
  onyx: '#0B0B10',
  bg: '#0B0B10',
  mapBg: '#0D0D12',
  surface: '#14141C',
  surfaceRaised: '#1C1C27',
  sheet: '#121219',
  border: '#23233A',
  borderStrong: '#2F2F4A',
  divider: '#1E1E2E',

  text: '#F3F3F8',
  textMuted: '#A7A7BC',
  textFaint: '#8C8CA4',
  placeholder: '#85859C',

  mint: '#5EF2B5',
  mintPressed: '#4FD9A1',
  mintInk: '#04150E',
  mintText: '#6FF5BE',
  mintTint: '#0E241C',
  mintBorder: '#1E5A43',

  indigo: '#7C6CFF',
  indigoBright: '#B0A6FF',
  indigoTint: '#1A1736',
  indigoBorder: '#3A3275',
  indigoText2: '#C8C2FF',

  warn: '#FFCB6B',
  warnText: '#FFE1A6',
  warnBg: '#261F0F',
  warnBorder: '#574619',

  danger: '#FF8A94',
  dangerSolid: '#FF5C6C',
  dangerText: '#FFB3BA',
  dangerBg: '#2A1118',
  dangerBorder: '#5C2532',

  white: '#F3F3F8',
  scrim: 'rgba(4, 4, 8, 0.72)',
} as const;

/** Font families. Loaded in the root layout; fall back to system fonts until then. */
export const font = {
  sans: 'Geist_500Medium',
  sansRegular: 'Geist_400Regular',
  sansSemi: 'Geist_600SemiBold',
  sansBold: 'Geist_700Bold',
  mono: 'GeistMono_500Medium',
  monoSemi: 'GeistMono_600SemiBold',
} as const;

export const radius = {
  xs: 10,
  sm: 13,
  md: 14,
  input: 14,
  card: 18,
  lg: 20,
  button: 18,
  xl: 24,
  sheet: 28,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 32,
} as const;

/** Text presets. Numbers always use `type.mono*`. */
export const type = {
  display: { fontFamily: font.sansBold, fontSize: 32, letterSpacing: -0.9, lineHeight: 36, color: colors.text },
  h1: { fontFamily: font.sansBold, fontSize: 26, letterSpacing: -0.6, lineHeight: 30, color: colors.text },
  title: { fontFamily: font.sansBold, fontSize: 20, letterSpacing: -0.4, lineHeight: 24, color: colors.text },
  subtitle: { fontFamily: font.sansSemi, fontSize: 17, letterSpacing: -0.2, lineHeight: 22, color: colors.text },
  body: { fontFamily: font.sans, fontSize: 16, lineHeight: 22, color: colors.text },
  bodyRegular: { fontFamily: font.sansRegular, fontSize: 16, lineHeight: 22, color: colors.text },
  label: { fontFamily: font.sans, fontSize: 14, lineHeight: 18, color: colors.textMuted },
  caption: { fontFamily: font.sans, fontSize: 13, lineHeight: 17, color: colors.textFaint },
  eyebrow: { fontFamily: font.sansSemi, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, color: colors.textFaint },
  button: { fontFamily: font.sansSemi, fontSize: 17, lineHeight: 22 },
  mono: { fontFamily: font.mono, fontSize: 16, lineHeight: 20, color: colors.text, fontVariant: ['tabular-nums'] as const },
  monoLarge: { fontFamily: font.monoSemi, fontSize: 32, letterSpacing: -1, lineHeight: 34, color: colors.text, fontVariant: ['tabular-nums'] as const },
  monoHero: { fontFamily: font.monoSemi, fontSize: 44, letterSpacing: -1.8, lineHeight: 46, color: colors.text, fontVariant: ['tabular-nums'] as const },
  monoSmall: { fontFamily: font.mono, fontSize: 13, lineHeight: 16, color: colors.text, fontVariant: ['tabular-nums'] as const },
} as const;

/** Motion: 160 ms press scale, 200–250 ms sheets, cubic-bezier(0.23,1,0.32,1). */
export const ease = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
} as const;

export const duration = { press: 160, sheet: 240, fade: 200 } as const;
