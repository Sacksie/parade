import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

/** Tiny hand-drawn icons so we don't pull in an icon font for four glyphs. */

export function CloseIcon({ size = 22, color = colors.text }: { size?: number; color?: string }) {
  const bar = { position: 'absolute' as const, width: size, height: 2.2, borderRadius: 2, backgroundColor: color };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[bar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[bar, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

export function PlusIcon({ size = 18, color = colors.mintInk }: { size?: number; color?: string }) {
  const bar = { position: 'absolute' as const, borderRadius: 2, backgroundColor: color };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[bar, { width: size, height: 2.4 }]} />
      <View style={[bar, { width: 2.4, height: size }]} />
    </View>
  );
}

export function ChevronIcon({
  direction,
  size = 10,
  color = colors.text,
}: {
  direction: 'left' | 'right';
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderLeftWidth: 2.2,
        borderBottomWidth: 2.2,
        borderColor: color,
        transform: [{ rotate: direction === 'left' ? '45deg' : '-135deg' }],
        marginLeft: direction === 'left' ? size / 3 : 0,
        marginRight: direction === 'right' ? size / 3 : 0,
      }}
    />
  );
}

export function CalendarIcon({ color = colors.textMuted }: { color?: string }) {
  return (
    <View style={[styles.cal, { borderColor: color }]}>
      <View style={[styles.calBar, { backgroundColor: color }]} />
      <View style={[styles.calRing, { left: 4, backgroundColor: color }]} />
      <View style={[styles.calRing, { right: 4, backgroundColor: color }]} />
    </View>
  );
}

export function ArrowIcon({ color = colors.text }: { color?: string }) {
  return (
    <View style={{ width: 16, height: 16, justifyContent: 'center' }}>
      <View style={{ height: 2, width: 14, backgroundColor: color, borderRadius: 2 }} />
      <View
        style={{
          position: 'absolute',
          right: 2,
          width: 8,
          height: 8,
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cal: {
    width: 20,
    height: 19,
    borderWidth: 1.8,
    borderRadius: 4,
    marginTop: 2,
  },
  calBar: { height: 1.8, marginTop: 4 },
  calRing: { position: 'absolute', top: -4, width: 1.8, height: 5, borderRadius: 1 },
});
