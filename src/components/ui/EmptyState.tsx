import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '@/theme/tokens';

type Props = { title: string; body?: string; action?: React.ReactNode };

/** A little convoy of indigo cars, a title, a sentence. */
export function EmptyState({ title, body, action }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.road}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.car, { opacity: 1 - i * 0.3 }]} />
        ))}
      </View>
      <Text style={type.title}>{title}</Text>
      {body ? <Text style={[type.caption, styles.body]}>{body}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl },
  road: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  car: { width: 40, height: 20, borderRadius: radius.xs, backgroundColor: colors.indigo },
  body: { textAlign: 'center' },
});
