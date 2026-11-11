import { StyleSheet, Text, View } from 'react-native';

import { IconButton, tap } from '@/components/ui';
import { colors, font, radius } from '@/theme/tokens';

type Props = {
  title: string | undefined;
  index: number;
  total: number;
  inSync: number;
  cars: number;
  paused: boolean;
  /** "stop 1 in 2 min", shown after the sync count. */
  next?: { label: string; value: string };
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
};

/** Now playing for every car, with shared play/pause and skip. */
export function MusicCard({ title, index, total, inSync, cars, paused, next, onToggle, onPrev, onNext }: Props) {
  if (total === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.text}>
          <Text style={styles.title}>No music</Text>
          <Text style={styles.meta}>This parade has no playlist.</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {paused ? `Paused · ${title}` : title}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          <Text style={styles.mono}>{index + 1}</Text>/{total} · <Text style={[styles.mono, { color: colors.mintText }]}>{`${inSync}/${cars}`}</Text> in sync
          {next ? (
            <>
              {` · ${next.label} `}
              <Text style={styles.mono}>{next.value}</Text>
            </>
          ) : null}
        </Text>
      </View>
      <IconButton
        icon="previous"
        accessibilityLabel="Previous track in every car"
        onPress={() => {
          tap();
          onPrev();
        }}
      />
      <IconButton
        icon={paused ? 'play' : 'pause'}
        variant="white"
        accessibilityLabel={paused ? 'Play music in every car' : 'Pause music in every car'}
        onPress={() => {
          tap();
          onToggle();
        }}
      />
      <IconButton
        icon="next"
        accessibilityLabel="Next track in every car"
        onPress={() => {
          tap();
          onNext();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: font.sansSemi, fontSize: 15, lineHeight: 20, color: colors.text },
  meta: { fontFamily: font.sans, fontSize: 13, lineHeight: 17, color: colors.textMuted },
  mono: { fontFamily: font.mono, fontVariant: ['tabular-nums'], color: colors.text },
});
