import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Segmented, showToast } from '@/components/ui';
import { formatCarNumber } from '@/lib/format';
import { setTimeScale, simulateBreakdown, simulateOffRoute } from '@/lib/simulator';
import { colors, font } from '@/theme/tokens';
import type { Car } from '@/types';

export type TimeScale = '1' | '4' | '10';

type Props = {
  paradeId: string;
  cars: Car[];
  /** Cars that already have an open help request. */
  helpCarIds: Set<string>;
  scale: TimeScale;
  onScale: (s: TimeScale) => void;
};

function DevLink({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={styles.link}>
      <Text style={styles.linkText}>{title}</Text>
    </PressableScale>
  );
}

/** Faint demo controls for the simulator (app-map "Dev affordances"). */
export function DevRow({ paradeId, cars, helpCarIds, scale, onScale }: Props) {
  const checkedIn = cars.filter((c) => c.checkedInAt != null);

  const offRoute = () => {
    const car = checkedIn.find((c) => c.role !== 'lead');
    if (!car) return showToast('No car to send off route');
    simulateOffRoute(paradeId, car.id);
    showToast(`Car ${formatCarNumber(car.number)} is going off route`);
  };

  const breakdown = () => {
    const pool = checkedIn.filter((c) => c.role === 'car' && !helpCarIds.has(c.id));
    if (pool.length === 0) return showToast('No car left to break down');
    const car = pool[Math.floor(pool.length / 3 + Math.random() * (pool.length / 3))] ?? pool[0];
    simulateBreakdown(paradeId, car.id);
    showToast(`Car ${formatCarNumber(car.number)} has broken down`);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Demo · simulator speed</Text>
      <Segmented<TimeScale>
        height={42}
        accessibilityLabel="Simulator speed"
        value={scale}
        onChange={(k) => {
          onScale(k);
          setTimeScale(paradeId, Number(k));
        }}
        options={[
          { key: '1', label: '×1' },
          { key: '4', label: '×4' },
          { key: '10', label: '×10' },
        ]}
      />
      <View style={styles.links}>
        <DevLink title="Off-route a car" onPress={offRoute} />
        <DevLink title="Breakdown" onPress={breakdown} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, opacity: 0.75, marginTop: 8 },
  label: { fontFamily: font.sans, fontSize: 12, lineHeight: 16, color: colors.textFaint },
  links: { flexDirection: 'row', gap: 8 },
  link: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  linkText: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted },
});
