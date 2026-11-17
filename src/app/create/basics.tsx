import { useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import { CalendarSheet } from '@/components/CalendarSheet';
import { RadioList } from '@/components/create/RadioList';
import { WizardHeader, exitWizard, useWizard } from '@/components/create/wizard';
import { Icon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { TimePanel } from '@/components/TimePanel';
import { Button, Screen, TextField } from '@/components/ui';
import { toMinutes, type Time } from '@/components/WheelPicker';
import { formatLongDate, formatTime, parseISODate } from '@/lib/dates';
import { toISODate } from '@/lib/format';
import { discardDraft } from '@/store/actions';
import { colors, font, radius, space, type } from '@/theme/tokens';
import type { JoinMode, Parade } from '@/types';

type TimeKey = 'arrive' | 'setsOff' | 'finish';
type Picker = 'date' | TimeKey | null;

const TIME_TITLES: Record<TimeKey, string> = { arrive: 'Arrive from', setsOff: 'Sets off', finish: 'Finishes' };
const TIME_FIELD: Record<TimeKey, 'arriveAt' | 'setsOffAt' | 'finishAt'> = { arrive: 'arriveAt', setsOff: 'setsOffAt', finish: 'finishAt' };

const parseTime = (hhmm: string | undefined, fallback: Time): Time => {
  if (!hhmm) return fallback;
  const [h, m] = hhmm.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? { h, m } : fallback;
};

const addMinutes = (t: Time, mins: number): Time => {
  const total = Math.min(toMinutes(t) + mins, 23 * 60 + 55);
  return { h: Math.floor(total / 60), m: total % 60 };
};

/** C1 · The basics. Every change is written to the draft straight away. */
export default function CreateBasics() {
  const { draft, editing, save, saving, advance, primaryLabel } = useWizard();

  // Only one picker open at a time; opening one drops the keyboard so a field can't stay highlighted.
  const [picker, setPicker] = useState<Picker>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);

  if (!draft) return <Screen>{null}</Screen>;

  const date = parseISODate(draft.date);
  const arrive = parseTime(draft.arriveAt, { h: 17, m: 15 });
  const setsOff = parseTime(draft.setsOffAt, { h: 17, m: 45 });
  const finish = draft.finishAt ? parseTime(draft.finishAt, addMinutes(setsOff, 60)) : null;

  const setTime = (k: TimeKey, t: Time | null) => save({ [TIME_FIELD[k]]: t ? formatTime(t) : undefined } as Partial<Parade>);

  const openPicker = (p: Exclude<Picker, null>) => {
    Keyboard.dismiss();
    setPicker(p);
  };
  const closePicker = () => setPicker(null);
  // Time boxes toggle: tap to expand the wheel, tap the same box again to collapse.
  const toggleTime = (p: TimeKey) => {
    Keyboard.dismiss();
    if (picker === p) return setPicker(null);
    // Finish is optional: first open suggests an hour after setting off.
    if (p === 'finish' && finish == null) setTime('finish', addMinutes(setsOff, 60));
    setPicker(p);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };
  const editingTime: TimeKey | null = picker === 'date' ? null : picker;
  const timeValue: Record<TimeKey, Time> = { arrive, setsOff, finish: finish ?? addMinutes(setsOff, 60) };

  const setsOffInvalid = toMinutes(setsOff) <= toMinutes(arrive);
  const finishInvalid = finish != null && toMinutes(finish) <= toMinutes(setsOff);
  const timeError = setsOffInvalid
    ? 'Sets off needs to be after cars arrive.'
    : finishInvalid
      ? 'Finish needs to be after the parade sets off.'
      : null;
  const canContinue = draft.name.trim().length > 0 && !timeError;

  const close = () => {
    // Nothing worth keeping: drop the draft so Home doesn't fill up with empty ones.
    const empty = !editing && draft.name.trim() === '' && draft.route.length === 0;
    const id = draft.id;
    exitWizard(id, editing);
    if (empty) setTimeout(() => discardDraft(id), 350);
  };

  const status = saving ? 'Saving…' : editing ? 'Changes saved' : 'Saved as draft';

  return (
    <View style={styles.root}>
      <Screen
        keyboard
        footer={
          <Button
            title={primaryLabel}
            disabled={!canContinue}
            onPress={() => {
              closePicker();
              advance('/create/meet');
            }}
          />
        }>
        <WizardHeader
          step={1}
          title="The basics"
          left="close"
          onLeft={close}
          right={
            <Text accessibilityLiveRegion="polite" style={styles.saved}>
              {status}
            </Text>
          }
        />

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <TextField
            label="Parade name"
            value={draft.name}
            onChangeText={(name) => save({ name })}
            placeholder="Car Parade"
            returnKeyType="next"
            onFocus={closePicker}
          />

          <TextField
            label="Hosted by"
            optional
            value={draft.host ?? ''}
            onChangeText={(host) => save({ host: host || undefined })}
            placeholder="Your community, club or school"
            onFocus={closePicker}
          />

          <Field label="Date">
            <PickerField active={picker === 'date'} onPress={() => openPicker('date')} accessibilityLabel={`Date, ${formatLongDate(date)}`}>
              <Text style={styles.inputText}>{formatLongDate(date)}</Text>
              <Icon name="calendar" size={22} color={colors.indigoBright} />
            </PickerField>
          </Field>

          <View style={styles.timeRow}>
            <View style={styles.flex}>
              <Field label="Arrive from">
                <PickerField active={picker === 'arrive'} compact onPress={() => toggleTime('arrive')} accessibilityLabel={`Arrive from, ${formatTime(arrive)}`}>
                  <Text style={styles.timeText}>{formatTime(arrive)}</Text>
                </PickerField>
              </Field>
            </View>
            <View style={styles.flex}>
              <Field label="Sets off">
                <PickerField
                  active={picker === 'setsOff'}
                  compact
                  invalid={setsOffInvalid}
                  onPress={() => toggleTime('setsOff')}
                  accessibilityLabel={`Sets off, ${formatTime(setsOff)}`}>
                  <Text style={styles.timeText}>{formatTime(setsOff)}</Text>
                </PickerField>
              </Field>
            </View>
            <View style={styles.flex}>
              <Field label="Finishes">
                <PickerField
                  active={picker === 'finish'}
                  compact
                  invalid={finishInvalid}
                  onPress={() => toggleTime('finish')}
                  accessibilityLabel={finish ? `Finishes, ${formatTime(finish)}` : 'Finish time, optional'}>
                  <Text style={[styles.timeText, !finish && styles.timeEmpty]}>{finish ? formatTime(finish) : 'Optional'}</Text>
                </PickerField>
              </Field>
            </View>
          </View>
          <TimePanel
            title={editingTime ? TIME_TITLES[editingTime] : null}
            value={timeValue[editingTime ?? 'arrive']}
            onChange={(t) => editingTime && setTime(editingTime, t)}
            onDone={closePicker}
            onClear={
              editingTime === 'finish'
                ? () => {
                    setTime('finish', null);
                    closePicker();
                  }
                : undefined
            }
          />
          {timeError ? (
            <Text accessibilityRole="alert" style={[styles.hint, { color: colors.danger }]}>
              {timeError}
            </Text>
          ) : !finish ? (
            <Text style={styles.hint}>Leave the finish empty and we&apos;ll work it out from the route.</Text>
          ) : null}

          <RadioList<JoinMode>
            label="Who can join"
            value={draft.joinMode}
            onChange={(joinMode) => save({ joinMode })}
            options={[
              { key: 'link', label: 'Anyone with the link', detail: 'Best for open community events' },
              { key: 'approve', label: 'I approve each car', detail: "You'll see requests before the day" },
            ]}
          />
        </ScrollView>
      </Screen>

      {/* Sheet renders last so it covers the whole screen, footer included. */}
      <CalendarSheet
        open={picker === 'date'}
        value={date}
        onClose={closePicker}
        onConfirm={(d) => {
          save({ date: toISODate(d) });
          closePicker();
        }}
      />
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function PickerField({
  active,
  invalid,
  compact,
  onPress,
  accessibilityLabel,
  children,
}: {
  active: boolean;
  invalid?: boolean;
  /** Narrow time boxes: centred content, less side padding. */
  compact?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}) {
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: active }}
      style={[styles.input, styles.pickerField, compact && styles.compactField, active && styles.inputFocused, invalid && !active && { borderColor: colors.dangerSolid }]}>
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onyx },
  flex: { flex: 1 },
  saved: { ...type.caption, color: colors.textFaint, paddingRight: 8 },
  scroll: { flex: 1, marginHorizontal: -space.xl, marginTop: space.sm },
  form: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.xxl, gap: 18 },
  field: { gap: space.sm },
  label: { ...type.label, color: colors.textMuted },
  input: {
    height: 54,
    paddingHorizontal: 16,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputText: { fontFamily: font.sansRegular, fontSize: 17, color: colors.text },
  inputFocused: { borderColor: colors.mint },
  compactField: { paddingHorizontal: space.sm, justifyContent: 'center' },
  pickerField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeEmpty: { fontFamily: font.sans, fontSize: 15, color: colors.textFaint },
  timeText: { fontFamily: font.monoSemi, fontSize: 18, color: colors.text, fontVariant: ['tabular-nums'] },
  timeRow: { flexDirection: 'row', gap: space.sm },
  hint: { ...type.caption, marginTop: -space.xs },
});
