import { StyleSheet, Text, View } from 'react-native';

import { Mono } from '@/components/ui/Mono';
import { colors, type } from '@/theme/tokens';

/** Six thin bars, the first `step` filled mint. */
export function StepProgress({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <View style={styles.bars} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: total, now: step }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.bar, { backgroundColor: i < step ? colors.mint : colors.border }]} />
      ))}
    </View>
  );
}

/** "Step 1 of 6" with the numbers in mono. */
export function StepLabel({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <Text style={styles.label}>
      Step <Mono size="small" style={styles.num}>{step}</Mono> of <Mono size="small" style={styles.num}>{total}</Mono>
    </Text>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 3, borderRadius: 99 },
  label: { ...type.caption, color: colors.textFaint },
  num: { color: colors.textFaint },
});
