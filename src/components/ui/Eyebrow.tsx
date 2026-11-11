import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, type } from '@/theme/tokens';

/** Small uppercase label, e.g. "ROLE", "WHEN THE LEAD CAR ARRIVES". */
export function Eyebrow({ style, children, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.t, style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  t: { ...type.eyebrow, color: colors.textFaint },
});
