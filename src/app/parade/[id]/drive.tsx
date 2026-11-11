import { useKeepAwakeSafe } from '@/lib/keepAwake';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnnouncementOverlay } from '@/components/drive/AnnouncementOverlay';
import { HelpAction } from '@/components/drive/HelpAction';
import { LeadCard, SlowDownCard } from '@/components/drive/LeadCard';
import { LastAnnouncementRow, NowPlaying } from '@/components/drive/NowPlaying';
import { OffRouteCard } from '@/components/drive/OffRouteCard';
import { StatusPill } from '@/components/drive/StatusPill';
import { StopTakeover } from '@/components/drive/StopTakeover';
import { NextStopChip, TurnBanner } from '@/components/drive/TurnBanner';
import { useDriveCues } from '@/components/drive/useDriveCues';
import { turnIcon, useDriveModel } from '@/components/drive/useDriveModel';
import { MapCanvas } from '@/components/map/MapCanvas';
import { Sheet, useSheet } from '@/components/Sheet';
import { Button, EmptyState, IconButton, Screen, go, goBackOr, goReplace } from '@/components/ui';
import { roadNameAt } from '@/data/mockTown';
import { useParadePlayer } from '@/lib/audio';
import { useSimulation } from '@/lib/simulator';
import { useAnnouncer } from '@/lib/speech';
import { setHelpStatus } from '@/store/actions';
import { colors, radius, type } from '@/theme/tokens';

/** Re-follow my car this long after the last touch on the map. */
const REFOLLOW_MS = 5000;

