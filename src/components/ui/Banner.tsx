import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { colors, type } from '@/theme/tokens';

type BannerTone = 'warn' | 'danger' | 'info' | 'mint';

const palette: Record<BannerTone, { bg: string; border: string; icon: string; body: string }> = {
  warn: { bg: colors.warnBg, border: colors.warnBorder, icon: colors.warn, body: colors.warnText },
  danger: { bg: colors.dangerBg, border: colors.dangerBorder, icon: colors.danger, body: colors.dangerText },
  info: { bg: colors.indigoTint, border: colors.indigoBorder, icon: colors.indigoBright, body: '#C8C2FF' },
  mint: { bg: colors.mintTint, border: colors.mintBorder, icon: colors.mintText, body: colors.mintText },
};

type Props = {
  tone: BannerTone;
  icon: IconName;
  title: string;
  body?: React.ReactNode;
  /** Buttons row under the text (e.g. "Send tail car", "Call"). */
  actions?: React.ReactNode;
  /** Put a single action to the right of the text instead of below it. */
  actionsInline?: boolean;
};

/** Alert card used for breakdowns, gaps and warnings (L6). */
export function Banner({ tone, icon, title, body, actions, actionsInline }: Props) {
  const p = palette[tone];
  return (
    <View accessibilityRole="alert" style={[styles.wrap, { backgroundColor: p.bg, borderColor: p.border }]}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Icon name={icon} size={20} color={p.icon} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={[styles.body, { color: p.body }]}>{body}</Text> : null}
        </View>
        {actionsInline ? actions : null}
      </View>
      {!actionsInline && actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { alignSelf: 'flex-start', marginTop: 1 },
  text: { flex: 1, gap: 2 },
  title: { ...type.body, fontFamily: type.subtitle.fontFamily, fontSize: 15, lineHeight: 20 },
  body: { ...type.caption, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: 8 },
});
