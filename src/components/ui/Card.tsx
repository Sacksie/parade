import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { tones, type Tone } from '@/components/ui/tones';
import { colors, radius, space } from '@/theme/tokens';

type Props = ViewProps & {
  tone?: Tone;
  /** 18 (default) or 20, as the design uses for hero cards. */
  large?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ tone = 'neutral', large, padded = true, style, ...rest }: Props) {
  const t = tones[tone];
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: tone === 'neutral' ? colors.surface : t.bg, borderColor: t.border, borderRadius: large ? radius.lg : radius.card },
        padded && { padding: space.lg },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
});
