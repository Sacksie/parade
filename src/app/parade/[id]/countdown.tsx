import { useKeepAwakeSafe } from '@/lib/keepAwake';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/components/icons';
import { useNow } from '@/components/parade/hooks';
import { NotFound } from '@/components/parade/NotFound';
import { Screen, goReplace, success, tap } from '@/components/ui';
import { startParade } from '@/store/actions';
import { useIsOrganiser, useLive, useMyCar, useParade } from '@/store/selectors';
import { colors, font, type } from '@/theme/tokens';

const SIZE = 240;
const R = 112;
const C = 2 * Math.PI * R;

/** A4: every phone counts down from the same timestamp. Music starts on zero. */
export default function Countdown() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parade = useParade(id);
  const live = useLive(id);
  const isOrganiser = useIsOrganiser(id);
  const myCar = useMyCar(id);
  // 100 ms so the ring sweeps smoothly; the number still derives from the timestamp.
  const now = useNow(100);
  useKeepAwakeSafe();

  const endsAt = live?.countdownEndsAt;
  const [totalMs] = useState(() => Math.max(1000, (endsAt ?? Date.now()) - Date.now()));
  const remainingMs = endsAt ? Math.max(0, endsAt - now) : 0;
  const seconds = Math.ceil(remainingMs / 1000);
  const status = parade?.status;
  // Organisers who are also in a car still run the parade from the console.
  const nextPath = isOrganiser ? '/parade/[id]/console' : '/parade/[id]/drive';

  const started = useRef(false);
  const lastBuzz = useRef<number | null>(null);

  // A haptic tick on 3, 2, 1, and a success thump on zero.
  useEffect(() => {
    if (!endsAt || seconds === lastBuzz.current) return;
    lastBuzz.current = seconds;
    if (seconds > 0 && seconds <= 3) tap();
  }, [seconds, endsAt]);

  useEffect(() => {
    if (!id || !parade || started.current) return;
    if (endsAt && remainingMs > 0) return;
    if (!endsAt && status !== 'live') {
      // Deep-linked with nothing counting down: back to the hub.
      started.current = true;
      goReplace('/parade/[id]', { id });
      return;
    }
    started.current = true;
    success();
    // Idempotent: the first phone to reach zero flips the parade live; the rest see it already live.
    if (status !== 'live') startParade(id);
    goReplace(status === 'ended' ? '/parade/[id]/done' : nextPath, { id });
  }, [id, parade, endsAt, remainingMs, status, nextPath]);

  if (!parade) return <NotFound />;

  const fraction = endsAt ? remainingMs / totalMs : 0;
  const lead = myCar?.role === 'lead';

  return (
    <Screen contentStyle={styles.content}>
      <Text style={styles.name} numberOfLines={1}>
        {parade.name}
      </Text>

      <View style={styles.center}>
        <View
          style={styles.ring}
          accessible
          accessibilityRole="timer"
          accessibilityLiveRegion="assertive"
          accessibilityLabel={seconds > 0 ? `Parade starts in ${seconds} seconds` : 'Parade starting'}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={StyleSheet.absoluteFill}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={colors.surfaceRaised} strokeWidth={6} />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={colors.mint}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={`${C}`}
              strokeDashoffset={C * (1 - fraction)}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>
          <Text style={styles.number}>{seconds}</Text>
        </View>
        <View style={styles.texts}>
          <Text style={styles.headline}>Here we go</Text>
          <Text style={styles.caption}>Music starts on zero, in every car at once.</Text>
        </View>
      </View>

      <View style={styles.firstCard}>
        <View style={styles.firstIcon}>
          <Icon name={lead ? 'lead' : 'car'} size={22} color={colors.indigoBright} />
        </View>
        <View style={styles.firstText}>
          <Text style={type.caption}>First</Text>
          <Text style={styles.firstBody}>{lead ? 'Lead the way out of the car park, slowly' : 'Follow the car in front out of the car park'}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: 24, paddingTop: 48 },
  name: { ...type.label, fontSize: 15, color: colors.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  ring: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  number: { fontFamily: font.monoSemi, fontSize: 128, lineHeight: 136, letterSpacing: -7.7, color: colors.text, fontVariant: ['tabular-nums'] },
  texts: { alignItems: 'center', gap: 8 },
  headline: { fontFamily: font.sansBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, color: colors.text },
  caption: { ...type.label, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },
  firstCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  firstIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.indigoTint, alignItems: 'center', justifyContent: 'center' },
  firstText: { flex: 1, gap: 2 },
  firstBody: { fontFamily: font.sans, fontSize: 17, lineHeight: 22, color: colors.text },
});
