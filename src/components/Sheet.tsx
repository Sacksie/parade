import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Button } from '@/components/ui/Button';
import { colors, ease, font, radius, space } from '@/theme/tokens';

type Props = {
  open: boolean;
  /** Called on scrim tap and from the default footer. */
  onClose: () => void;
  title?: string;
  /** Left side of the default footer, e.g. the value being chosen. */
  summary?: string;
  /** Default footer renders only when both confirmLabel and onConfirm are given. */
  confirmLabel?: string;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  /** Replaces the default summary/confirm footer. */
  footer?: React.ReactNode;
  /** Fixed height in points, or 'auto' (default) to hug the content. */
  height?: number | 'auto';
  /** Wrap the content in a ScrollView, capped to the screen. */
  scrollable?: boolean;
  children: React.ReactNode;
};

/** open / show / hide state for a <Sheet/>. */
export function useSheet(initial = false) {
  const [open, setOpen] = useState(initial);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  return { open, show, hide };
}

/**
 * Bottom sheet rendered inside the current screen rather than in an RN <Modal>.
 * A <Modal> launched from a native full-screen modal on iOS can fail to present
 * and leave an invisible window swallowing every touch.
 * Render it last in the screen's root view so it sits on top.
 */
export function Sheet({
  open,
  onClose,
  title,
  summary,
  confirmLabel,
  confirmDisabled,
  onConfirm,
  footer,
  height = 'auto',
  scrollable,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(0);

  // Mount on open; unmount once the exit animation has finished.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount/reset on open; the render-phase form did not re-render under the React Compiler
      setMounted(true);
      // Enter: iOS drawer curve, slightly slower so it feels placed, not thrown.
      progress.set(withTiming(1, { duration: reduceMotion ? 150 : 360, easing: ease.drawer }));
    } else {
      // Exit is quicker than enter.
      progress.set(
        withTiming(0, { duration: 200, easing: ease.out }, (done) => {
          if (done) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [open, progress, reduceMotion]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? progress.value : 1,
    transform: [{ translateY: reduceMotion ? 0 : (1 - progress.value) * 520 }],
  }));

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, space.lg), maxHeight: windowHeight - insets.top - space.lg },
          height !== 'auto' && { height },
          sheetStyle,
        ]}>
        <View style={styles.grabber} />
        {title ? <Text style={styles.title}>{title}</Text> : null}

        {scrollable ? (
          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          children
        )}

        {footer ? (
          <View style={styles.footerCustom}>{footer}</View>
        ) : confirmLabel && onConfirm ? (
          <View style={styles.footer}>
            {summary ? (
              <Text style={styles.summary} numberOfLines={1}>
                {summary}
              </Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <Button title={confirmLabel} variant="indigo" size="md" disabled={confirmDisabled} onPress={onConfirm} />
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingHorizontal: space.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginTop: 10,
    marginBottom: space.lg,
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  title: {
    fontFamily: font.sansSemi,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: space.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerCustom: { marginTop: space.lg },
  summary: { flex: 1, fontFamily: font.sansSemi, fontSize: 16, color: colors.text, fontVariant: ['tabular-nums'] },
});
