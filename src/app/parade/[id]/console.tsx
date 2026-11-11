import { useKeepAwakeSafe } from '@/lib/keepAwake';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/console/ConfirmSheet';
import { Composer } from '@/components/console/Composer';
import { ConvoyMap, ConvoyMapSheet, type ConvoyMapData } from '@/components/console/ConvoyMap';
import { DevRow, type TimeScale } from '@/components/console/DevRow';
import { HelpAlert } from '@/components/console/HelpAlert';
import { MusicCard } from '@/components/console/MusicCard';
import { StopCard } from '@/components/console/StopCard';
import { LeadSilentAlert, SplitAlert } from '@/components/console/SplitAlert';
import { useSheet } from '@/components/Sheet';
import { Button, EmptyState, Header, IconButton, Screen, go, goBackOr, goReplace, showToast, success, warning } from '@/components/ui';
import { PressableScale } from '@/components/PressableScale';
import { formatCarNumber, formatDuration, plural } from '@/lib/format';
import { nextStop, orderCars } from '@/lib/geo';
import { useSimulation } from '@/lib/simulator';
import { announce, endParade, leaveStop, setCarRole, skipTrack, toggleMusic } from '@/store/actions';
import { leadCar, tailCar, useCars, useIsOrganiser, useLive, useMe, useParade } from '@/store/selectors';
import { colors, font, space, type } from '@/theme/tokens';

const LEAD_SILENT_MS = 60_000;
/** Lead pace in the simulator (15 km/h); used for the "next stop" estimate when the lead is stopped. */
const FALLBACK_MPS = 15 / 3.6;

