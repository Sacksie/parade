import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarSheet } from '@/components/CalendarSheet';
import { CalendarIcon, CloseIcon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { TimeWheel, toMinutes, type Time } from '@/components/WheelPicker';
import { formatLongDate } from '@/lib/dates';
import { colors, radius, space, type } from '@/theme/tokens';

const STEPS = 6;

export default function CreateParadeBasics() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [hostedBy, setHostedBy] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [arrive, setArrive] = useState<Time>({ h: 17, m: 15 });
  const [setsOff, setSetsOff] = useState<Time>({ h: 17, m: 45 });

  const timesInvalid = toMinutes(setsOff) <= toMinutes(arrive);
  const canContinue = name.trim().length > 0 && date != null && !timesInvalid;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.topBar}>
        <PressableScale
          pressedScale={0.9}
          onPress={() => router.back()}
          style={styles.close}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <CloseIcon />
        </PressableScale>
        <Text style={styles.draft}>Saved as draft</Text>
      </View>

      <View style={styles.progress}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} style={[styles.segment, i === 0 && { backgroundColor: colors.mint }]} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.step}>Step 1 of {STEPS}</Text>
          <Text style={[type.display, { marginBottom: space.sm }]}>The basics</Text>

          <Field label="Parade name">
            <Input value={name} onChangeText={setName} placeholder="e.g. Chanukah Car Parade" returnKeyType="next" />
          </Field>

          <Field label="Hosted by" optional>
            <Input value={hostedBy} onChangeText={setHostedBy} placeholder="Your community, club or school" />
          </Field>

          <Field label="Date">
            <PressableScale
              pressedScale={0.98}
              onPress={() => setCalendarOpen(true)}
              style={[styles.input, styles.dateField, calendarOpen && styles.inputFocused]}
              accessibilityRole="button"
              accessibilityLabel={date ? `Date, ${formatLongDate(date)}` : 'Choose a date'}>
              <Text style={[styles.inputText, !date && { color: colors.textFaint }]}>
                {date ? formatLongDate(date) : 'Choose a date'}
              </Text>
              <CalendarIcon color={date ? colors.indigoBright : colors.textMuted} />
            </PressableScale>
          </Field>

          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Arrive from</Text>
              <TimeWheel label="Arrive from" value={arrive} onChange={setArrive} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Sets off</Text>
              <TimeWheel label="Sets off" value={setsOff} onChange={setSetsOff} invalid={timesInvalid} />
            </View>
          </View>
          <Text style={[styles.hint, timesInvalid && { color: colors.danger }]}>
            {timesInvalid ? 'Sets off needs to be after cars arrive.' : 'Finish time is worked out from the route.'}
          </Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <PressableScale
            disabled={!canContinue}
            // TODO: push step 2 (route) once it exists.
            onPress={() => {}}
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}>
            <Text style={[styles.ctaText, !canContinue && { color: colors.textFaint }]}>Continue</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>

      <CalendarSheet
        open={calendarOpen}
        value={date}
        onClose={() => setCalendarOpen(false)}
        onConfirm={(d) => {
          setDate(d);
          setCalendarOpen(false);
        }}
      />
    </View>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={styles.label}>
        {label}
        {optional && <Text style={styles.optional}> · optional</Text>}
      </Text>
      {children}
    </View>
  );
}

function Input(props: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textFaint}
      selectionColor={colors.mint}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[styles.input, styles.inputText, focused && styles.inputFocused]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.onyx },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    height: 48,
  },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  draft: { ...type.caption, color: colors.textMuted },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: space.xl, marginTop: space.sm },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },

  form: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.xxl, gap: space.lg },
  step: { ...type.caption, marginBottom: -space.sm },
  label: { ...type.label, marginBottom: space.sm },
  optional: { color: colors.textFaint, fontWeight: '500' },

  input: {
    height: 58,
    paddingHorizontal: space.lg + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputText: { ...type.body },
  inputFocused: { borderColor: colors.indigoBright, backgroundColor: colors.surfaceRaised },
  dateField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  timeRow: { flexDirection: 'row', gap: space.md },
  hint: { ...type.caption, marginTop: -space.xs },

  footer: { paddingHorizontal: space.xl, paddingTop: space.md },
  cta: {
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  ctaText: { fontSize: 18, fontWeight: '700', color: colors.mintInk },
});
