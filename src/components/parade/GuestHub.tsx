import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { MapCanvasStatic } from '@/components/map/MapCanvas';
import { PressableScale } from '@/components/PressableScale';
import { Button, Card, Header, Mono, ProgressBar, Screen, go, goBackOr, goReplace, showToast } from '@/components/ui';
import { formatShortDate, parseISODate } from '@/lib/dates';
import { formatBytes, formatCarNumber } from '@/lib/format';
import { checkIn, leaveParade, startCountdown, updateCar } from '@/store/actions';
import { useLive, useMyCar } from '@/store/selectors';
import { getState } from '@/store/store';
import { colors, font, radius, space, type } from '@/theme/tokens';
import type { Parade } from '@/types';

import { isParadeToday, useCountdownRedirect, useNow } from './hooks';

const BRING = ['A phone mount on the dashboard', 'A charging cable', 'Phone connected to the car speakers'];

/** Demo stand-in for the wifi download: 2% a second until the playlist is saved. */
function useSimulatedDownload(paradeId: string, carId: string | undefined, done: boolean) {
  useEffect(() => {
    if (!carId || done) return;
    const t = setInterval(() => {
      const car = (getState().cars[paradeId] ?? []).find((c) => c.id === carId);
      if (!car || car.musicProgress >= 1) return;
      updateCar(paradeId, carId, { musicProgress: Math.min(1, Math.round((car.musicProgress + 0.02) * 100) / 100) });
    }, 1000);
    return () => clearInterval(t);
  }, [paradeId, carId, done]);
}