/** L6 organiser console: convoy map, alerts, stop control, music and announcements. */
export default function Console() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parade = useParade(id);
  const cars = useCars(id);
  const live = useLive(id);
  const me = useMe();
  const isOrganiser = useIsOrganiser(id);
  const status = parade?.status;

  useKeepAwakeSafe();
  useSimulation(id, status === 'live');

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const [text, setText] = useState('');
  const [scale, setScale] = useState<TimeScale>('1');
  const mapSheet = useSheet();
  const endSheet = useSheet();
  const leaveSheet = useSheet();

  // Ended (here or on another organiser's phone) → finish screen, once.
  const left = useRef(false);
  useEffect(() => {
    if (status !== 'ended' || left.current || !id) return;
    left.current = true;
    goReplace('/parade/[id]/done', { id });
  }, [status, id]);

  // A new gap: the lead car's phone speaks; the organiser just feels it.
  const splitKey = live?.split ? `${live.split.frontCarId}|${live.split.behindCarId}` : '';
  useEffect(() => {
    if (splitKey) warning();
  }, [splitKey]);

  if (!parade || !id) {
    return (
      <Screen>
        <Header left="back" />
        <View style={styles.center}>
          <EmptyState title="Parade not found" body="It may have been deleted." />
        </View>
      </Screen>
    );
  }

  if (!isOrganiser) {
    return (
      <Screen>
        <Header left="back" />
        <View style={styles.center}>
          <EmptyState
            title="Organisers only"
            body="Only the organiser and co-organisers can run the console."
            action={<Button title="Back" variant="secondary" size="md" onPress={() => goBackOr(`/parade/${id}`)} />}
          />
        </View>
      </Screen>
    );
  }

  if (status === 'ended') return <Screen>{null}</Screen>;

  if (status !== 'live' || !live) {
    return (
      <Screen>
        <Header left="back" onLeft={() => goBackOr(`/parade/${id}`)} />
        <View style={styles.center}>
          <EmptyState
            title="Not started"
            body={`${parade.name} isn't live yet. Start it once the lead car has checked in.`}
            action={<Button title="Ready to start" variant="primary" size="md" onPress={() => go('/parade/[id]/ready', { id })} />}
          />
        </View>
      </Screen>
    );
  }

  // ---- Derived live state
  const byId = new Map(cars.map((c) => [c.id, c]));
  const checkedIn = cars.filter((c) => c.checkedInAt != null);
  const inSync = checkedIn.filter((c) => c.musicProgress >= 1).length;
  const lead = leadCar(cars);
  const tail = tailCar(cars);
  const myCar = cars.find((c) => c.userId === me.id);
  const leadPos = lead ? live.positions[lead.id] : undefined;
  const ordered = orderCars(live.positions);
  const leadProgress = leadPos?.progressM ?? ordered[0]?.progressM ?? 0;

  const openHelp = live.help.filter((h) => h.status !== 'resolved').sort((a, b) => b.createdAt - a.createdAt);
  const helpCarIds = new Set(openHelp.map((h) => h.carId));

  const split = live.split;
  const mapData: ConvoyMapData = {
    route: parade.route,
    stops: parade.stops,
    progressM: leadProgress,
    cars: Object.values(live.positions).map((p) => ({
      id: p.carId,
      position: p.position,
      role: byId.get(p.carId)?.role ?? 'car',
      alert: helpCarIds.has(p.carId),
    })),
    split: split
      ? { position: split.position, fromM: live.positions[split.behindCarId]?.progressM, toM: live.positions[split.frontCarId]?.progressM }
      : undefined,
    leadLabel: !lead ? 'No lead car' : lead.id === myCar?.id ? 'Lead (you)' : `Lead · ${lead.name}`,
    hasTail: !!tail,
  };

  const silentFor = live.leadLastSeenAt != null ? now - live.leadLastSeenAt : 0;
  const nextLeadId = ordered.find((p, i) => i > 0 && p.carId !== lead?.id)?.carId;
  const nextLead = nextLeadId ? byId.get(nextLeadId) : undefined;

  const stop = live.currentStop ? parade.stops.find((s) => s.id === live.currentStop!.stopId) : undefined;
  const upcoming = nextStop(parade.stops, parade.route, leadProgress, [...live.completedStopIds, ...(stop ? [stop.id] : [])]);
  const etaS = upcoming ? upcoming.distanceM / Math.max(leadPos?.speedMps ?? 0, FALLBACK_MPS) : 0;
  const track = parade.tracks[live.music.trackIndex];
  const liveMin = Math.max(0, Math.floor((now - (parade.liveStartedAt ?? now)) / 60_000));

  const send = (t: string) => {
    const msg = t.trim();
    if (!msg) return;
    announce(id, msg);
    setText('');
    success();
    showToast(`Sent to ${plural(checkedIn.length, 'car')}`);
  };

  return (
    <Screen padded={false} keyboard>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>
              Live · <Text style={styles.mono}>{liveMin} min</Text>
            </Text>
          </View>
          <Text style={styles.name} numberOfLines={1} accessibilityRole="header">
            {parade.name}
          </Text>
        </View>
        <PressableScale onPress={() => go('/parade/[id]/cars', { id })} accessibilityRole="button" accessibilityLabel={`${checkedIn.length} cars. Open the car list`} style={styles.carsPill}>
          <Text style={styles.carsText}>
            <Text style={[styles.mono, { color: colors.text }]}>{checkedIn.length}</Text> cars
          </Text>
        </PressableScale>
        <IconButton icon="close" variant="ghost" accessibilityLabel="Leave the console" onPress={leaveSheet.show} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ConvoyMap paradeId={id} data={mapData} onExpand={mapSheet.show} />

        {openHelp.map((h) => (
          <HelpAlert
            key={h.id}
            paradeId={id}
            help={h}
            car={byId.get(h.carId)}
            position={live.positions[h.carId]?.position ?? h.position}
            hasTail={!!tail}
            now={now}
          />
        ))}

        {split ? <SplitAlert split={split} onAnnounce={setText} /> : null}

        {silentFor > LEAD_SILENT_MS ? (
          <LeadSilentAlert
            silentForMs={silentFor}
            nextCarLabel={nextLead ? `Car ${formatCarNumber(nextLead.number)} · ${nextLead.name}` : undefined}
            onPromote={
              nextLead
                ? () => {
                    setCarRole(id, nextLead.id, 'lead');
                    showToast(`Car ${formatCarNumber(nextLead.number)} is now the lead`);
                  }
                : undefined
            }
          />
        ) : null}

        {stop && live.currentStop ? (
          <StopCard stop={stop} enteredAt={live.currentStop.enteredAt} now={now} timeScale={Number(scale)} onMoveOn={() => leaveStop(id)} />
        ) : null}

        <MusicCard
          title={track?.title}
          index={live.music.trackIndex}
          total={parade.tracks.length}
          inSync={inSync}
          cars={checkedIn.length}
          paused={live.music.paused}
          next={!stop && upcoming ? { label: `stop ${upcoming.stop.seq} in`, value: formatDuration(etaS) } : undefined}
          onToggle={() => toggleMusic(id)}
          onPrev={() => skipTrack(id, -1)}
          onNext={() => skipTrack(id, 1)}
        />

        <DevRow paradeId={id} cars={cars} helpCarIds={helpCarIds} scale={scale} onScale={setScale} />

        <PressableScale onPress={endSheet.show} accessibilityRole="button" style={styles.end}>
          <Text style={styles.endText}>End parade</Text>
        </PressableScale>
      </ScrollView>

      <View style={styles.composer}>
        <Composer value={text} onChange={setText} onSend={send} announcements={live.announcements} now={now} nextStopName={upcoming?.stop.name} />
      </View>

      <ConvoyMapSheet paradeId={id} data={mapData} open={mapSheet.open} onClose={mapSheet.hide} />
      <ConfirmSheet
        open={leaveSheet.open}
        onClose={leaveSheet.hide}
        title="Leave the console?"
        body="The parade keeps running. You can come back from the parade page."
        cancelLabel="Stay"
        confirmLabel="Leave"
        onConfirm={() => {
          leaveSheet.hide();
          goBackOr(`/parade/${id}`);
        }}
      />
      <ConfirmSheet
        open={endSheet.open}
        onClose={endSheet.hide}
        title="End the parade for everyone?"
        body="Music stops and location sharing turns off."
        cancelLabel="Keep going"
        confirmLabel="End parade"
        confirmVariant="danger"
        onConfirm={() => {
          endSheet.hide();
          left.current = true;
          endParade(id);
          goReplace('/parade/[id]/done', { id });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 10 },
  headerText: { flex: 1, minWidth: 0, gap: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.mint },
  liveText: { fontFamily: font.sans, fontSize: 13, lineHeight: 17, color: colors.mintText },
  name: { ...type.title, fontSize: 19, lineHeight: 23, letterSpacing: -0.4 },
  mono: { fontFamily: font.mono, fontVariant: ['tabular-nums'] },
  carsPill: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  carsText: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted },
  body: { paddingHorizontal: 16, paddingBottom: space.lg, gap: 10 },
  end: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  endText: { fontFamily: font.sans, fontSize: 14, color: colors.textFaint, textDecorationLine: 'underline' },
  composer: { paddingHorizontal: 16, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
