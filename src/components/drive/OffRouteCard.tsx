import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { colors, font, radius } from '@/theme/tokens';

/** L5 sheet copy: reassurance plus "music keeps playing". The directions live in the TurnBanner. */
export function OffRouteCard({ muted }: { muted: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          Missed the turn? No problem
        </Text>
        <Text style={styles.body}>Head for the mint line on the map. You&apos;ll slot back into the convoy where you rejoin it.</Text>
      </View>
      <View style={styles.music}>
        <Icon name="music" size={18} color={colors.indigoBright} />
        <Text style={styles.musicText}>{muted ? 'Music is muted in this car' : 'Music keeps playing in sync'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  copy: { gap: 4, paddingHorizontal: 4 },
  title: { fontFamily: font.sansSemi, fontSize: 18, lineHeight: 23, color: colors.text },
  body: { fontFamily: font.sansRegular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  music: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.card - 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  musicText: { flex: 1, fontFamily: font.sansRegular, fontSize: 14, lineHeight: 18, color: colors.textMuted },
});