/** L1–L5: drive mode. One screen; the state (stop / off route / lead / drive) is derived every second. */
export default function Drive() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useKeepAwakeSafe();
  const insets = useSafeAreaInsets();
  const m = useDriveModel(id);
  const isLive = m.parade?.status === 'live';
  // Ref-counted: the console runs the same simulation, so a guest can also test alone.
  useSimulation(id, isLive);
  const player = useParadePlayer(id, { enabled: isLive });
  const announcer = useAnnouncer(id);
  useDriveCues(m);

  const [rotate, setRotate] = useState(true);
  const [touchedAt, setTouchedAt] = useState(0);
  const following = m.now - touchedAt > REFOLLOW_MS;
  const exitSheet = useSheet();

  const ended = m.parade?.status === 'ended';
  useEffect(() => {
    if (ended) goReplace('/parade/[id]/done', { id });
  }, [ended, id]);

  if (!m.parade || !m.myCar) {
    return (
      <Screen>
        <View style={styles.empty}>
          <EmptyState
            title={m.parade ? "You're not in this parade" : 'Parade not found'}
            body={m.parade ? 'Join from the invite link to drive with the convoy.' : 'It may have been deleted.'}
            action={<Button title="Home" variant="secondary" onPress={() => goReplace('/')} style={styles.emptyBtn} />}
          />
        </View>
      </Screen>
    );
  }

  const openHelp = (kind?: string) => go('/parade/[id]/help', kind ? { id, kind } : { id });
  const cancelHelp = () => {
    if (m.myHelp) setHelpStatus(id, m.myHelp.id, 'resolved');
  };
  const markTouch = () => setTouchedAt(Date.now());
  const help = (label?: string, kind?: string) => (
    <HelpAction help={m.myHelp} onHelp={() => openHelp(kind)} onCancel={cancelHelp} label={label} size={m.state === 'drive' ? 'lg' : 'md'} />
  );

  // The turn banner: directions back to the line when off route, else the next manoeuvre.
  const banner = m.back ? (
    <TurnBanner icon={m.back.icon} distanceM={m.back.distanceM} instruction={`Head back to ${m.back.road}`} detail="then carry on along the route" />
  ) : m.next ? (
    <TurnBanner icon={turnIcon(m.next)} distanceM={m.toNextM} instruction={m.next.instruction} compact={m.isLead && !!m.split} />
  ) : (
    <TurnBanner icon="flag" distanceM={0} instruction="You've reached the finish" compact={m.isLead && !!m.split} />
  );

  return (
    <View style={styles.root}>
      {/* Touching the map pauses follow mode; it picks up again 5 s after the last touch. */}
      <View style={StyleSheet.absoluteFill} onTouchStart={markTouch} onPointerDown={markTouch}>
        <MapCanvas
          style={StyleSheet.absoluteFill}
          center={m.route[0]}
          zoom={2}
          // Simulated position for now. Real GPS plugs in here: when useMyLocation() gets a fix it should
          // replace my car's entry via updatePositions(), so this, the order and off-route all follow it.
          follow={following ? m.me?.position : undefined}
          heading={m.heading}
          rotate={rotate}
          route={m.route}
          routeStyle="live"
          progressM={m.progressM}
          stops={m.stops}
          stopLabels
          cars={m.mapCars}
        />
      </View>

      <View pointerEvents="box-none" style={[styles.top, { top: Math.max(insets.top, 12) + 4 }]}>
        {m.state === 'lead' && m.split ? <SlowDownCard gapM={m.split.gapM} frontNumber={m.splitFrontNumber} held={m.splitHeld} /> : null}
        {m.state !== 'stop' ? banner : null}
        <View pointerEvents="box-none" style={styles.topRow}>
          <View pointerEvents="box-none" style={styles.flex}>
            {m.upcoming && (m.state === 'drive' || m.state === 'lead') ? <NextStopChip next={m.upcoming} etaS={m.stopEtaS} /> : null}
          </View>
          <View style={styles.controls}>
            <IconButton
              icon={rotate ? 'arrowRight' : 'map'}
              onPress={() => setRotate((r) => !r)}
              accessibilityLabel={rotate ? 'Map turns with you. Switch to north up' : 'North up. Switch to heading up'}
            />
            <IconButton icon="close" variant="ghost" onPress={exitSheet.show} accessibilityLabel="Leave drive mode" style={styles.faint} />
          </View>
        </View>
      </View>

      <View pointerEvents="box-none" style={styles.bottom}>
        <View pointerEvents="box-none" style={styles.pillRow}>
          <StatusPill status={m.state === 'stop' ? 'stopped' : m.offRoute ? 'off' : 'on'} rank={m.rank} total={m.total} />
          {!following ? <IconButton icon="location" onPress={() => setTouchedAt(0)} accessibilityLabel="Recentre on my car" /> : null}
        </View>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
          {m.state === 'stop' && m.current ? (
            <StopTakeover
              stop={m.current}
              remainingS={m.stopRemainingS}
              where={`Stopped on ${roadNameAt(m.current.position) ?? 'the route'}`}
              musicPaused={player.paused}>
              {help()}
            </StopTakeover>
          ) : m.state === 'offroute' ? (
            <>
              <OffRouteCard muted={player.muted} />
              {help("I'm lost — get help", 'lost')}
            </>
          ) : m.state === 'lead' ? (
            <>
              <LeadCard behind={m.behind} convoyM={m.convoyM} stopEtaS={m.upcoming ? m.stopEtaS : null} stopSeq={m.upcoming?.stop.seq} />
              {help()}
            </>
          ) : (
            <>
              <NowPlaying player={player} />
              {m.lastAnnouncement ? (
                <LastAnnouncementRow announcement={m.lastAnnouncement} now={m.now} onReplay={() => announcer.replay(m.lastAnnouncement!)} />
              ) : null}
              {help()}
            </>
          )}
        </View>
      </View>

      {announcer.current ? (
        <AnnouncementOverlay
          announcement={announcer.current}
          speaking={announcer.speaking}
          closesAt={announcer.closesAt}
          now={m.now}
          onReplay={() => announcer.replay(announcer.current!)}
          onClose={announcer.dismiss}
        />
      ) : null}

      <Sheet
        open={exitSheet.open}
        onClose={exitSheet.hide}
        title="Leave drive mode?"
        confirmLabel="Leave drive mode"
        onConfirm={() => {
          exitSheet.hide();
          goBackOr(`/parade/${id}`);
        }}>
        <Text style={styles.sheetBody}>Directions, music and announcements stop on this phone. The parade carries on, and you can come back from the parade page.</Text>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetBody: { ...type.label, fontSize: 15, lineHeight: 21 },
  root: { flex: 1, backgroundColor: colors.mapBg },
  flex: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center' },
  emptyBtn: { marginTop: 16, alignSelf: 'center' },
  top: { position: 'absolute', left: 16, right: 16, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  controls: { gap: 8, alignItems: 'flex-end' },
  faint: { opacity: 0.7, backgroundColor: 'rgba(11, 11, 16, 0.6)' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 16 },
  pillRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  sheet: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: colors.sheet,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
});
