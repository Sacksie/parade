import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { colors, font, radius } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'indigo' | 'white' | 'mintSoft' | 'indigoSoft';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'pill';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to fill the row (flex: 1 in a row, full width in a column). */
  full?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const variants: Record<ButtonVariant, { bg: string; border: string; fg: string }> = {
  primary: { bg: colors.mint, border: colors.mint, fg: colors.mintInk },
  secondary: { bg: colors.surfaceRaised, border: colors.borderStrong, fg: colors.text },
  ghost: { bg: 'transparent', border: 'transparent', fg: colors.mintText },
  danger: { bg: colors.dangerBg, border: colors.dangerBorder, fg: colors.danger },
  indigo: { bg: colors.indigo, border: colors.indigo, fg: '#FFFFFF' },
  white: { bg: colors.white, border: colors.white, fg: colors.onyx },
  mintSoft: { bg: colors.mintTint, border: colors.mintBorder, fg: colors.mintText },
  indigoSoft: { bg: colors.indigoTint, border: colors.indigoBorder, fg: colors.indigoBright },
};

const sizes: Record<ButtonSize, { height: number; radius: number; px: number; fontSize: number; font: string; icon: number }> = {
  lg: { height: 58, radius: radius.button, px: 20, fontSize: 17, font: font.sansSemi, icon: 20 },
  md: { height: 50, radius: 16, px: 18, fontSize: 16, font: font.sansSemi, icon: 19 },
  sm: { height: 44, radius: 13, px: 14, fontSize: 14, font: font.sansSemi, icon: 17 },
  pill: { height: 38, radius: radius.pill, px: 14, fontSize: 13, font: font.sans, icon: 15 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconRight,
  loading,
  disabled,
  full,
  accessibilityLabel,
  style,
}: Props) {
  // Pill chips are neutral by default: surface bg with a strong border.
  const v = size === 'pill' && variant === 'secondary' ? { bg: colors.surface, border: colors.borderStrong, fg: colors.text } : variants[variant];
  const s = sizes[size];
  const off = disabled || loading;

  return (
    <PressableScale
      onPress={off ? undefined : onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={[
        styles.base,
        { height: s.height, borderRadius: s.radius, paddingHorizontal: s.px, backgroundColor: v.bg, borderColor: v.border },
        full && styles.full,
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={s.icon} color={v.fg} strokeWidth={size === 'lg' ? 2.2 : 2} /> : null}
          <Text numberOfLines={1} style={{ fontFamily: s.font, fontSize: s.fontSize, lineHeight: s.fontSize + 5, color: v.fg }}>
            {title}
          </Text>
          {iconRight ? <Icon name={iconRight} size={s.icon} color={v.fg} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, minWidth: 44 },
  full: { flex: 1, alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
