import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { select } from '@/components/ui/haptics';
import { colors, space, type } from '@/theme/tokens';

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  /** Fainter second sentence, as in the C6 rights box. */
  detail?: string;
  /** Wrap in the bordered card the design uses. Default true. */
  boxed?: boolean;
};

export function Checkbox({ value, onChange, label, detail, boxed = true }: Props) {
  return (
    <PressableScale
      pressedScale={0.99}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      onPress={() => {
        select();
        onChange(!value);
      }}
      style={[styles.row, boxed && styles.boxed]}>
      <View style={[styles.box, value && styles.boxOn]}>{value ? <Icon name="check" size={14} color={colors.mintInk} strokeWidth={3} /> : null}</View>
      <Text style={styles.text}>
        {label}
        {detail ? <Text style={styles.detail}> {detail}</Text> : null}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  boxed: { padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  box: {
    width: 22,
    height: 22,
    marginTop: 0,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.mint, borderColor: colors.mint },
  text: { flex: 1, ...type.label, fontSize: 14, lineHeight: 20, color: colors.text },
  detail: { color: colors.textFaint },
});
