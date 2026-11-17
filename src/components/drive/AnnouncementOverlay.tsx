import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { Button, Mono } from '@/components/ui';
import { msToHHMM } from '@/lib/format';
import { colors, font } from '@/theme/tokens';
import type { Announcement } from '@/types';

type Props = {
  announcement: Announcement;
  speaking: boolean;
  closesAt: number | null;
  now: number;
  onReplay: () => void;
  onClose: () => void;
};

const BARS = [8, 18, 12, 22, 10, 16];
const LINGER_S = 6;

/** L3: full-screen, read aloud with the music lowered, closes itself. */
export function AnnouncementOverlay({ announcement, speaking, closesAt, now, onReplay, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const left = closesAt ? Math.max(0, Math.ceil((closesAt - now) / 1000)) : null;
  const long = announcement.text.length > 110;

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(200)}
      accessibilityViewIsModal
      accessibilityRole="alert"
      style={[styles.root, { paddingTop: Math.max(insets.top, 16) + 24, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
      <View style={styles.top}>
        <View style={styles.from}>
          <Icon name="megaphone" size={18} color={colors.indigoBright} />
          <Text style={styles.fromText}>From the organiser</Text>
        </View>
        <Mono style={styles.time}>{msToHHMM(announcement.createdAt)}</Mono>
      </View>

      <Animated.View entering={reduced ? FadeIn.duration(220) : FadeInDown.duration(260)} style={styles.middle}>
        <View style={styles.reading}>
          <View style={styles.bars}>
            {BARS.map((h, i) => (
              <View key={i} style={[styles.bar, { height: h, opacity: speaking ? 1 : 0.35 }]} />
            ))}
          </View>
          <Text style={styles.readingText}>{speaking ? 'Reading aloud · music lowered' : 'Read aloud'}</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.message, long && styles.messageLong]}>
          {announcement.text}
        </Text>
      </Animated.View>

      <View style={styles.bottom}>
        {left != null ? (
          <View style={styles.closes}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(1, left / LINGER_S) * 100}%` }]} />
            </View>
            <Text style={styles.closesText}>
              Closes in <Mono style={styles.closesNum}>{left}s</Mono>
            </Text>
          </View>
        ) : null}
        <View style={styles.buttons}>
          <Button title="Replay" icon="refresh" variant="secondary" full onPress={onReplay} accessibilityLabel="Read the announcement again" />
          <Button title="Got it" variant="white" full onPress={onClose} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, elevation: 50, backgroundColor: 'rgba(8, 8, 12, 0.92)', paddingHorizontal: 24, gap: 24 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  from: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 999,
    backgroundColor: colors.indigoTint,
    borderWidth: 1,
    borderColor: colors.indigoBorder,
  },
  fromText: { fontFamily: font.sans, fontSize: 15, lineHeight: 19, color: colors.indigoText2 },
  time: { fontSize: 14, lineHeight: 18, color: colors.textFaint },
  middle: { flex: 1, justifyContent: 'center', gap: 24 },
  reading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 22 },
  bar: { width: 4, borderRadius: 2, backgroundColor: colors.mint },
  readingText: { fontFamily: font.sansRegular, fontSize: 15, lineHeight: 19, color: colors.textMuted },
  message: { fontFamily: font.sansSemi, fontSize: 40, lineHeight: 45, letterSpacing: -1.2, color: colors.text },
  messageLong: { fontSize: 30, lineHeight: 35, letterSpacing: -0.8 },
  bottom: { gap: 14 },
  closes: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: colors.textMuted },
  closesText: { fontFamily: font.sansRegular, fontSize: 14, lineHeight: 18, color: colors.textFaint },
  closesNum: { fontSize: 14, lineHeight: 18, color: colors.text },
  buttons: { flexDirection: 'row', gap: 10 },
});
