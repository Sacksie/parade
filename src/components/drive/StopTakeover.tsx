import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon, type IconName } from '@/components/icons';
import { Mono } from '@/components/ui';
import { formatClock } from '@/lib/format';
import { colors, font, radius } from '@/theme/tokens';
import type { Stop } from '@/types';

type Props = {
  stop: Stop;
  remainingS: number;
  /** "Stopped on High Street" */
  where: string;
  musicPaused: boolean;
  /** Help button / banner, rendered last. */
  children?: React.ReactNode;
};

const R = 28;
const C = 2 * Math.PI * R;

/** L4: at a stop. Stop name, ring + "Moving again in about 6:40", what's happening. */
export function StopTakeover({ stop, remainingS, where, musicPaused, children }: Props) {
  const isStop = stop.kind === 'stop';
  const totalS = Math.max(1, stop.durationMin * 60);
  const done = 1 - Math.min(1, remainingS / totalS);
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.where}>
          <View style={styles.seq}>
            <Mono style={styles.seqText}>{stop.seq}</Mono>
          </View>
          <Text style={styles.whereText} numberOfLines={1}>
            {where}
          </Text>
        </View>
        <Text accessibilityRole="header" style={styles.name}>
          {stop.name}
        </Text>
      </View>

      {isStop ? (
        <View style={styles.timer} accessibilityLabel={remainingS > 0 ? `Moving again in about ${formatClock(remainingS)}` : 'Moving off any moment'}>
          <Svg width={64} height={64} viewBox="0 0 64 64">
            <Circle cx={32} cy={32} r={R} fill="none" stroke={colors.border} strokeWidth={5} />
            <Circle
              cx={32}
              cy={32}
              r={R}
              fill="none"
              stroke={colors.mint}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`${C}`}
              strokeDashoffset={C * done}
              transform="rotate(-90 32 32)"
            />
          </Svg>
          <View style={styles.timerText}>
            <Text style={styles.timerLabel}>{remainingS > 0 ? 'Moving again in about' : 'Moving off'}</Text>
            {remainingS > 0 ? <Mono style={styles.clock}>{formatClock(remainingS)}</Mono> : <Text style={styles.soon}>Any moment now</Text>}
          </View>
        </View>
      ) : (
        <View style={styles.timer}>
          <View style={styles.slowTile}>
            <Icon name="car" size={28} color={colors.indigoBright} />
          </View>
          <View style={styles.timerText}>
            <Text style={styles.soon}>Drive past slowly</Text>
            {stop.arrivalMessage ? <Text style={styles.timerLabel}>{stop.arrivalMessage}</Text> : null}
          </View>
        </View>
      )}

      {isStop ? (
        <View style={styles.list}>
          {musicPaused ? <Line icon="pause" text="Music paused in every car" /> : <Line icon="music" text="Music keeps playing" />}
          <Line icon="clock" text="You'll hear a chime 30 seconds before moving off" />
        </View>
      ) : null}

      {children}
    </View>
  );
}

function Line({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.line}>
      <Icon name={icon} size={20} color={colors.indigoBright} />
      <Text style={styles.lineText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  head: { gap: 6 },
  where: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seq: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  seqText: { fontFamily: font.monoSemi, fontSize: 12, lineHeight: 14, color: colors.onyx },
  whereText: { fontFamily: font.sansRegular, fontSize: 14, lineHeight: 18, color: colors.textMuted, flexShrink: 1 },
  name: { fontFamily: font.sansBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.75, color: colors.text },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerText: { flex: 1, gap: 2 },
  timerLabel: { fontFamily: font.sansRegular, fontSize: 13, lineHeight: 17, color: colors.textFaint },
  clock: { fontFamily: font.monoSemi, fontSize: 34, lineHeight: 36, letterSpacing: -1 },
  soon: { fontFamily: font.sansSemi, fontSize: 20, lineHeight: 25, color: colors.text },
  slowTile: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.indigoTint, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 10 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lineText: { flex: 1, fontFamily: font.sansRegular, fontSize: 15, lineHeight: 20, color: colors.textMuted },
});
