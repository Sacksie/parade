import { StyleSheet, Text, View } from 'react-native';

import { Mono } from '@/components/ui';
import { colors, font } from '@/theme/tokens';

type Props = {
  /** 'on' mint dot, 'off' amber "Off route", 'stopped' indigo "Stopped". */
  status: 'on' | 'off' | 'stopped';
  rank: number;
  total: number;
};

const LABEL = { on: 'On route', off: 'Off route', stopped: 'Stopped' } as const;

/** "On route · Car 42 of 87", bottom-left over the map. */
export function StatusPill({ status, rank, total }: Props) {
  const off = status === 'off';
  const dot = off ? colors.warn : status === 'stopped' ? colors.indigoBright : colors.mint;
  return (
    <View
      accessibilityLabel={`${LABEL[status]}. Car ${rank} of ${total}`}
      accessibilityLiveRegion="polite"
      style={[styles.pill, off && styles.off]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.label, off && { color: colors.warn }]}>{LABEL[status]}</Text>
      {rank > 0 ? (
        <>
          <View style={[styles.divider, off && { backgroundColor: colors.warnBorder }]} />
          <Text style={styles.muted}>
            Car <Mono style={styles.num}>{rank}</Mono> of <Mono style={styles.numMuted}>{total}</Mono>
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
  },
  off: { backgroundColor: colors.warnBg, borderColor: colors.warnBorder },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: font.sans, fontSize: 14, lineHeight: 18, color: colors.text },
  divider: { width: 1, height: 14, backgroundColor: colors.borderStrong },
  muted: { fontFamily: font.sansRegular, fontSize: 14, lineHeight: 18, color: colors.textMuted },
  num: { fontSize: 14, lineHeight: 18, color: colors.text },
  numMuted: { fontSize: 14, lineHeight: 18, color: colors.textMuted },
});
