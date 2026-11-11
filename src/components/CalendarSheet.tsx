import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { ChevronIcon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { Sheet } from '@/components/Sheet';
import { formatLongDate, isSameDay, MONTHS, startOfDay } from '@/lib/dates';
import { colors, ease, radius, space } from '@/theme/tokens';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  open: boolean;
  value: Date | null;
  onClose: () => void;
  onConfirm: (d: Date) => void;
};

/** Month calendar in a bottom sheet. Indigo marks the chosen day; mint marks today. */
export function CalendarSheet({ open, value, onClose, onConfirm }: Props) {
  const reduceMotion = useReducedMotion();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [draft, setDraft] = useState<Date | null>(value);
  const [cursor, setCursor] = useState(() => monthStart(value ?? today));
  const [dir, setDir] = useState<1 | -1>(1);

  // Start from the saved value every time the sheet opens.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount/reset on open; the render-phase form did not re-render under the React Compiler
      setDraft(value);
      setCursor(monthStart(value ?? today));
    }
    // `value` is deliberately read only at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canGoBack = cursor > monthStart(today);
  const cells = useMemo(() => buildMonth(cursor), [cursor]);

  const shift = (d: 1 | -1) => {
    setDir(d);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + d, 1));
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Date"
      summary={draft ? formatLongDate(draft) : 'Pick a day'}
      confirmLabel="Set date"
      confirmDisabled={!draft}
      onConfirm={() => draft && onConfirm(draft)}>
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
    </Sheet>
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
});
