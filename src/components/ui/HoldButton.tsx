import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon, type IconName } from '@/components/icons';
import { success, tap } from '@/components/ui/haptics';
import { colors, font } from '@/theme/tokens';

type Props = {
  title: string;
  onComplete: () => void;
  holdMs?: number;
  icon?: IconName;
  accessibilityHint?: string;
};

/**
 * A2 hold-to-start. A mint fill sweeps left to right while the finger is down;
 * letting go early drains it. Works with a mouse on web.
 */
export function HoldButton({ title, onComplete, holdMs = 2000, icon = 'play', accessibilityHint }: Props) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [width, setWidth] = useState(0);
  const completed = useRef(false);

  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    success();
    onComplete();
  };

  const start = () => {
    completed.current = false;
    tap();
    cancelAnimation(progress);
    progress.set(
      withTiming(1, { duration: holdMs, easing: Easing.linear }, (done) => {
        if (done) scheduleOnRN(finish);
      }),
    );
  };

  const release = () => {
    cancelAnimation(progress);
    progress.set(withTiming(0, { duration: completed.current ? 300 : 220, easing: Easing.out(Easing.cubic) }));
  };

  const fill = useAnimatedStyle(() => ({ width: reduceMotion ? (progress.get() > 0 ? width : 0) : progress.get() * width }));
  const dim = useAnimatedStyle(() => ({ opacity: reduceMotion ? progress.get() : 1 }));

  const label = (color: string) => (
    <View style={[styles.labelWrap, { width }]}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.text, { color }]}>{title}</Text>
    </View>
  );

  return (
    <Pressable
      onPressIn={start}
      onPressOut={release}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint ?? `Press and hold for ${Math.round(holdMs / 1000)} seconds`}
      // Screen readers cannot hold; an a11y activate completes immediately.
      onAccessibilityTap={finish}
      style={styles.btn}>
      {label(colors.mintText)}
      <Animated.View pointerEvents="none" style={[styles.fill, fill, dim]}>
        {label(colors.mintInk)}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.mintTint,
    borderWidth: 1,
    borderColor: colors.mintBorder,
    overflow: 'hidden',
    justifyContent: 'center',
    // Keep long presses from selecting the label on web.
    userSelect: 'none',
  },
  labelWrap: { position: 'absolute', left: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden', backgroundColor: colors.mint },
  text: { fontFamily: font.sansSemi, fontSize: 18, lineHeight: 23 },
});
