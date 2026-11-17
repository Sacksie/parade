import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { IconButton, Mono } from '@/components/ui';
import type { ParadePlayer } from '@/lib/audio';
import { colors, font, radius } from '@/theme/tokens';
import type { Announcement } from '@/types';

/** Indigo music tile, title, "Track 4 of 11 · In sync", local mute. */
export function NowPlaying({ player }: { player: ParadePlayer }) {
  const { track, index, total, paused, synced, muted, toggleMute } = player;
  const status = paused ? 'Paused' : muted ? 'Muted in this car' : synced ? 'In sync' : 'Syncing…';
  const statusColor = paused || muted ? colors.textFaint : synced ? colors.mintText : colors.warn;
  return (
    <View style={styles.row}>
      <View style={styles.tile}>
        <Icon name="music" size={22} color={colors.indigoBright} />
      </View>
      <View style={styles.texts} accessibilityLabel={track ? `Now playing ${track.title}, track ${index + 1} of ${total}, ${status}` : 'No music for this parade'}>
        <Text style={styles.title} numberOfLines={1}>
          {track ? track.title : 'No music'}
        </Text>
        {track ? (
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              Track <Mono style={styles.metaNum}>{index + 1}</Mono> of <Mono style={styles.metaNum}>{total}</Mono>
            </Text>
            <View style={styles.sync}>
              <View style={[styles.dot, { backgroundColor: paused || muted ? colors.textFaint : synced ? colors.mint : colors.warn }]} />
              <Text style={[styles.metaText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.metaText}>The organiser hasn&apos;t added a playlist</Text>
        )}
      </View>
      {track ? (
        <IconButton
          icon={muted ? 'mute' : 'sound'}
          size={50}
          onPress={toggleMute}
          accessibilityLabel={muted ? 'Unmute music in this car' : 'Mute music in this car'}
        />
      ) : null}
    </View>
  );
}

/** "Last announcement · 2 min ago" with Replay. */
export function LastAnnouncementRow({ announcement, now, onReplay }: { announcement: Announcement; now: number; onReplay: () => void }) {
  const mins = Math.round((now - announcement.createdAt) / 60_000);
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={onReplay}
      accessibilityRole="button"
      accessibilityLabel={`Replay last announcement: ${announcement.text}`}
      style={styles.ann}>
      <Icon name="megaphone" size={20} color={colors.indigoBright} />
      <View style={styles.texts}>
        <Text style={styles.annMeta}>
          Last announcement ·{' '}
          {mins < 1 ? (
            'just now'
          ) : (
            <>
              <Mono style={styles.annNum}>{mins} min</Mono> ago
            </>
          )}
        </Text>
        <Text style={styles.annText} numberOfLines={1}>
          {announcement.text}
        </Text>
      </View>
      <Text style={styles.replay}>Replay</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 50, height: 50, borderRadius: radius.md, backgroundColor: colors.indigoTint, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontFamily: font.sansSemi, fontSize: 17, lineHeight: 22, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaText: { fontFamily: font.sansRegular, fontSize: 14, lineHeight: 18, color: colors.textMuted },
  metaNum: { fontSize: 14, lineHeight: 18, color: colors.textMuted },
  sync: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  ann: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
  },
  annMeta: { fontFamily: font.sansRegular, fontSize: 13, lineHeight: 17, color: colors.textFaint },
  annNum: { fontSize: 13, lineHeight: 17, color: colors.textFaint },
  annText: { fontFamily: font.sansRegular, fontSize: 15, lineHeight: 20, color: colors.text },
  replay: { fontFamily: font.sans, fontSize: 14, lineHeight: 18, color: colors.textMuted },
});
