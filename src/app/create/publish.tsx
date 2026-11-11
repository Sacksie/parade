import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { exitWizard, useWizard, WizardHeader } from '@/components/create/wizard';
import { Icon } from '@/components/icons';
import { MapCanvasStatic } from '@/components/map/MapCanvas';
import { PressableScale } from '@/components/PressableScale';
import { Button, Mono, Screen, go, goReplace, success } from '@/components/ui';
import { formatShortDate, parseISODate } from '@/lib/dates';
import { dateTimeMs, formatDistance, msToHHMM, plural } from '@/lib/format';
import { routeStats, turnList } from '@/lib/geo';
import { publishParade } from '@/store/actions';
import { tailCar, useCars, useMe } from '@/store/selectors';
import { colors, font, radius, space, type } from '@/theme/tokens';

type Check = { key: string; ok: boolean; label: React.ReactNode; detail?: string; action: string; to: string; a11y: string };

/** C8 · Review & publish. */
export default function CreatePublish() {
  const { draft, editing, back } = useWizard();
  const me = useMe();
  const cars = useCars(draft?.id);

  if (!draft) return <Screen>{null}</Screen>;

  const hasRoute = draft.route.length >= 2;
  const stats = routeStats(draft.route, draft.stops);
  const flagged = hasRoute ? turnList(draft.route, draft.stops).filter((t) => t.warning).length : 0;
  const tail = tailCar(cars);
  const coOrganisers = cars.filter((c) => c.isOrganiser && c.userId !== me.id);
  const backAround = hasRoute ? msToHHMM(dateTimeMs(draft.date, draft.setsOffAt) + stats.totalS * 1000) : draft.finishAt;

  const missing: string[] = [];
  if (!draft.name.trim()) missing.push('a name');
  if (!draft.date) missing.push('a date');
  if (!draft.meetingPoint) missing.push('a meeting point');
  if (!hasRoute) missing.push('a route');
  const ready = missing.length === 0;

  const checks: Check[] = [
    {
      key: 'meet',
      ok: !!draft.meetingPoint,
      label: draft.meetingPoint ? `Meeting point · ${draft.meetingName ?? 'pin set'}` : 'No meeting point yet',
      action: draft.meetingPoint ? 'Edit' : 'Add',
      to: '/create/meet',
      a11y: 'meeting point',
    },
    {
      key: 'route',
      ok: hasRoute,
      label: hasRoute ? (
        <>
          Route · <Mono style={styles.rowMono}>{formatDistance(stats.distanceM)}</Mono>, {plural(draft.stops.length, 'stop')}
        </>
      ) : (
        'No route yet'
      ),
      detail: hasRoute ? undefined : 'Cars need a line to follow.',
      action: hasRoute ? 'Edit' : 'Draw',
      to: '/create/route',
      a11y: 'route',
    },
    ...(hasRoute
      ? [
          {
            key: 'turns',
            ok: flagged === 0,
            label: flagged === 0 ? 'No turns flagged' : `${plural(flagged, 'turn')} flagged`,
            detail: flagged === 0 ? undefined : 'Put a marshal on each one.',
            action: 'View',
            to: '/create/check',
            a11y: 'turn list',
          },
        ]
      : []),
    {
      key: 'music',
      ok: draft.tracks.length > 0 && draft.rightsConfirmed,
      label:
        draft.tracks.length === 0
          ? 'No music yet'
          : draft.rightsConfirmed
            ? `Music · ${plural(draft.tracks.length, 'track')}, rights confirmed`
            : `Music · ${plural(draft.tracks.length, 'track')}, rights not confirmed`,
      detail: draft.tracks.length === 0 ? 'Cars will drive in silence.' : undefined,
      action: draft.tracks.length === 0 ? 'Add' : 'Edit',
      to: '/create/music',
      a11y: 'music',
    },
    {
      key: 'tail',
      ok: !!tail,
      label: tail ? `Tail car · ${tail.name}` : 'No tail car yet',
      detail: tail ? undefined : 'Optional. You can pick one on the night.',
      action: tail ? 'Edit' : 'Add',
      to: '/create/crew',
      a11y: 'tail car',
    },
    ...(draft.organiserPlace === 'driving' && coOrganisers.length === 0
      ? [
          {
            key: 'driving',
            ok: false,
            label: "You're driving, with no co-organiser",
            detail: 'Nobody should run the console while driving.',
            action: 'Fix',
            to: '/create/crew',
            a11y: 'crew',
          },
        ]
      : []),
  ];

  const publish = () => {
    publishParade(draft.id);
    success();
    goReplace('/parade/[id]', { id: draft.id });
  };

  return (
    <Screen
      footer={
        editing ? (
          <Button title="Save changes" disabled={!ready} onPress={() => exitWizard(draft.id, true)} />
        ) : (
          <>
            <Button title="Publish and get invite link" disabled={!ready} onPress={publish} />
            <Text style={styles.foot}>
              {ready ? 'You can still edit after publishing. Guests are told when the route or time changes.' : `Add ${joinList(missing)} to publish.`}
            </Text>
          </>
        )
      }>
      <WizardHeader
        step={6}
        title="Review"
        left={editing ? 'close' : 'back'}
        onLeft={() => (editing ? exitWizard(draft.id, true) : back('/create/crew'))}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.thumb}>
            {hasRoute ? (
              <MapCanvasStatic style={StyleSheet.absoluteFill} fit={draft.route} fitPadding={12} route={draft.route} routeStyle="draft" stops={draft.stops} />
            ) : (
              <View style={styles.thumbEmpty}>
                <Icon name="route" size={24} color={colors.textFaint} />
              </View>
            )}
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.name} numberOfLines={3}>
              {draft.name.trim() || 'Untitled parade'}
            </Text>
            {draft.host ? <Text style={styles.line}>{draft.host}</Text> : null}
            <Text style={styles.line}>{formatShortDate(parseISODate(draft.date))}</Text>
            <Text style={styles.line}>
              Arrive <Mono size="small" style={styles.mono}>{draft.arriveAt}</Mono> · off <Mono size="small" style={styles.mono}>{draft.setsOffAt}</Mono>
            </Text>
            {backAround ? (
              <Text style={styles.line}>
                Back around <Mono size="small" style={styles.mono}>{backAround}</Mono>
              </Text>
            ) : null}
            {draft.meetingName ? (
              <Text style={styles.line} numberOfLines={2}>
                {draft.meetingName}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.list}>
          <CheckRow
            ok={!!draft.name.trim()}
            label={draft.name.trim() ? 'Basics · name, date and times' : 'No name yet'}
            action="Edit"
            a11y="basics"
            onPress={() => go('/create/basics')}
            divided
          />
          {checks.map((c, i) => (
            <CheckRow key={c.key} ok={c.ok} label={c.label} detail={c.detail} action={c.action} a11y={c.a11y} onPress={() => go(c.to)} divided={i < checks.length - 1} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function CheckRow({ ok, label, detail, action, a11y, onPress, divided }: { ok: boolean; label: React.ReactNode; detail?: string; action: string; a11y: string; onPress: () => void; divided?: boolean }) {
  return (
    <View style={[styles.row, divided && styles.divided]}>
      {ok ? <Icon name="check" size={20} color={colors.mintText} strokeWidth={2.4} /> : <Icon name="warning" size={20} color={colors.warn} strokeWidth={2.2} />}
      <View style={styles.rowTexts}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <PressableScale pressedScale={0.95} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${action} ${a11y}`} style={styles.rowAction}>
        <Text style={styles.rowActionText}>{action}</Text>
      </PressableScale>
    </View>
  );
}

const joinList = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

const styles = StyleSheet.create({
  scroll: { flex: 1, marginHorizontal: -space.xl },
  body: { paddingHorizontal: space.xl, paddingTop: 2, paddingBottom: space.lg, gap: 14 },
  summary: { flexDirection: 'row', gap: 14, padding: 12, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  thumb: { width: 110, height: 168, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.mapBg },
  thumbEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryText: { flex: 1, minWidth: 0, gap: 6, paddingTop: 4 },
  name: { fontFamily: font.sansBold, fontSize: 18, lineHeight: 22, letterSpacing: -0.2, color: colors.text },
  line: { ...type.label, color: colors.textMuted },
  mono: { fontSize: 14, color: colors.text },
  list: { borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingLeft: 14, paddingRight: 6, paddingVertical: 4 },
  divided: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowTexts: { flex: 1, gap: 1 },
  rowLabel: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: colors.text },
  rowMono: { fontSize: 15, lineHeight: 20 },
  rowDetail: { ...type.caption, fontSize: 12 },
  rowAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  rowActionText: { fontFamily: font.sans, fontSize: 14, color: colors.mintText },
  foot: { ...type.caption, textAlign: 'center', lineHeight: 18 },
});