/** I3: a guest's view of a parade they've joined. */
export function GuestHub({ parade }: { parade: Parade }) {
  const id = parade.id;
  const myCar = useMyCar(id);
  const live = useLive(id);
  const now = useNow(30_000);
  const [confirmLeave, setConfirmLeave] = useState(false);
  useCountdownRedirect(id, parade, live);
  useSimulatedDownload(id, myCar?.id, (myCar?.musicProgress ?? 1) >= 1);

  const status = parade.status;
  useEffect(() => {
    if (status === 'ended') goReplace('/parade/[id]/done', { id });
  }, [status, id]);

  // Opened a parade you're not in (e.g. after leaving): offer the invite.
  if (!myCar) {
    return (
      <Screen footer={<Button title="Join this parade" onPress={() => goReplace('/invite/[code]', { code: parade.code })} />}>
        <Header left="back" onLeft={() => goBackOr('/')} title={parade.name} subtitle="You're not in this parade yet." />
      </Screen>
    );
  }

  const isLive = status === 'live';
  const today = isParadeToday(parade, now);
  const arrivedPrimary = !isLive && today;
  const checkedIn = !!myCar.checkedInAt;
  const totalBytes = parade.tracks.reduce((n, t) => n + t.sizeBytes, 0);
  const saved = myCar.musicProgress >= 1;
  // Mint once: if the footer has a mint button, the check mark steps back to a tint.
  const mintButton = isLive || (arrivedPrimary && !checkedIn);

  const leave = () => {
    goReplace('/');
    leaveParade(id);
    showToast(`You've left ${parade.name}`);
  };

  const simulateStart = () => {
    // Demo only: on the night every car checks itself in on A1. Here the whole convoy
    // arrives at once so "Car 42 of 87" and the split/breakdown scripts have cars to work with.
    for (const car of getState().cars[id] ?? []) if (!car.checkedInAt) checkIn(id, car.id);
    checkIn(id, myCar.id);
    // The countdown redirect on this screen takes it from here, the same path a real start takes.
    startCountdown(id, 10);
  };

  return (
    <Screen
      scroll
      footer={
        <>
          {isLive ? (
            <Button title="Join the drive" icon="car" onPress={() => goReplace('/parade/[id]/drive', { id })} />
          ) : (
            <Button
              title={checkedIn ? 'Arrival check' : "I've arrived"}
              icon="pin"
              variant={arrivedPrimary && !checkedIn ? 'primary' : 'secondary'}
              onPress={() => go('/parade/[id]/arrive', { id })}
            />
          )}
          {!isLive ? <Button title="Add to calendar" icon="calendarAdd" variant="ghost" size="sm" onPress={() => showToast('Calendar export comes with the real build')} /> : null}
        </>
      }>
      <Header left="back" onLeft={() => goBackOr('/')} />

      <View style={styles.hero}>
        <View style={[styles.check, mintButton ? styles.checkSoft : styles.checkSolid]}>
          <Icon name="check" size={26} strokeWidth={2.6} color={mintButton ? colors.mintText : colors.mintInk} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {isLive ? 'The parade is on' : checkedIn ? "You're checked in" : "You're going"}
        </Text>
        <Text style={styles.paradeName}>{parade.name}</Text>
        <Text style={styles.meta}>
          {today ? 'Today' : formatShortDate(parseISODate(parade.date))} · arrive from <Mono style={styles.metaMono}>{parade.arriveAt}</Mono> · sets off{' '}
          <Mono style={styles.metaMono}>{parade.setsOffAt}</Mono>
        </Text>
        <Text style={styles.meta}>
          Car <Mono style={styles.metaMono}>{formatCarNumber(myCar.number)}</Mono> · {myCar.name}
        </Text>
      </View>

      {checkedIn && !isLive ? (
        <Card tone="indigo" style={styles.waiting}>
          <View style={styles.dot} />
          <Text style={styles.waitingText}>Checked in · waiting for the organiser to start. Keep this screen open.</Text>
        </Card>
      ) : null}

      <Card large style={styles.music}>
        <View style={styles.musicHead}>
          <Text style={styles.cardTitle}>{saved ? 'Music saved' : 'Saving the music'}</Text>
          <Mono size="small" style={styles.musicCount}>
            {saved ? `${parade.tracks.length} tracks` : `${formatBytes(totalBytes * myCar.musicProgress)} / ${formatBytes(totalBytes)}`}
          </Mono>
        </View>
        <ProgressBar value={myCar.musicProgress} tone={saved ? 'mint' : 'indigo'} height={6} accessibilityLabel="Music saved" />
        <Text style={styles.caption}>
          {saved
            ? 'It plays offline on the night, so a weak signal won’t cut it out.'
            : 'Downloading on wifi. It plays offline on the night, so a weak signal won’t cut it out.'}
        </Text>
      </Card>

      {parade.meetingPoint ? (
        <Card large padded={false} style={styles.meet}>
          <View style={styles.meetMap}>
            <MapCanvasStatic style={StyleSheet.absoluteFill} center={parade.meetingPoint} zoom={2.2} meetingPoint={parade.meetingPoint} />
          </View>
          <View style={styles.meetBody}>
            <Text style={styles.eyebrow}>MEET AT</Text>
            <Text style={styles.cardTitle}>{parade.meetingName ?? 'Meeting point'}</Text>
            {parade.meetingNotes ? <Text style={styles.caption}>{parade.meetingNotes}</Text> : null}
          </View>
        </Card>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bring on the night</Text>
        <View style={styles.list}>
          {BRING.map((b, i) => (
            <View key={b} style={[styles.bringRow, i < BRING.length - 1 && styles.divided]}>
              <View style={styles.bullet} />
              <Text style={styles.bringText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.leave}>
        {confirmLeave ? (
          <View style={styles.leaveConfirm}>
            <Text style={styles.caption}>Leave {parade.name}? The organiser will see one car fewer.</Text>
            <View style={styles.leaveButtons}>
              <Button title="Stay" size="sm" variant="secondary" full onPress={() => setConfirmLeave(false)} />
              <Button title="Leave parade" size="sm" variant="danger" full onPress={leave} />
            </View>
          </View>
        ) : (
          <PressableScale onPress={() => setConfirmLeave(true)} accessibilityRole="button" style={styles.faintBtn}>
            <Text style={styles.faintText}>Can&apos;t make it any more?</Text>
          </PressableScale>
        )}
      </View>

      {!isLive ? (
        <PressableScale onPress={simulateStart} accessibilityRole="button" style={styles.faintBtn}>
          <Text style={styles.devText}>Simulate the organiser starting the parade</Text>
        </PressableScale>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 6 },
  check: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  checkSolid: { backgroundColor: colors.mint },
  checkSoft: { backgroundColor: colors.mintTint, borderWidth: 1, borderColor: colors.mintBorder },
  title: { fontFamily: font.sansBold, fontSize: 30, lineHeight: 33, letterSpacing: -0.9, color: colors.text },
  paradeName: { ...type.subtitle },
  meta: { ...type.label, fontSize: 15, lineHeight: 21, color: colors.textMuted },
  metaMono: { fontSize: 15, color: colors.text },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.indigoBright },
  waitingText: { flex: 1, ...type.label, color: colors.indigoText2 },
  music: { gap: 10 },
  musicHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  musicCount: { fontSize: 14, color: colors.indigoBright },
  cardTitle: { fontFamily: font.sansSemi, fontSize: 16, lineHeight: 21, color: colors.text },
  caption: { ...type.caption, lineHeight: 18 },
  meet: { overflow: 'hidden' },
  meetMap: { height: 120, backgroundColor: colors.mapBg },
  meetBody: { padding: space.lg, gap: 4 },
  eyebrow: { ...type.eyebrow },
  section: { gap: 8 },
  sectionTitle: { ...type.label, color: colors.textMuted },
  list: { borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bringRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 14 },
  divided: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.indigo },
  bringText: { ...type.body, fontSize: 15 },
  leave: { marginTop: space.sm },
  leaveConfirm: { gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  leaveButtons: { flexDirection: 'row', gap: 8 },
  faintBtn: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  faintText: { ...type.label, color: colors.textMuted },
  devText: { ...type.caption, color: colors.textFaint, opacity: 0.6, textAlign: 'center' },
});
