import { StyleSheet, Text, View } from 'react-native';

import { Mono } from '@/components/ui/Mono';
import { colors, radius, type } from '@/theme/tokens';

type Props = {
  value: string | number;
  label: string;
  /** 'compact' is the 3-up route stats; 'big' is the 30 px 2-up tiles (I1, F1). */
  size?: 'compact' | 'big';
};

export function StatTile({ value, label, size = 'compact' }: Props) {
  const big = size === 'big';
  return (
    <View style={[styles.tile, big ? styles.big : styles.compact]}>
      <Mono style={big ? styles.valueBig : styles.valueCompact}>{value}</Mono>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

/** Equal-width tiles on one line, or wrapped two per row when `columns` is 2. */
export function StatRow({ children, columns }: { children: React.ReactNode; columns?: 2 | 3 }) {
  return <View style={[styles.row, columns === 2 && styles.row2]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  row2: { flexWrap: 'wrap', gap: 10 },
  tile: { flex: 1, minWidth: '40%', gap: 2, backgroundColor: colors.surface },
  compact: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, minWidth: 0 },
  big: { padding: 14, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border },
  valueCompact: { fontSize: 18, lineHeight: 22 },
  valueBig: { ...type.monoLarge, fontSize: 30, lineHeight: 34 },
  label: { ...type.caption, fontSize: 12, lineHeight: 16, color: colors.textFaint },
});
