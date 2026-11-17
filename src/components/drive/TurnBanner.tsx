import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/icons';
import { Mono } from '@/components/ui';
import { formatDistance, formatDuration } from '@/lib/format';
import type { NextStop } from '@/lib/geo';
import { colors, font, radius } from '@/theme/tokens';

type Props = {
  icon: IconName;
  distanceM: number;
  instruction: string;
  /** Small second line, e.g. "then continue on High Street" (L5). */
  detail?: string;
  /** Smaller one-line chip under the Slow down takeover (L2). */
  compact?: boolean;
};

/** Next-turn banner: mint 64×64 tile, mono distance, instruction. Crossfades when the instruction changes. */
export function TurnBanner({ icon, distanceM, instruction, detail, compact }: Props) {
  const label = `In ${formatDistance(distanceM)}, ${instruction}`;
  if (compact) {
    return (
      <View accessibilityLabel={label} style={styles.compact}>
        <View style={styles.compactTile}>
          <Icon name={icon} size={20} color={colors.mintInk} strokeWidth={2.4} />
        </View>
        <Animated.View key={instruction} entering={FadeIn.duration(200)} style={styles.compactText}>
          <Text style={styles.compactLine} numberOfLines={1}>
            <Mono style={styles.compactDist}>{formatDistance(distanceM)}</Mono> · {instruction}
          </Text>
        </Animated.View>
      </View>
    );
  }
  return (
    <View accessibilityRole="header" accessibilityLabel={label} accessibilityLiveRegion="polite" style={styles.banner}>
      <View style={styles.tile}>
        <Icon name={icon} size={34} color={colors.mintInk} strokeWidth={2.4} />
      </View>
      <View style={styles.text}>
        <Mono style={styles.distance}>{formatDistance(distanceM)}</Mono>
        <Animated.View key={instruction} entering={FadeIn.duration(220)}>
          <Text style={styles.instruction} numberOfLines={2}>
            {instruction}
          </Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </Animated.View>
      </View>
    </View>
  );
}

/** "1 · Menorah lighting · stop · 4 min" */
export function NextStopChip({ next, etaS }: { next: NextStop; etaS: number }) {
  const kind = next.stop.kind === 'stop' ? 'stop' : 'drive past';
  return (
    <View accessibilityLabel={`Next: stop ${next.stop.seq}, ${next.stop.name}, ${kind}, ${formatDuration(etaS)}`} style={styles.chip}>
      <View style={styles.seq}>
        <Mono style={styles.seqText}>{next.stop.seq}</Mono>
      </View>
      <Text style={styles.chipText} numberOfLines={1}>
        <Text style={styles.chipName}>{next.stop.name}</Text> · {kind} · <Mono style={styles.chipEta}>{formatDuration(etaS)}</Mono>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  tile: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 3, minWidth: 0 },
  distance: { fontSize: 32, lineHeight: 34, letterSpacing: -1, fontFamily: font.monoSemi },
  instruction: { fontFamily: font.sans, fontSize: 19, lineHeight: 24, color: colors.text },
  detail: { fontFamily: font.sansRegular, fontSize: 14, lineHeight: 19, color: colors.textMuted, marginTop: 2 },
  compact: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
  },
  compactTile: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  compactText: { flexShrink: 1 },
  compactLine: { fontFamily: font.sans, fontSize: 16, lineHeight: 21, color: colors.text },
  compactDist: { fontFamily: font.monoSemi, fontSize: 16, lineHeight: 21 },
  chip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
  },
  seq: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  seqText: { fontFamily: font.monoSemi, fontSize: 12, lineHeight: 14, color: colors.onyx },
  chipText: { flexShrink: 1, fontFamily: font.sansRegular, fontSize: 14, lineHeight: 18, color: colors.textMuted },
  chipName: { fontFamily: font.sans, color: colors.text },
  chipEta: { fontSize: 14, lineHeight: 18 },
});
