import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, {
  interpolate,
  Extrapolation,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { pad2 } from '@/lib/dates';
import { colors, radius } from '@/theme/tokens';

export const ITEM_H = 44;
export const VISIBLE = 5; // must be odd
const PAD = ITEM_H * Math.floor(VISIBLE / 2);

type ColumnProps = {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  accessibilityLabel: string;
};

/** One snapping drum. Rows tilt and fade with distance from the centre band. */
function WheelColumn({ values, value, onChange, format = pad2, accessibilityLabel }: ColumnProps) {
  const ref = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(Math.max(0, values.indexOf(value)) * ITEM_H);
  const lastIndex = useRef(values.indexOf(value));

  // Align to the incoming value on mount (contentOffset isn't honoured everywhere).
  useEffect(() => {
    const i = Math.max(0, values.indexOf(value));
    requestAnimationFrame(() => ref.current?.scrollTo({ y: i * ITEM_H, animated: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.min(values.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
    if (i !== lastIndex.current) {
      lastIndex.current = i;
      onChange(values[i]);
    }
  };

  const step = (dir: 1 | -1) => {
    const i = Math.min(values.length - 1, Math.max(0, lastIndex.current + dir));
    ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
    lastIndex.current = i;
    onChange(values[i]);
  };

  return (
    <View
      style={styles.column}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <Animated.ScrollView
        ref={ref}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentOffset={{ x: 0, y: Math.max(0, values.indexOf(value)) * ITEM_H }}
        contentContainerStyle={{ paddingVertical: PAD }}>
        {values.map((v, i) => (
          <WheelRow
            key={v}
            index={i}
            scrollY={scrollY}
            label={format(v)}
            onPress={() => ref.current?.scrollTo({ y: i * ITEM_H, animated: true })}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

function WheelRow({
  index,
  scrollY,
  label,
  onPress,
}: {
  index: number;
  scrollY: SharedValue<number>;
  label: string;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => {
    const d = (scrollY.value - index * ITEM_H) / ITEM_H; // rows from centre
    const abs = Math.abs(d);
    return {
      opacity: interpolate(abs, [0, 1, 2.5], [1, 0.45, 0.12], Extrapolation.CLAMP),
      transform: [
        { perspective: 300 },
        { rotateX: `${interpolate(d, [-2.5, 0, 2.5], [-55, 0, 55], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(abs, [0, 2], [1, 0.88], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Pressable onPress={onPress} importantForAccessibility="no">
      <Animated.View style={[styles.row, style]}>
        <Text style={styles.rowText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export type Time = { h: number; m: number };

/** HH : MM drum picker sitting inside a field-style card. */
export function TimeWheel({
  value,
  onChange,
  label,
}: {
  value: Time;
  onChange: (t: Time) => void;
  label: string;
}) {
  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.band} />
      <WheelColumn
        values={HOURS}
        value={value.h}
        onChange={(h) => onChange({ ...value, h })}
        accessibilityLabel={`${label}, hour`}
      />
      <Text style={styles.colon}>:</Text>
      <WheelColumn
        values={MINUTES}
        value={value.m}
        onChange={(m) => onChange({ ...value, m })}
        accessibilityLabel={`${label}, minutes`}
      />
    </View>
  );
}

export const toMinutes = (t: Time) => t.h * 60 + t.m;

const styles = StyleSheet.create({
  card: {
    height: ITEM_H * VISIBLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD,
    height: ITEM_H,
    borderRadius: radius.sm,
    backgroundColor: colors.indigoTint,
    borderWidth: 1,
    borderColor: colors.indigoBorder,
  },
  column: { width: 84, height: ITEM_H * VISIBLE },
  row: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  rowText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  colon: { fontSize: 28, fontWeight: '700', color: colors.indigoBright, marginTop: -3 },
});
