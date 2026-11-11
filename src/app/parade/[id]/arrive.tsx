import * as Speech from 'expo-speech';
import { useKeepAwakeSafe } from '@/lib/keepAwake';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { MapCanvasStatic, type MapCar } from '@/components/map/MapCanvas';
import { useCountdownRedirect, useNow } from '@/components/parade/hooks';
import { NotFound } from '@/components/parade/NotFound';
import { Button, IconButton, Mono, ProgressBar, goBackOr, showToast, success } from '@/components/ui';
import { dateTimeMs, formatCarNumber, formatDuration, msToHHMM } from '@/lib/format';
import { destination } from '@/lib/geo';
import { usePermissionStatus } from '@/lib/location';
import { checkIn, updateCar } from '@/store/actions';
import { useLive, useMyCar, useParade } from '@/store/selectors';
import { colors, font, radius, space, type } from '@/theme/tokens';
import type { LatLng } from '@/types';

const SOUND_TEST = 'This is your parade sound check. If you can hear this through the car speakers, tap Sounds good.';

/** Parked cars around the meeting point, so the map reads as "you're in the car park". */
function parkedCars(center: LatLng): MapCar[] {
  const spots: [number, number][] = [
    [300, 28], [320, 44], [340, 62], [20, 30], [40, 48], [60, 70], [200, 34], [160, 52], [110, 40],
  ];
  return spots.map(([bearing, m], i) => ({ id: `parked-${i}`, position: destination(center, bearing, m), role: 'car' as const }));
}

type SoundStep = 'idle' | 'playing' | 'asked' | 'no' | 'ok';

/**
 * A1: arrival check. In the real app this opens itself when your location is near the meeting
 * point (useMyLocation); for now the guest taps "I've arrived" on the hub.
 */
