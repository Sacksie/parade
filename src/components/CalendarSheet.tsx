import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { ChevronIcon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { formatLongDate, isSameDay, MONTHS, startOfDay } from '@/lib/dates';
import { colors, ease, radius, space } from '@/theme/tokens';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  open: boolean;
  value: Date | null;
  onClose: () => void;
  onConfirm: (d: Date) => void;
};

/** Bottom-sheet month calendar. Indigo marks the chosen day; mint marks today. */
export function CalendarSheet({ open, value, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(0);

  const today = useMemo(() => startOfDay(new Date()), []);
  const [draft, setDraft] = useState<Date | null>(value);
  const [cursor, setCursor] = useState(() => monthStart(value ?? today));

  // Reset the sheet's working state each time it opens (state-from-props, no effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMounted(true);
      setDraft(value);
      setCursor(monthStart(value ?? today));
    }
  }

  useEffect(() => {
    if (open) {
      // Enter: iOS-drawer curve, a touch slower so it feels placed rather than thrown.
      progress.set(withTiming(1, { duration: reduceMotion ? 150 : 380, easing: ease.drawer }));
    } else {
      // Exit: quicker than enter — the system is responding, not the user deciding.
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
    transform: [{ translateY: reduceMotion ? 0 : (1 - progress.value) * 480 }],
  }));

  const canGoBack = cursor > monthStart(today);
  const cells = useMemo(() => buildMonth(cursor), [cursor]);

  // Month swap: tiny directional slide + fade, keyed per month.
  const [dir, setDir] = useState<1 | -1>(1);
  const shift = (d: 1 | -1) => {
    setDir(d);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + d, 1));
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close calendar" />
      </Animated.View>

      <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }, sheetStyle]}>
        <View style={styles.grabber} />

        <View style={styles.header}>
          <PressableScale
            pressedScale={0.9}
            disabled={!canGoBack}
            onPress={() => shift(-1)}
            style={[styles.navBtn, !canGoBack && { opacity: 0.3 }]}
            accessibilityLabel="Previous month">
            <ChevronIcon direction="left" />
          </PressableScale>
          <Text style={styles.month}>
            {MONTHS[cursor.getMonth()]} <Text style={styles.year}>{cursor.getFullYear()}</Text>
          </Text>
          <PressableScale
            pressedScale={0.9}
            onPress={() => shift(1)}
            style={styles.navBtn}
            accessibilityLabel="Next month">
            <ChevronIcon direction="right" />
          </PressableScale>
        </View>

        <View style={styles.weekRow}>
          {WEEK.map((w, i) => (
            <Text key={i} style={[styles.weekday, i >= 5 && { color: colors.indigoBright }]}>
              {w}
            </Text>
          ))}
        </View>

        <MonthGrid key={cursor.toISOString()} dir={dir} reduceMotion={reduceMotion}>
          {cells.map((day, i) => {
            if (!day) return <View key={i} style={styles.cell} />;
            const past = day < today;
            const selected = draft != null && isSameDay(day, draft);
            const isToday = isSameDay(day, today);
            return (
              <View key={i} style={styles.cell}>
                <PressableScale
                  pressedScale={0.9}
                  disabled={past}
                  onPress={() => setDraft(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: past }}
                  accessibilityLabel={formatLongDate(day)}
                  style={[styles.day, selected && styles.daySelected]}>
                  <Text
                    style={[
                      styles.dayText,
                      past && styles.dayPast,
                      isToday && !selected && { color: colors.mint },
                      selected && styles.dayTextSelected,
                    ]}>
                    {day.getDate()}
                  </Text>
                  {isToday && <View style={[styles.todayDot, selected && { backgroundColor: colors.text }]} />}
                </PressableScale>
              </View>
            );
          })}
        </MonthGrid>

        <View style={styles.footer}>
          <Text style={styles.summary} numberOfLines={1}>
            {draft ? formatLongDate(draft) : 'Pick a day'}
          </Text>
          <PressableScale
            disabled={!draft}
            onPress={() => draft && onConfirm(draft)}
            style={[styles.confirm, !draft && { opacity: 0.4 }]}
            accessibilityRole="button">
            <Text style={styles.confirmText}>Set date</Text>
          </PressableScale>
        </View>
      </Animated.View>
    </Modal>
  );
}

function MonthGrid({
  dir,
  reduceMotion,
  children,
}: {
  dir: 1 | -1;
  reduceMotion: boolean;
  children: React.ReactNode;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(1, { duration: 200, easing: ease.out }));
  }, [p]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.4 + p.value * 0.6,
    transform: [{ translateX: reduceMotion ? 0 : (1 - p.value) * 14 * dir }],
  }));
  return <Animated.View style={[styles.grid, style]}>{children}</Animated.View>;
}

function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** 42 cells (6 weeks, Monday-first) so the sheet height never jumps between months. */
function buildMonth(first: Date): (Date | null)[] {
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return Array.from({ length: 42 }, (_, i) => {
    const n = i - lead + 1;
    return n >= 1 && n <= days ? new Date(first.getFullYear(), first.getMonth(), n) : null;
  });
}

const CELL = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  scrim: { backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingHorizontal: space.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  month: { fontSize: 19, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  year: { color: colors.textMuted, fontWeight: '600' },
  weekRow: { flexDirection: 'row', marginBottom: space.xs },
  weekday: {
    width: CELL,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textFaint,
    letterSpacing: 0.5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.indigo },
  dayText: { fontSize: 16, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  dayPast: { color: colors.textFaint, opacity: 0.5 },
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mint,
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
  summary: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  confirm: {
    height: 50,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
