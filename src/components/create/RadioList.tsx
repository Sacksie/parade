import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { select } from '@/components/ui';
import { colors, font, radius, type } from '@/theme/tokens';

type Option<K extends string> = { key: K; label: string; detail?: string };

type Props<K extends string> = {
  label: string;
  options: Option<K>[];
  value: K;
  onChange: (key: K) => void;
};

/** C1 "Who can join" / C7 "Where will you be": a boxed list of radio rows. */
export function RadioList<K extends string>({ label, options, value, onChange }: Props<K>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.legend}>{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.box}>
        {options.map((o, i) => {
          const on = o.key === value;
          return (
            <PressableScale
              key={o.key}
              pressedScale={0.99}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={o.detail ? `${o.label}, ${o.detail}` : o.label}
              onPress={() => {
                if (!on) select();
                onChange(o.key);
              }}
              style={[styles.row, { minHeight: o.detail ? 54 : 50 }, i < options.length - 1 && styles.divided]}>
              <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.dot} /> : null}</View>
              <View style={styles.texts}>
                <Text style={[styles.label, !o.detail && { fontSize: 15 }]}>{o.label}</Text>
                {o.detail ? <Text style={styles.detail}>{o.detail}</Text> : null}
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  legend: { ...type.label, color: colors.textMuted },
  box: { borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  divided: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  radio: { width: 20, height: 20, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.mint, borderWidth: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.mint },
  texts: { flex: 1, gap: 2 },
  label: { fontFamily: font.sans, fontSize: 16, lineHeight: 21, color: colors.text },
  detail: { ...type.caption },
});
