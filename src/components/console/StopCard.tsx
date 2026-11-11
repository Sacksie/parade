import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Button, Card, tap } from '@/components/ui';
import { formatClock } from '@/lib/format';
import { colors, font } from '@/theme/tokens';
import type { Stop } from '@/types';

type Props = {
  stop: Stop;
  enteredAt: number;
  now: number;
  /** Simulator time scale: the demo convoy shortens stops by this factor. */
  timeScale: number;
  onMoveOn: () => void;
};

/** "At stop 1 · Menorah lighting · moving in 7:42" with an early move-off. */
export function StopCard({ stop, enteredAt, now, timeScale, onMoveOn }: Props) {
  const passing = stop.kind === 'drive_past';
  const leftS = (stop.durationMin * 60) / timeScale - (now - enteredAt) / 1000;
  return (
    <Card tone="indigo" style={styles.card}>
      <Icon name={passing ? 'eye' : 'flag'} size={20} color={colors.indigoBright} />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {passing ? 'Passing' : 'At'} stop <Text style={styles.mono}>{stop.seq}</Text> · {stop.name}
        </Text>
        <Text style={styles.meta}>
          {passing ? (
            'Drive-past, the convoy keeps moving'
          ) : (
            <>
              {stop.pauseMusic ? 'Music paused · ' : ''}moving in <Text style={styles.mono}>{formatClock(leftS)}</Text>
            </>
          )}
        </Text>
      </View>
      {passing ? null : (
        <Button
          title="Move on now"
          variant="white"
          size="sm"
          onPress={() => {
            tap();
            onMoveOn();
          }}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: font.sansSemi, fontSize: 15, lineHeight: 20, color: colors.text },
  meta: { fontFamily: font.sans, fontSize: 13, lineHeight: 17, color: colors.indigoText2 },
  mono: { fontFamily: font.mono, fontVariant: ['tabular-nums'] },
});
