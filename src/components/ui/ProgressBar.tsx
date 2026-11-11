import { StyleSheet, Text, View } from 'react-native';

import { Mono } from '@/components/ui/Mono';
import { colors, type } from '@/theme/tokens';

type Props = {
  /** 0..1 */
  value: number;
  tone?: 'mint' | 'indigo';
  height?: number;
  accessibilityLabel?: string;
};

export function ProgressBar({ value, tone = 'mint', height = 5, accessibilityLabel }: Props) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.track, { height }]}>
      <View style={{ width: `${pct * 100}%`, height, backgroundColor: tone === 'mint' ? colors.mint : colors.indigo }} />
    </View>
  );
}

/** A2 readiness row: label, bar, mono "61/64". */
export function ReadinessRow({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.bar}>
        <ProgressBar value={total ? done / total : 0} accessibilityLabel={label} />
      </View>
      <Mono size="small" style={styles.count}>
        {done}/{total}
      </Mono>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 99, backgroundColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { ...type.label, width: 120 },
  bar: { flex: 1 },
  count: { width: 52, textAlign: 'right', fontSize: 14 },
});
