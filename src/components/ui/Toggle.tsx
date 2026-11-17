import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { select } from '@/components/ui/haptics';
import { colors, duration, ease, type } from '@/theme/tokens';

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
};

const W = 52;
const H = 32;
const KNOB = 26;
const PAD = 3;

/** The 52×32 switch from C5/C6. Mint when on. Pass `label` to get a full row. */
export function Toggle({ value, onChange, label, description }: Props) {
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    x.set(withTiming(value ? 1 : 0, { duration: duration.press, easing: ease.out }));
  }, [value, x]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() * (W - KNOB - PAD * 2) }] }));

  const sw = (
    <View style={[styles.track, { backgroundColor: value ? colors.mint : colors.borderStrong }]}>
      <Animated.View style={[styles.knob, { backgroundColor: value ? colors.mintInk : colors.textMuted }, knob]} />
    </View>
  );

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        select();
        onChange(!value);
      }}
      style={label ? styles.row : undefined}>
      {label ? (
        <View style={styles.texts}>
          <Text style={styles.label}>{label}</Text>
          {description ? <Text style={styles.desc}>{description}</Text> : null}
        </View>
      ) : null}
      {sw}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 },
  texts: { flex: 1, gap: 2 },
  label: { ...type.body },
  desc: { ...type.caption },
  track: { width: W, height: H, borderRadius: 99, justifyContent: 'center', paddingHorizontal: PAD },
  knob: { width: KNOB, height: KNOB, borderRadius: 99 },
});
