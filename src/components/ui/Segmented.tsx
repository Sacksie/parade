import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { select } from '@/components/ui/haptics';
import { colors, font } from '@/theme/tokens';

type Option<K extends string> = { key: K; label: string; icon?: IconName; /** Red recording dot, as on "Record a drive". */ dot?: string };

type Props<K extends string> = {
  options: Option<K>[];
  value: K;
  onChange: (key: K) => void;
  /** 42 (default, route sheet) or 44 (stop sheet). */
  height?: 42 | 44;
  accessibilityLabel?: string;
};

/** Pill group on an onyx track with a raised active segment. */
export function Segmented<K extends string>({ options, value, onChange, height = 44, accessibilityLabel }: Props<K>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={[styles.track, { padding: height === 42 ? 4 : 3 }]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <PressableScale
            key={o.key}
            pressedScale={0.97}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) select();
              onChange(o.key);
            }}
            style={[styles.seg, { height, borderRadius: height === 42 ? 10 : 11 }, active && styles.active]}>
            {o.dot ? <View style={[styles.dot, { backgroundColor: o.dot }]} /> : null}
            {o.icon ? <Icon name={o.icon} size={16} color={active ? colors.text : colors.textMuted} /> : null}
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: 3, borderRadius: 14, backgroundColor: colors.onyx, borderWidth: 1, borderColor: colors.border },
  seg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  active: { backgroundColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: font.sans, fontSize: 15, color: colors.textMuted },
  labelActive: { fontFamily: font.sansSemi, color: colors.text },
});
