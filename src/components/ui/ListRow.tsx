import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { Mono } from '@/components/ui/Mono';
import { tones, type Tone } from '@/components/ui/tones';
import { colors, font, radius, type } from '@/theme/tokens';

/** Rounded container for a stack of rows. Rows draw their own bottom divider; the last one hides it. */
export function List({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = Array.isArray(children) ? children.flat().filter(Boolean) : [children];
  return (
    <View style={[styles.list, style]}>
      {items.map((child, i) => (
        <View key={i} style={i < items.length - 1 ? styles.divided : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

type RowProps = {
  left?: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Subtitle colour, as in "Not chosen · recommended" (warn). */
  subtitleTone?: Tone;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  /** Tint the whole row (warn rows in the turn list). */
  tone?: Tone;
  minHeight?: number;
};

export function ListRow({ left, title, subtitle, subtitleTone, right, onPress, chevron, tone, minHeight = 58 }: RowProps) {
  const body = (
    <View style={[styles.row, { minHeight }, tone && tone !== 'neutral' && { backgroundColor: tones[tone].bg }]}>
      {left}
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, subtitleTone && { color: tones[subtitleTone].fg }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron ? <Icon name="chevronRight" size={16} color={colors.textFaint} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <PressableScale pressedScale={0.99} onPress={onPress} accessibilityRole="button" accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}>
      {body}
    </PressableScale>
  );
}

/** 32×32 indigo square with a letter: L (lead), T (tail), C (co-organiser), O (organiser). */
export function RoleBadge({ letter, size = 32 }: { letter: 'L' | 'T' | 'O' | 'C'; size?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size >= 36 ? 11 : size >= 32 ? 10 : 9 }]}>
      <Text style={[styles.badgeText, { fontSize: size >= 36 ? 14 : size >= 32 ? 13 : 12 }]}>{letter}</Text>
    </View>
  );
}

/** Faint mono car number, "07". */
export function CarNumber({ value }: { value: number | string }) {
  const text = typeof value === 'number' ? String(value).padStart(2, '0') : value;
  return (
    <Mono size="small" style={styles.carNo}>
      {text}
    </Mono>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  divided: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 },
  texts: { flex: 1, gap: 1, paddingVertical: 8 },
  title: { ...type.body, fontSize: 15, lineHeight: 20 },
  subtitle: { ...type.caption },
  badge: { backgroundColor: colors.indigoTint, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: font.sansBold, color: colors.indigoBright },
  carNo: { width: 22, color: colors.textFaint },
});
