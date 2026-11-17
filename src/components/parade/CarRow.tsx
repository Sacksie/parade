import { StyleSheet, Text, View } from 'react-native';

import { CarNumber, ListRow, Mono, RoleBadge, tones } from '@/components/ui';
import { colors, type } from '@/theme/tokens';
import type { Car } from '@/types';

import { carStatus, roleLetter } from './carStatus';

type Props = {
  car: Car;
  /** Organisers see phone numbers; guests never do. */
  showPhone?: boolean;
  showRole?: boolean;
  isMe?: boolean;
  onPress?: () => void;
};

/** Guest-list row: faint car number, name, status caption on the right. */
export function CarRow({ car, showPhone, showRole, isMe, onPress }: Props) {
  const status = carStatus(car);
  const letter = showRole ? roleLetter(car) : null;
  return (
    <ListRow
      minHeight={52}
      onPress={onPress}
      left={
        <View style={styles.left}>
          <CarNumber value={car.number} />
          {letter ? <RoleBadge letter={letter} size={26} /> : null}
        </View>
      }
      title={isMe ? `${car.name} (you)` : car.name}
      subtitle={showPhone ? car.phone ?? 'No phone' : undefined}
      right={
        <Text style={[styles.status, { color: status.tone === 'neutral' ? colors.textFaint : tones[status.tone].fg }]}>
          {/* Percentages are numbers: mono. */}
          {status.label.startsWith('Music ') && status.label.endsWith('%') ? (
            <>
              Music <Mono size="small" style={{ color: tones.indigo.fg }}>{status.label.slice(6)}</Mono>
            </>
          ) : (
            status.label
          )}
        </Text>
      }
      chevron={!!onPress}
    />
  );
}

const styles = StyleSheet.create({
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { ...type.caption },
});
