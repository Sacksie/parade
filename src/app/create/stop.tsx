import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWizard } from '@/components/create/wizard';
import { MapCanvas } from '@/components/map/MapCanvas';
import { Button, EmptyState, Eyebrow, Header, IconButton, Mono, Screen, Segmented, Stepper, TextField, Toggle, goBackOr } from '@/components/ui';
import { projectOnRoute } from '@/lib/geo';
import { removeStop, upsertStop } from '@/store/actions';
import { colors, font, radius, space, type } from '@/theme/tokens';
import type { LatLng, Stop, StopKind } from '@/types';

const MIN = 1;
const MAX = 60;
const inc = (v: number) => Math.min(MAX, v < 10 ? v + 1 : v + 5);
const dec = (v: number) => Math.max(MIN, v <= 10 ? v - 1 : v - 5);

/** C5 · Stop. Edits a local copy; nothing is saved until "Save stop". */
export default function CreateStop() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { stopId, isNew } = useLocalSearchParams<{ stopId?: string; isNew?: string }>();
  const { draft } = useWizard();
  const original = draft?.stops.find((s) => s.id === stopId);
  const [stop, setStop] = useState<Stop | undefined>(original);
  // Centre on the stop once; dragging the pin shouldn't move the camera.
  const [initialFit] = useState<LatLng[] | undefined>(() => (original ? [original.position] : undefined));

  const leave = () => goBackOr('/create/route');

  if (!draft || !stop) {
    return (
      <Screen>
        <Header left="back" onLeft={leave} />
        <View style={styles.empty}>
          <EmptyState title="Stop not found" body="It may have been deleted." />
        </View>
      </Screen>
    );
  }

  const patch = (p: Partial<Stop>) => setStop({ ...stop, ...p });

  // Stops live on the line: snap the dragged pin to the nearest point on the route.
  const moveTo = (ll: LatLng) => patch({ position: draft.route.length > 1 ? projectOnRoute(draft.route, ll).point : ll });

  const cancel = () => {
    // A stop added from the route editor and never saved shouldn't linger.
    if (isNew === '1') removeStop(draft.id, stop.id);
    leave();
  };

  const saveStop = () => {
    upsertStop(draft.id, { ...stop, name: stop.name.trim() || `Stop ${stop.seq}` });
    leave();
  };

  const confirmDelete = () => {
    const doDelete = () => {
      removeStop(draft.id, stop.id);
      leave();
    };
    const title = `Delete stop ${stop.seq}?`;
    const body = 'Cars will drive straight past this spot.';
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n${body}`)) doDelete();
    } else {
      Alert.alert(title, body, [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const setKind = (kind: StopKind) =>
    patch(kind === 'drive_past' ? { kind, durationMin: 0, pauseMusic: false } : { kind, durationMin: stop.durationMin || 10, pauseMusic: true });

  return (
    <View style={styles.root}>
      <MapCanvas
        style={StyleSheet.absoluteFill}
        fit={initialFit}
        zoom={2.8}
        route={draft.route}
        routeStyle="draft"
        stops={draft.stops.map((s) => (s.id === stop.id ? stop : s))}
        showStopRadius
        pin={stop.position}
        onPinChange={moveTo}
      />

      <View style={[styles.capWrap, { top: insets.top + 12 }]} pointerEvents="none">
        <View style={styles.cap}>
          <View style={styles.dashed} />
          <Text style={styles.capText}>Starts when the lead car enters the circle</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.sheetWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined} pointerEvents="box-none">
        <View style={[styles.sheet, { maxHeight: height * 0.72, paddingBottom: Math.max(insets.bottom, space.lg) + 6 }]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.form} style={styles.scroll}>
            <View style={styles.titleRow}>
              <Text accessibilityRole="header" style={styles.title}>
                Stop <Mono style={styles.titleNo}>{stop.seq}</Mono>
              </Text>
              <IconButton icon="trash" variant="ghost" accessibilityLabel="Delete this stop" onPress={confirmDelete} style={styles.trash} />
            </View>

            <TextField label="Name" value={stop.name} onChangeText={(name) => patch({ name })} placeholder="Menorah lighting" style={styles.nameInput} />

            <View style={styles.kindRow}>
              <View style={styles.flex}>
                <Text style={styles.label}>Cars</Text>
                <Segmented<StopKind>
                  accessibilityLabel="Cars"
                  value={stop.kind}
                  onChange={setKind}
                  options={[
                    { key: 'stop', label: 'Stop' },
                    { key: 'drive_past', label: 'Drive past' },
                  ]}
                />
              </View>
              {stop.kind === 'stop' ? (
                <Stepper
                  label="For"
                  value={stop.durationMin}
                  format={(v) => `${v} min`}
                  onDec={() => patch({ durationMin: dec(stop.durationMin) })}
                  onInc={() => patch({ durationMin: inc(stop.durationMin) })}
                  decDisabled={stop.durationMin <= MIN}
                  incDisabled={stop.durationMin >= MAX}
                />
              ) : null}
            </View>

            <View style={styles.arrive}>
              <Eyebrow>When the lead car arrives</Eyebrow>
              {stop.kind === 'stop' ? (
                <Toggle label="Pause the music" value={stop.pauseMusic} onChange={(pauseMusic) => patch({ pauseMusic })} />
              ) : null}
              <TextField
                label="Read this out to every car"
                multiline
                rows={3}
                value={stop.arrivalMessage}
                onChangeText={(arrivalMessage) => patch({ arrivalMessage })}
                placeholder={stop.kind === 'stop' ? 'Pull in behind the car in front and turn your engine off.' : 'Slow right down and wave.'}
                style={styles.say}
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" size="md" onPress={cancel} style={styles.cancel} />
            <Button title="Save stop" size="md" full onPress={saveStop} style={styles.save} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mapBg },
  flex: { flex: 1, gap: 8 },
  empty: { flex: 1, justifyContent: 'center' },
  capWrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center' },
  cap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dashed: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.mint },
  capText: { ...type.caption, color: colors.textMuted },
  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, justifyContent: 'flex-end' },
  sheet: {
    paddingTop: 10,
    paddingHorizontal: space.xl,
    gap: space.lg,
    backgroundColor: colors.sheet,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong },
  scroll: { flexGrow: 0, flexShrink: 1 },
  form: { gap: space.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.sansBold, fontSize: 24, letterSpacing: -0.5, color: colors.text },
  titleNo: { fontFamily: font.monoSemi, fontSize: 24, lineHeight: 30 },
  trash: { borderColor: colors.border },
  nameInput: { backgroundColor: 'transparent' },
  kindRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  label: { ...type.label },
  arrive: { gap: 10, padding: 14, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  say: { fontSize: 15 },
  actions: { flexDirection: 'row', gap: 10 },
  cancel: { height: 56, borderRadius: radius.button, backgroundColor: 'transparent' },
  save: { height: 56, borderRadius: radius.button },
});