export default function Arrive() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parade = useParade(id);
  const myCar = useMyCar(id);
  const live = useLive(id);
  const now = useNow();
  const insets = useSafeAreaInsets();
  const location = usePermissionStatus();
  const [sound, setSound] = useState<SoundStep>(myCar?.soundOk ? 'ok' : 'idle');
  useKeepAwakeSafe();
  useCountdownRedirect(id, parade, live);

  if (!parade) return <NotFound />;
  if (!myCar) return <NotFound title="You're not in this parade" body="Join from the invite first, then check in when you arrive." />;

  const center = parade.meetingPoint;
  const checkedIn = myCar.checkedInAt;
  const musicSaved = myCar.musicProgress >= 1;
  const locationOk = location.status === 'granted';
  const soundOk = sound === 'ok';
  const setsOff = dateTimeMs(parade.date, parade.setsOffAt);

  const playTest = () => {
    setSound('playing');
    Speech.stop().catch(() => {});
    Speech.speak(SOUND_TEST, {
      rate: 0.95,
      onDone: () => setSound('asked'),
      onStopped: () => setSound('asked'),
      onError: () => {
        setSound('asked');
        showToast('Could not play the sound test on this device');
      },
    });
  };

  const ready = () => {
    checkIn(parade.id, myCar.id);
    updateCar(parade.id, myCar.id, { soundOk, locationOn: true, screenAwake: true });
    success();
    showToast(checkedIn ? 'Updated' : "You're checked in");
    goBackOr(`/parade/${parade.id}`);
  };

  const allowLocation = async () => {
    const r = await location.request();
    if (r === 'denied' && Platform.OS !== 'web') showToast('Turn location on for Parade in Settings');
  };

  return (
    <View style={styles.root}>
      <View style={styles.map}>
        {center ? (
          <MapCanvasStatic
            style={StyleSheet.absoluteFill}
            center={destination(center, 180, 25)}
            zoom={3.2}
            cars={[...parkedCars(center), { id: 'me', position: center, role: myCar.role, isMe: true }]}
          />
        ) : null}
        <View style={[styles.back, { top: Math.max(insets.top, space.sm) + space.sm }]}>
          <IconButton icon="back" accessibilityLabel="Back" onPress={() => goBackOr(`/parade/${parade.id}`)} />
        </View>
      </View>

      <View style={styles.panel}>
        <ScrollView contentContainerStyle={styles.panelContent} showsVerticalScrollIndicator={false}>
          <View style={styles.head}>
            <View style={styles.statusLine}>
              <View style={[styles.dot, checkedIn ? styles.dotMint : styles.dotIndigo]} />
              {checkedIn ? (
                <Text style={[styles.statusText, { color: colors.mintText }]}>
                  Checked in at <Mono size="small" style={{ color: colors.mintText }}>{msToHHMM(checkedIn)}</Mono>
                </Text>
              ) : (
                <Text style={[styles.statusText, { color: colors.indigoBright }]}>Arrival detected · {parade.meetingName ?? 'meeting point'}</Text>
              )}
            </View>
            <Text accessibilityRole="header" style={styles.title}>
              You&apos;ve arrived
            </Text>
            <Text style={styles.sub}>
              {myCar.name} · car <Mono style={styles.subMono}>{formatCarNumber(myCar.number)}</Mono>
            </Text>
          </View>

          <View style={styles.list}>
            <CheckRow
              n={1}
              done={locationOk}
              title={locationOk ? 'Location on' : 'Location'}
              detail={
                locationOk
                  ? 'Shared only while the parade is live'
                  : location.status === 'denied'
                    ? 'Turned off. Parade needs it to keep the convoy together.'
                    : 'Shared only while the parade is live'
              }
              action={
                locationOk ? null : location.status === 'denied' && Platform.OS !== 'web' ? (
                  <Button title="Settings" size="sm" variant="secondary" onPress={() => Linking.openSettings()} />
                ) : (
                  <Button title="Allow" size="sm" variant="secondary" onPress={allowLocation} />
                )
              }
            />
            <CheckRow
              n={2}
              done={musicSaved}
              title={musicSaved ? 'Music saved' : 'Saving the music'}
              detail={musicSaved ? `${parade.tracks.length} tracks, plays offline` : undefined}
              below={musicSaved ? null : <MusicProgress value={myCar.musicProgress} />}
            />
            <CheckRow n={3} done title="Screen stays on" detail="On while the app is open · keep it plugged in" />
            <SoundCheck step={sound} onPlay={playTest} onAnswer={(ok) => setSound(ok ? 'ok' : 'no')} />
          </View>

          {parade.meetingNotes ? (
            <View style={styles.note}>
              <Icon name="info" size={18} color={colors.textFaint} />
              <Text style={styles.noteText}>
                <Text style={{ color: colors.text }}>From the organiser: </Text>
                {parade.meetingNotes}
              </Text>
            </View>
          ) : null}

          <View style={styles.setsOff}>
            <View style={[styles.dot, styles.dotIndigo]} />
            <Text style={styles.setsOffText}>
              Sets off at <Mono size="small" style={styles.setsOffMono}>{parade.setsOffAt}</Mono>
              {setsOff > now ? (
                <>
                  {' · '}
                  <Mono size="small" style={styles.setsOffMono}>
                    {formatDuration((setsOff - now) / 1000)}
                  </Mono>
                </>
              ) : null}
            </Text>
          </View>

          <Text style={styles.dev}>Demo: arrival is detected near the meeting point in the real build.</Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) + 4 }]}>
          <Button title={checkedIn ? 'Update' : "I'm ready"} onPress={ready} />
          {!soundOk ? <Text style={styles.footnote}>You can check in now and do the sound check later.</Text> : null}
        </View>
      </View>
    </View>
  );
}

