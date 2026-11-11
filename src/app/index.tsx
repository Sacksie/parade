import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Icon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { Button, EmptyState, Mono, Pill, go, showToast } from '@/components/ui';
import { formatShortDate, parseISODate } from '@/lib/dates';
import { plural } from '@/lib/format';
import { resetToSeed } from '@/store/store';
import { useMyParades } from '@/store/selectors';
import { colors, ease, font, radius, space, type } from '@/theme/tokens';
import type { Parade, ParadeStatus } from '@/types';

type Entry = ReturnType<typeof useMyParades>[number];

export default function MyParades() {
  const insets = useSafeAreaInsets();
  const parades = useMyParades();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl, paddingBottom: 160 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Parade</Text>
        <Text style={type.display}>My parades</Text>

        {parades.length === 0 ? (
          <View style={{ marginTop: 80 }}>
            <EmptyState title="No parades yet" body="Create one for your community, or join with a code someone shared with you." />
          </View>
        ) : (
          <View style={styles.list}>
            {parades.map((entry, i) => (
              <Stagger key={entry.parade.id} index={i}>
                <ParadeCard entry={entry} />
              </Stagger>
            ))}
          </View>
        )}

        <PressableScale
          pressedScale={0.97}
          accessibilityRole="button"
          accessibilityLabel="Reset demo data"
          onPress={async () => {
            await resetToSeed();
            showToast('Demo data reset');
          }}
          style={styles.reset}>
          <Text style={styles.resetText}>Reset demo data</Text>
        </PressableScale>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button title="Join" variant="indigoSoft" size="lg" full onPress={() => router.push('/join')} style={styles.join} />
        <Button title="Create" icon="plus" size="lg" full onPress={() => router.push('/create')} style={styles.create} />
      </View>
    </View>
  );
}

const statusPill: Record<ParadeStatus, { label: string; tone: 'indigo' | 'mint' | 'neutral'; solid?: boolean }> = {
  draft: { label: 'Draft', tone: 'indigo' },
  published: { label: 'Upcoming', tone: 'mint' },
  live: { label: 'Live', tone: 'mint', solid: true },
  ended: { label: 'Finished', tone: 'neutral' },
};

function metaLine(p: Parade, carCount: number) {
  const date = parseISODate(p.date);
  return `${formatShortDate(date)} · sets off ${p.setsOffAt}${carCount > 0 ? ` · ${plural(carCount, 'car')}` : ''}`;
}

function ParadeCard({ entry }: { entry: Entry }) {
  const { parade, role, carCount } = entry;
  const date = parseISODate(parade.date);
  const status = statusPill[parade.status];

  return (
    <PressableScale
      pressedScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${parade.name}, ${metaLine(parade, carCount)}`}
      onPress={() => go('/parade/[id]', { id: parade.id })}
      style={styles.card}>
      <View style={styles.dateBlock}>
        <Mono style={styles.dateDay}>{date.getDate()}</Mono>
        <Text style={styles.dateMonth}>{formatShortDate(date).split(' ')[2].toUpperCase()}</Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.cardTopRow}>
          <Pill label={status.label} tone={status.tone} solid={status.solid} />
          <Text style={styles.role}>{role === 'hosting' ? 'Hosting' : 'Joined'}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {parade.name}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {metaLine(parade, carCount)}
        </Text>
      </View>

      <Icon name="arrowRight" size={18} color={colors.textFaint} />
    </PressableScale>
  );
}

/** Cards cascade in on first mount; short delays so it never feels like waiting. */
function Stagger({ index, children }: { index: number; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.set(withDelay(index * 50, withTiming(1, { duration: 320, easing: ease.out })));
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: reduceMotion ? 0 : (1 - progress.get()) * 8 }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.onyx },
  content: { paddingHorizontal: space.xl },
  eyebrow: {
    ...type.label,
    fontFamily: font.sansSemi,
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
  dateDay: { fontFamily: font.monoSemi, fontSize: 22, lineHeight: 26 },
  dateMonth: { fontFamily: font.sansBold, fontSize: 11, lineHeight: 14, color: colors.indigoBright, letterSpacing: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  role: { fontFamily: font.sansSemi, fontSize: 13, color: colors.textFaint },
  cardTitle: { fontFamily: font.sansBold, fontSize: 17, lineHeight: 22, color: colors.text },
  cardMeta: { fontFamily: font.sans, fontSize: 14, lineHeight: 18, color: colors.textMuted },

  reset: { alignSelf: 'center', minHeight: 44, paddingHorizontal: space.lg, justifyContent: 'center', marginTop: space.xxl },
  resetText: { ...type.caption, color: colors.textFaint, opacity: 0.6 },

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
  join: { flex: 1 },
  create: { flex: 1.4 },
});
