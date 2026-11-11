import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowIcon, PlusIcon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { mockParades, type ParadeSummary } from '@/data/mockParades';
import { formatShortDate, parseISODate } from '@/lib/dates';
import { colors, ease, radius, space, type } from '@/theme/tokens';

export default function MyParades() {
  const insets = useSafeAreaInsets();
  const parades = mockParades;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl, paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Parade</Text>
        <Text style={type.display}>My parades</Text>

        {parades.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.list}>
            {parades.map((p, i) => (
              <Stagger key={p.id} index={i}>
                <ParadeCard parade={p} />
              </Stagger>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <PressableScale
          accessibilityRole="button"
          onPress={() => router.push('/join')}
          style={[styles.action, styles.joinAction]}>
          <Text style={styles.joinLabel}>Join</Text>
        </PressableScale>
        <PressableScale
          accessibilityRole="button"
          onPress={() => router.push('/create')}
          style={[styles.action, styles.createAction]}>
          <PlusIcon size={16} />
          <Text style={styles.createLabel}>Create</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function ParadeCard({ parade }: { parade: ParadeSummary }) {
  const date = parseISODate(parade.date);
  const status = statusStyle[parade.status];

  return (
    <PressableScale pressedScale={0.98} style={styles.card} accessibilityRole="button">
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{date.getDate()}</Text>
        <Text style={styles.dateMonth}>{formatShortDate(date).split(' ')[2].toUpperCase()}</Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.chip, { color: status.fg, backgroundColor: status.bg }]}>{status.label}</Text>
          <Text style={styles.role}>{parade.role === 'hosting' ? 'Hosting' : 'Joined'}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {parade.name}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {formatShortDate(date)} · sets off {parade.setsOff}
          {parade.cars ? ` · ${parade.cars} cars` : ''}
        </Text>
      </View>

      <ArrowIcon color={colors.textFaint} />
    </PressableScale>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyRoad}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.emptyCar, { opacity: 1 - i * 0.3 }]} />
        ))}
      </View>
      <Text style={type.title}>No parades yet</Text>
      <Text style={[type.caption, { textAlign: 'center' }]}>
        Create one for your community, or join with a code someone shared with you.
      </Text>
    </View>
  );
}

/** Cards cascade in on first mount — short delays so it never feels like waiting. */
function Stagger({ index, children }: { index: number; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.set(withDelay(index * 50, withTiming(1, { duration: 320, easing: ease.out })));
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

const statusStyle = {
  draft: { label: 'Draft', fg: colors.indigoBright, bg: colors.indigoTint },
  upcoming: { label: 'Upcoming', fg: colors.mint, bg: colors.mintTint },
  live: { label: 'Live', fg: colors.mintInk, bg: colors.mint },
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.onyx },
  content: { paddingHorizontal: space.xl },
  eyebrow: {
    ...type.label,
    color: colors.mint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 13,
    marginBottom: space.xs,
  },
  list: { marginTop: space.xl, gap: space.md },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateBlock: {
    width: 56,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.indigoTint,
    borderWidth: 1,
    borderColor: colors.indigoBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: { fontSize: 22, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  dateMonth: { fontSize: 11, fontWeight: '700', color: colors.indigoBright, letterSpacing: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  chip: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  role: { fontSize: 13, fontWeight: '600', color: colors.textFaint },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 14, color: colors.textMuted, fontVariant: ['tabular-nums'] },

  empty: { marginTop: 80, alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl },
  emptyRoad: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  emptyCar: { width: 40, height: 20, borderRadius: 8, backgroundColor: colors.indigo },

  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    backgroundColor: colors.onyx,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  action: {
    height: 58,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  joinAction: {
    flex: 1,
    backgroundColor: colors.indigoTint,
    borderWidth: 1,
    borderColor: colors.indigoBorder,
  },
  joinLabel: { fontSize: 17, fontWeight: '700', color: colors.indigoBright },
  createAction: { flex: 1.4, backgroundColor: colors.mint },
  createLabel: { fontSize: 17, fontWeight: '700', color: colors.mintInk },
});
