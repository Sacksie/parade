import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, IconButton, select, showToast } from '@/components/ui';
import { formatAgo } from '@/lib/format';
import { colors, font } from '@/theme/tokens';
import type { Announcement } from '@/types';

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSend: (text: string) => void;
  /** Newest last, as stored. */
  announcements: Announcement[];
  now: number;
  nextStopName?: string;
};

function presets(nextStopName?: string) {
  return [
    { label: 'Slow down', text: 'Please slow down and keep together.' },
    { label: 'Stop in 2 min', text: nextStopName ? `We stop at ${nextStopName} in 2 minutes.` : 'We stop in 2 minutes.' },
    { label: 'Close up', text: 'Please close up and keep a short gap to the car in front.' },
    { label: 'Final stretch', text: "We're on the final stretch. Thank you for keeping together." },
    { label: 'Thank you', text: 'Thank you for joining the parade tonight. Drive home safely.' },
  ];
}

/** Preset pills, the last few announcements, then the field: pinned to the bottom of L6. */
export function Composer({ value, onChange, onSend, announcements, now, nextStopName }: Props) {
  const [focused, setFocused] = useState(false);
  const recent = announcements.slice(-3);
  const canSend = value.trim().length > 0;

  return (
    <View style={styles.wrap}>
      {recent.length > 0 ? (
        <View style={styles.recent}>
          {recent.map((a) => (
            <Text key={a.id} style={styles.recentRow} numberOfLines={1}>
              <Text style={styles.mono}>{formatAgo(a.createdAt, now)}</Text> · {a.text}
            </Text>
          ))}
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.pills}>
        {presets(nextStopName).map((p) => (
          <Button
            key={p.label}
            title={p.label}
            variant="secondary"
            size="pill"
            accessibilityLabel={`Use preset: ${p.label}`}
            onPress={() => {
              select();
              onChange(p.text);
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Say something to every car…"
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.mint}
          cursorColor={colors.mint}
          accessibilityLabel="Announcement to every car"
          returnKeyType="send"
          onSubmitEditing={() => canSend && onSend(value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, focused && { borderColor: colors.mint }, { outlineStyle: 'none' } as object]}
        />
        <IconButton
          icon="mic"
          size={50}
          accessibilityLabel="Speak an announcement"
          onPress={() => showToast('Dictation needs the native build')}
        />
        <IconButton icon="send" size={50} variant="primary" disabled={!canSend} accessibilityLabel="Send announcement" onPress={() => onSend(value)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  recent: { gap: 2, paddingHorizontal: 4 },
  recentRow: { fontFamily: font.sans, fontSize: 12, lineHeight: 16, color: colors.textFaint },
  mono: { fontFamily: font.mono, fontVariant: ['tabular-nums'] },
  pills: { gap: 6 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    height: 50,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    color: colors.text,
    fontFamily: font.sansRegular,
    fontSize: 15,
  },
});
