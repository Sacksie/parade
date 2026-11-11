import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Mono, StatRow, StatTile } from '@/components/ui';
import { formatDistance, formatDuration } from '@/lib/format';
import { colors, font, radius } from '@/theme/tokens';

type LeadProps = {
  behind: number;
  convoyM: number;
  /** Seconds to the next stop and its number, if any are left. */
  stopEtaS: number | null;
  stopSeq?: number;
};

/** L2 sheet: "You're the lead car", cars behind, convoy length, time to the next stop. */
export function LeadCard({ behind, convoyM, stopEtaS, stopSeq }: LeadProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.role}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>L</Text>
          </View>
          <Text style={styles.roleText}>You&apos;re the lead car</Text>
        </View>
        <Text style={styles.hint}>Alerts are read aloud</Text>
      </View>
      <StatRow columns={3}>
        <StatTile value={behind} label="cars behind" />
        <StatTile value={formatDistance(convoyM)} label="convoy length" />
        <StatTile value={stopEtaS != null ? formatDuration(stopEtaS) : '–'} label={stopSeq ? `to stop ${stopSeq}` : 'no stops left'} />
      </StatRow>
    </View>
  );
}

type SlowProps = { gapM: number; frontNumber?: number; held: number };

/** L2 takeover when the convoy splits behind the lead car. */
export function SlowDownCard({ gapM, frontNumber, held }: SlowProps) {
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.slow}>
      <View style={styles.slowTile}>
        <Icon name="chevronDown" size={34} color="#1A1404" strokeWidth={2.6} />
      </View>
      <View style={styles.slowText}>
        <Text style={styles.slowTitle}>Slow down</Text>
        <Text style={styles.slowBody}>
          Gap of <Mono style={styles.slowNum}>{formatDistance(gapM)}</Mono>
          {frontNumber ? (
            <>
              {' '}
              behind car <Mono style={styles.slowNum}>{frontNumber}</Mono>
            </>
          ) : null}
          {held > 0 ? (
            <>
              {' '}
              · <Mono style={styles.slowNum}>{held}</Mono> {held === 1 ? 'car' : 'cars'} held back
            </>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 999,
    backgroundColor: colors.indigoTint,
    borderWidth: 1,
    borderColor: colors.indigoBorder,
  },
  badge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: font.sansBold, fontSize: 12, color: colors.onyx },
  roleText: { fontFamily: font.sansSemi, fontSize: 14, lineHeight: 18, color: colors.indigoText2 },
  hint: { fontFamily: font.sansRegular, fontSize: 13, lineHeight: 17, color: colors.textFaint, flexShrink: 1, textAlign: 'right' },
  slow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: colors.warnBg,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    borderRadius: radius.xl,
  },
  slowTile: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.warn, alignItems: 'center', justifyContent: 'center' },
  slowText: { flex: 1, gap: 3 },
  slowTitle: { fontFamily: font.sansBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, color: colors.text },
  slowBody: { fontFamily: font.sansRegular, fontSize: 15, lineHeight: 20, color: colors.warnText },
  slowNum: { fontSize: 15, lineHeight: 20, color: colors.warnText },
});
