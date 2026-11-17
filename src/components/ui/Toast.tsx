import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, duration, ease, radius, type } from '@/theme/tokens';

type ToastMsg = { id: number; message: string };

let current: ToastMsg | null = null;
let counter = 0;
const listeners = new Set<(t: ToastMsg | null) => void>();

/** Show a short message at the bottom of the screen for about two seconds. */
export function showToast(message: string) {
  current = { id: ++counter, message };
  listeners.forEach((l) => l(current));
}

const VISIBLE_MS = 2000;

/** Render once, after the navigator, in the root layout. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [toast, setToast] = useState<ToastMsg | null>(current);
  const progress = useSharedValue(0);

  useEffect(() => {
    listeners.add(setToast);
    return () => {
      listeners.delete(setToast);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const clear = () => setToast((t) => (t?.id === toast.id ? null : t));
    progress.set(withTiming(1, { duration: duration.sheet, easing: ease.out }));
    const timer = setTimeout(() => {
      progress.set(
        withTiming(0, { duration: duration.fade, easing: ease.out }, (done) => {
          if (done) scheduleOnRN(clear);
        }),
      );
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: reduceMotion ? 0 : (1 - progress.get()) * 24 }],
  }));

  if (!toast) return null;

  return (
    <View pointerEvents="none" style={[styles.host, { bottom: Math.max(insets.bottom, 16) + 24 }]}>
      <Animated.View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.toast, style]}>
        <Text style={styles.text}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000, elevation: 1000 },
  toast: {
    maxWidth: 340,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  text: { ...type.label, fontSize: 15, color: colors.text, textAlign: 'center' },
});
