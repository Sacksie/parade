import { colors } from '@/theme/tokens';

export type Tone = 'mint' | 'indigo' | 'warn' | 'danger' | 'neutral';

/** Tinted surface palettes shared by pills, cards, banners and rows. */
export const tones: Record<Tone, { bg: string; border: string; fg: string }> = {
  mint: { bg: colors.mintTint, border: colors.mintBorder, fg: colors.mintText },
  indigo: { bg: colors.indigoTint, border: colors.indigoBorder, fg: colors.indigoBright },
  warn: { bg: colors.warnBg, border: colors.warnBorder, fg: colors.warn },
  danger: { bg: colors.dangerBg, border: colors.dangerBorder, fg: colors.danger },
  neutral: { bg: colors.surface, border: colors.border, fg: colors.textMuted },
};
