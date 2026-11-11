import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PressableScale } from '@/components/PressableScale';
import { ITEM_H, TimeWheel, VISIBLE, type Time } from '@/components/WheelPicker';
import { colors, ease, radius, space } from '@/theme/tokens';

const HEADER_H = 52;
const PANEL_H = HEADER_H + ITEM_H * VISIBLE + space.md;

type Props = {
  /** Which time is being edited; null collapses the panel. */
  title: string | null;
  value: Time;
  onChange: (t: Time) => void;
  onDone: () => void;
  /** Shown for optional times: removes the value. */
  onClear?: () => void;
};

/**
 * Inline accordion that holds the time wheel under the time boxes.
 * Expands when a box is tapped, collapses on Done or a second tap on the box.
 */
export function TimePanel({ title, value, onChange, onDone, onClear }: Props) {
  const reduceMotion = useReducedMotion();
  const open = title != null;
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(open);
  // Keep the last title on screen while collapsing.
  const [shownTitle, setShownTitle] = useState(title);

  useEffect(() => {
    if (title != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount/reset on open; the render-phase form did not re-render under the React Compiler
      setMounted(true);
      setShownTitle(title);
    }
  }, [title]);

  useEffect(() => {
    if (open) {
      progress.set(withTiming(1, { duration: reduceMotion ? 0 : 280, easing: ease.out }));
    } else {
      progress.set(
        withTiming(0, { duration: reduceMotion ? 0 : 200, easing: ease.out }, (done) => {
          if (done) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [open, progress, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    height: progress.value * PANEL_H,
    opacity: progress.value,
  }));

  if (!mounted) return null;

  return (
    <Animated.View style={[styles.clip, style]}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>{shownTitle}</Text>
          <View style={styles.actions}>
          {onClear && (
            <PressableScale
              pressedScale={0.94}
              onPress={onClear}
              style={styles.clear}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${shownTitle}`}>
              <Text style={styles.clearText}>Clear</Text>
            </PressableScale>
          )}
          <PressableScale
            pressedScale={0.94}
            onPress={onDone}
            style={styles.done}
            accessibilityRole="button"
            accessibilityLabel={`Done setting ${shownTitle}`}>
            <Text style={styles.doneText}>Done</Text>
          </PressableScale>
          </View>
        </View>
        {/* key: switching between boxes remounts the wheel aligned to the new value */}
        <TimeWheel key={shownTitle ?? ''} label={shownTitle ?? ''} value={value} onChange={onChange} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  panel: {
    height: PANEL_H,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.indigoBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
  },
  header: {
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 13, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  clear: { height: 34, paddingHorizontal: space.md, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  done: {
    height: 34,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
