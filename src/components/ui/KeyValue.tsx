import { StyleSheet, Text, View } from 'react-native';

import { Mono } from '@/components/ui/Mono';
import { colors, type } from '@/theme/tokens';

/** "ARRIVE / 17:15": eyebrow over a value. Pass `mono` for times and numbers. */
export function KeyValue({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        mono ? <Mono>{value}</Mono> : <Text style={styles.value}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  label: { ...type.caption, fontSize: 12, lineHeight: 16, color: colors.textFaint },
  value: { ...type.body, fontSize: 15, lineHeight: 20 },
});
