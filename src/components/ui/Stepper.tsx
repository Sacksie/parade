import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { select } from '@/components/ui/haptics';
import { colors, type } from '@/theme/tokens';

type Props = {
  value: number;
  onDec: () => void;
  onInc: () => void;
  /** e.g. (v) => `${v} min` */
  format?: (v: number) => string;
  decDisabled?: boolean;
  incDisabled?: boolean;
  label?: string;
};

/** C5 "For 10 min": minus, mono value, plus on an onyx track. */
export function Stepper({ value, onDec, onInc, format = String, decDisabled, incDisabled, label }: Props) {
  const press = (fn: () => void) => () => {
    select();
    fn();
  };
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track} accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: format(value) }}>
        <PressableScale pressedScale={0.9} disabled={decDisabled} onPress={press(onDec)} accessibilityRole="button" accessibilityLabel="Shorter" style={[styles.btn, decDisabled && styles.off]}>
          <Icon name="minus" size={16} strokeWidth={2.4} />
        </PressableScale>
        <Text style={styles.value}>{format(value)}</Text>
        <PressableScale pressedScale={0.9} disabled={incDisabled} onPress={press(onInc)} accessibilityRole="button" accessibilityLabel="Longer" style={[styles.btn, incDisabled && styles.off]}>
          <Icon name="plus" size={16} strokeWidth={2.4} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { ...type.label },
  track: { flexDirection: 'row', alignItems: 'center', padding: 3, borderRadius: 14, backgroundColor: colors.onyx, borderWidth: 1, borderColor: colors.border },
  btn: { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.3 },
  value: { ...type.monoSmall, minWidth: 58, textAlign: 'center', fontFamily: type.monoLarge.fontFamily, fontSize: 16, lineHeight: 20 },
});
