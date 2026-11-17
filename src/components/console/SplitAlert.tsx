import { StyleSheet, Text } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Banner, Button } from '@/components/ui';
import { roadNameAt } from '@/data/mockTown';
import { formatDistance } from '@/lib/format';
import { colors, font } from '@/theme/tokens';
import type { SplitAlert as Split } from '@/types';

/** Outlined amber-border button, as in the design's "Announce". */
function OutlineAction({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={styles.outline}>
      <Text style={styles.outlineText}>{title}</Text>
    </PressableScale>
  );
}

/** "Please close up, we've split at Station Road" */
export function closeUpMessage(split: Split) {
  const road = roadNameAt(split.position);
  return road ? `Please close up, we've split at ${road}` : 'Please close up, the convoy has split';
}

/** Amber banner while the convoy has a gap. */
export function SplitAlert({ split, onAnnounce }: { split: Split; onAnnounce: (text: string) => void }) {
  const road = roadNameAt(split.position);
  return (
    <Banner
      tone="warn"
      icon="split"
      title={road ? `Gap at ${road}` : `Gap of ${formatDistance(split.gapM)}`}
      body={road ? `${formatDistance(split.gapM)} · Lead car told to slow down` : 'Lead car told to slow down'}
      actionsInline
      actions={<OutlineAction title="Announce" onPress={() => onAnnounce(closeUpMessage(split))} />}
    />
  );
}

/** Amber banner when the lead car has gone quiet for over a minute. */
export function LeadSilentAlert({ silentForMs, nextCarLabel, onPromote }: { silentForMs: number; nextCarLabel?: string; onPromote?: () => void }) {
  const mins = Math.max(1, Math.floor(silentForMs / 60_000));
  return (
    <Banner
      tone="warn"
      icon="locationOff"
      title={`No signal from the lead car for ${mins} min`}
      body={nextCarLabel ? `Next in line: ${nextCarLabel}` : 'No other car to hand the lead to yet'}
      actions={onPromote ? <Button title="Make next car the lead" icon="lead" variant="white" size="sm" full onPress={onPromote} /> : undefined}
    />
  );
}

const styles = StyleSheet.create({
  outline: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontFamily: font.sans, fontSize: 14, color: colors.text },
});
