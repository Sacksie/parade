import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { colors } from '@/theme/tokens';

type Props = {
  icon: IconName;
  onPress?: () => void;
  size?: 44 | 46 | 50;
  variant?: 'ghost' | 'secondary' | 'primary' | 'white';
  accessibilityLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variants = {
  ghost: { bg: 'transparent', border: 'transparent', fg: colors.text },
  secondary: { bg: colors.surfaceRaised, border: colors.borderStrong, fg: colors.text },
  primary: { bg: colors.mint, border: colors.mint, fg: colors.mintInk },
  white: { bg: colors.white, border: colors.white, fg: colors.onyx },
} as const;

export function IconButton({ icon, onPress, size = 44, variant = 'secondary', accessibilityLabel, disabled, style }: Props) {
  const v = variants[variant];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      pressedScale={0.94}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size >= 50 ? 16 : size >= 46 ? 15 : 14, backgroundColor: v.bg, borderColor: v.border },
        disabled && { opacity: 0.4 },
        style,
      ]}>
      <Icon name={icon} size={size >= 50 ? 22 : 20} color={v.fg} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