function CheckRow({
  n,
  done,
  title,
  detail,
  action,
  below,
}: {
  n: number;
  done: boolean;
  title: string;
  detail?: string;
  action?: React.ReactNode;
  below?: React.ReactNode;
}) {
  return (
    <View style={styles.row} accessible={!action} accessibilityLabel={`${title}${done ? ', done' : ''}${detail ? `. ${detail}` : ''}`}>
      <View style={styles.rowTop}>
        <StepMark n={n} done={done} />
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{title}</Text>
          {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
        </View>
        {action}
      </View>
      {below}
    </View>
  );
}

function StepMark({ n, done }: { n: number; done: boolean }) {
  if (done) return <Icon name="checkCircle" size={22} color={colors.mintText} />;
  return (
    <View style={styles.stepCircle}>
      <Mono style={styles.stepNum}>{n}</Mono>
    </View>
  );
}

function MusicProgress({ value }: { value: number }) {
  return (
    <View style={styles.musicRow}>
      <View style={{ flex: 1 }}>
        <ProgressBar value={value} tone="indigo" accessibilityLabel="Music saved" />
      </View>
      <Mono size="small" style={{ color: colors.indigoBright }}>
        {Math.round(value * 100)}%
      </Mono>
    </View>
  );
}

function SoundCheck({ step, onPlay, onAnswer }: { step: SoundStep; onPlay: () => void; onAnswer: (ok: boolean) => void }) {
  const done = step === 'ok';
  const detail =
    step === 'ok'
      ? 'Heard through the car speakers'
      : step === 'no'
        ? 'Check the Bluetooth or cable, turn the car volume up, then try again.'
        : step === 'idle'
          ? 'Connect to the car speakers, then play a short test.'
          : 'Did you hear it through the car speakers?';
  return (
    <View style={[styles.row, styles.lastRow]}>
      <View style={styles.rowTop}>
        <StepMark n={4} done={done} />
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, !done && { fontFamily: font.sansSemi }]}>Sound check</Text>
          <Text style={[styles.rowDetail, step === 'no' && { color: colors.warn }]}>{detail}</Text>
        </View>
        {done ? <Button title="Again" size="sm" variant="secondary" icon="refresh" onPress={onPlay} /> : null}
      </View>
      {step === 'idle' || step === 'no' ? (
        <Button title="Play test sound" icon="sound" size="md" variant="secondary" onPress={onPlay} />
      ) : step === 'playing' || step === 'asked' ? (
        <View style={styles.answers}>
          <Button title="Again" icon="refresh" size="md" variant="secondary" onPress={onPlay} loading={step === 'playing'} />
          <Button title="No" size="md" variant="secondary" full onPress={() => onAnswer(false)} />
          <Button title="Sounds good" size="md" variant="indigo" full onPress={() => onAnswer(true)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onyx },
  map: { height: 220, backgroundColor: colors.mapBg },
  back: { position: 'absolute', left: space.lg },
  panel: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.onyx,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  panelContent: { paddingHorizontal: space.xl, paddingTop: 22, paddingBottom: space.lg, gap: 16 },
  head: { gap: 4 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { ...type.caption },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotMint: { backgroundColor: colors.mint },
  dotIndigo: { backgroundColor: colors.indigo },
  title: { ...type.h1, fontSize: 28, lineHeight: 33, letterSpacing: -0.7 },
  sub: { ...type.label, fontSize: 15, lineHeight: 21, color: colors.textMuted },
  subMono: { fontSize: 15, color: colors.text },
  list: { borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  row: { paddingHorizontal: 14, paddingVertical: 10, minHeight: 56, justifyContent: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  lastRow: { borderBottomWidth: 0, paddingVertical: 14, gap: 12 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 1 },
  rowTitle: { ...type.body, fontSize: 15, lineHeight: 20 },
  rowDetail: { ...type.caption },
  stepCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontFamily: font.monoSemi, fontSize: 11, lineHeight: 13, color: colors.textMuted },
  musicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 34 },
  answers: { flexDirection: 'row', gap: 8 },
  note: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  noteText: { flex: 1, ...type.label, lineHeight: 20, color: colors.textMuted },
  setsOff: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  setsOffText: { ...type.label, color: colors.textFaint },
  setsOffMono: { fontSize: 14, color: colors.text },
  dev: { ...type.caption, color: colors.textFaint, opacity: 0.6, textAlign: 'center' },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  footnote: { ...type.caption, textAlign: 'center' },
});
