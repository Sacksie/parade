import { Fragment } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatKm } from '@/components/create/format';
import { useWizard } from '@/components/create/wizard';
import { Icon, type IconName } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { Button, EmptyState, Header, Mono, Screen, go, showToast } from '@/components/ui';
import { turnList, type Turn } from '@/lib/geo';
import { colors, font, radius, space, type } from '@/theme/tokens';

/** Warned rows sit on a warmer onyx than the amber banners (design C4). */
const WARN_ROW_BG = '#1A1710';

const TURN_ICON: Partial<Record<Turn['kind'], IconName>> = { left: 'turnLeft', right: 'turnRight', straight: 'straight' };

/** C4 · Check the route: the turn list, exactly as drivers will hear it. */
export default function CreateCheck() {
  const { draft, editing, advance, back } = useWizard();
  if (!draft) return <Screen>{null}</Screen>;

  const turns = turnList(draft.route, draft.stops);
  const flagged = turns.filter((t) => t.warning).length;

  if (turns.length === 0) {
    return (
      <Screen>
        <Header left="back" onLeft={() => back('/create/route')} title="Check the route" />
        <View style={styles.empty}>
          <EmptyState
            title="No route yet"
            body="Draw the route on the map first. Then every turn drivers will hear shows up here."
            action={<Button title="Draw the route" variant="secondary" size="md" onPress={() => back('/create/route')} />}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      padded={false}
      footer={
        <View style={styles.footer}>
          <Button title={editing ? 'Save' : 'Route looks right'} onPress={() => advance('/create/music')} />
        </View>
      }>
      <View style={styles.head}>
        <Header
          left="back"
          onLeft={() => back('/create/route')}
          title="Check the route"
          subtitle={
            <Text style={styles.sub}>
              This is exactly what every driver will be told.{' '}
              {flagged > 0 ? (
                <Text style={{ color: colors.warn }}>
                  <Mono size="small" style={styles.subNum}>{flagged}</Mono> {flagged === 1 ? 'turn' : 'turns'} to look at.
                </Text>
              ) : (
                'Nothing to flag.'
              )}
            </Text>
          }
        />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.list} accessibilityRole="list">
          {turns.map((t, i) => (
            <Fragment key={`${t.kind}-${i}`}>
              <TurnRow turn={t} last={i === turns.length - 1} onEditStop={(id) => go('/create/stop', { stopId: id })} />
            </Fragment>
          ))}
        </View>

        <View style={styles.practice}>
          <Icon name="car" size={22} color={colors.indigoBright} />
          <View style={styles.flex}>
            <Text style={styles.practiceTitle}>Do a practice drive</Text>
            <Text style={styles.practiceBody}>We&apos;ll flag anywhere the real road doesn&apos;t match the map.</Text>
          </View>
          <PressableScale
            pressedScale={0.96}
            onPress={() => showToast('Practice drive needs a real map first')}
            accessibilityRole="button"
            accessibilityLabel="Start a practice drive"
            style={styles.practiceBtn}>
            <Text style={styles.practiceBtnText}>Start</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </Screen>
  );
}

function TurnRow({ turn, last, onEditStop }: { turn: Turn; last: boolean; onEditStop: (id: string) => void }) {
  const warn = !!turn.warning;
  const divided = !last && styles.divided;

  if (turn.kind === 'stop' && turn.stop) {
    const s = turn.stop;
    return (
      <PressableScale
        pressedScale={0.99}
        onPress={() => onEditStop(s.id)}
        accessibilityRole="button"
        accessibilityLabel={`Stop ${s.seq}, ${s.name}, ${s.kind === 'stop' ? `stop for ${s.durationMin} minutes` : 'drive past slowly'}. Edit`}
        style={[styles.row, divided]}>
        <View style={styles.stopDisc}>
          <Text style={styles.stopDiscText}>{s.seq}</Text>
        </View>
        <Text style={styles.rowText} numberOfLines={2}>
          {s.name}
        </Text>
        {s.kind === 'stop' ? (
          <Text style={styles.meta}>
            Stop · <Mono size="small" style={styles.meta}>{s.durationMin} min</Mono>
          </Text>
        ) : (
          <Text style={styles.meta}>Drive past slowly</Text>
        )}
      </PressableScale>
    );
  }

  const badge = turn.kind === 'start' ? 'S' : turn.kind === 'finish' ? 'F' : null;
  const icon = TURN_ICON[turn.kind];

  return (
    <View style={[warn ? styles.warnRow : styles.row, divided]} accessible accessibilityLabel={turn.warning ? `${turn.instruction}. ${turn.warning}` : turn.instruction}>
      <View style={styles.rowLine}>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : icon ? (
          <Icon name={icon} size={24} color={warn ? colors.warn : colors.textMuted} />
        ) : null}
        <Text style={styles.rowText}>{turn.instruction}</Text>
        {turn.kind !== 'start' ? <Mono size="small" style={styles.meta}>{formatKm(turn.atM)}</Mono> : null}
      </View>
      {turn.warning ? <Text style={styles.warning}>{turn.warning}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center' },
  head: { paddingHorizontal: space.xl, paddingBottom: space.md },
  sub: { ...type.label, fontSize: 15, lineHeight: 21, color: colors.textMuted },
  subNum: { fontSize: 15, color: colors.warn },
  body: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: 14 },
  footer: { paddingHorizontal: space.xl },
  list: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, paddingHorizontal: 14, paddingVertical: 8 },
  warnRow: { paddingTop: 10, paddingBottom: 12, paddingHorizontal: 14, gap: 6, backgroundColor: WARN_ROW_BG },
  rowLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divided: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowText: { flex: 1, fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: colors.text },
  meta: { fontSize: 13, lineHeight: 17, color: colors.textMuted },
  warning: { paddingLeft: 36, fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: colors.warn },
  badge: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: font.sansBold, fontSize: 11, color: colors.mintText },
  stopDisc: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  stopDiscText: { fontFamily: font.monoSemi, fontSize: 12, color: colors.onyx },
  practice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.card,
    backgroundColor: colors.indigoTint,
    borderWidth: 1,
    borderColor: colors.indigoBorder,
  },
  practiceTitle: { fontFamily: font.sansSemi, fontSize: 15, color: colors.text },
  practiceBody: { ...type.caption, color: colors.textMuted, lineHeight: 18 },
  practiceBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: '#2A2552',
    borderWidth: 1,
    borderColor: colors.indigoBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceBtnText: { fontFamily: font.sansSemi, fontSize: 14, color: colors.text },
});
