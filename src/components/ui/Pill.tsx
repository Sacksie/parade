import { StyleSheet, Text, View } from 'react-native';

import { tones, type Tone } from '@/components/ui/tones';
import { colors, font, radius } from '@/theme/tokens';

type PillProps = {
  label: React.ReactNode;
  tone?: Tone;
  /** Solid mint fill, used for "Live". */
  solid?: boolean;
  dot?: boolean;
  /** Render the label in Geist Mono (numbers). */
  mono?: boolean;
};

/** Small rounded label. `StatusPill` is the same thing with a leading dot by default. */
export function Pill({ label, tone = 'neutral', solid, dot, mono }: PillProps) {
  const t = tones[tone];
  const fg = solid ? colors.mintInk : t.fg;
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: solid ? colors.mint : t.bg, borderColor: solid ? colors.mint : t.border },
      ]}>
      {dot ? <View style={[styles.dot, { backgroundColor: solid ? colors.mintInk : tone === 'mint' ? colors.mint : fg }]} /> : null}
      <Text style={[styles.text, { color: fg, fontFamily: mono ? font.mono : font.sansSemi }]}>{label}</Text>
    </View>
  );
}

export function StatusPill(props: PillProps) {
  return <Pill dot {...props} />;
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, lineHeight: 16 },
});
