import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { WizardHeader, useWizard } from '@/components/create/wizard';
import { formatLatLng } from '@/components/create/format';
import { Icon } from '@/components/icons';
import { MapCanvas } from '@/components/map/MapCanvas';
import { PressableScale } from '@/components/PressableScale';
import { Button, Mono, Screen, Segmented, TextField, showToast } from '@/components/ui';
import { MOCK_PLACES, roadNameAt } from '@/data/mockTown';
import { colors, font, radius, type } from '@/theme/tokens';
import type { LatLng } from '@/types';

type Place = (typeof MOCK_PLACES)[number];

/** C2 · Meeting point. Search, then drag the pin onto the exact entrance. */
export default function CreateMeet() {
  const { draft, save, advance, back, primaryLabel } = useWizard();
  const [query, setQuery] = useState(draft?.meetingName ?? '');
  const [searching, setSearching] = useState(false);
  // Map re-centres only when a search result is picked, not while the pin is dragged.
  const [focus, setFocus] = useState<LatLng | undefined>(draft?.meetingPoint);

  if (!draft) return <Screen>{null}</Screen>;

  const q = query.trim().toLowerCase();
  const results = searching && q.length > 0 ? MOCK_PLACES.filter((p) => `${p.name} ${p.detail}`.toLowerCase().includes(q)) : [];
  const showResults = searching && q.length > 0 && query !== draft.meetingName;

  const pick = (p: Place) => {
    const meetingName = `${p.name}, ${p.detail}`;
    save({ meetingPoint: p.position, meetingName });
    setQuery(meetingName);
    setFocus(p.position);
    setSearching(false);
  };

  const movePin = (ll: LatLng) => {
    // A pin dropped without a search still needs a name drivers can read.
    if (!draft.meetingName) {
      const road = roadNameAt(ll);
      const meetingName = road ? `Meeting point, ${road}` : 'Meeting point';
      setQuery(meetingName);
      save({ meetingPoint: ll, meetingName });
    } else {
      save({ meetingPoint: ll });
    }
  };

  return (
    <Screen
      keyboard
      footer={
        <Button title={primaryLabel} disabled={!draft.meetingPoint} onPress={() => advance('/create/route')} />
      }>
      <WizardHeader step={2} title="Meeting point" onLeft={() => back('/create/basics')} />

      <View style={styles.search}>
        <TextField
          accessibilityLabel="Search for the meeting point"
          leftIcon="search"
          value={query}
          placeholder="Search an address or place"
          onChangeText={(t) => {
            setQuery(t);
            setSearching(true);
          }}
          onFocus={() => setSearching(true)}
          onBlur={() => setTimeout(() => setSearching(false), 150)}
          returnKeyType="search"
          onSubmitEditing={() => results[0] && pick(results[0])}
          autoCorrect={false}
        />
        {showResults ? (
          <View style={styles.results} accessibilityRole="list">
            {results.length === 0 ? (
              <Text style={styles.noResults}>No places match. Try &ldquo;Town Hall&rdquo;, or drop the pin on the map.</Text>
            ) : (
              results.map((p, i) => (
                <PressableScale
                  key={p.name}
                  pressedScale={0.99}
                  onPress={() => pick(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.name}, ${p.detail}`}
                  style={[styles.result, i < results.length - 1 && styles.divided]}>
                  <Icon name="pin" size={18} color={colors.textFaint} />
                  <View style={styles.flex}>
                    <Text style={styles.resultName}>{p.name}</Text>
                    <Text style={styles.resultDetail}>{p.detail}</Text>
                  </View>
                </PressableScale>
              ))
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.mapWrap}>
        <MapCanvas
          style={StyleSheet.absoluteFill}
          fit={focus ? [focus] : undefined}
          zoom={2.6}
          pin={draft.meetingPoint}
          onPinChange={movePin}
          onPressMap={movePin}
        />
        <View style={styles.style}>
          <Segmented
            height={42}
            accessibilityLabel="Map style"
            value="map"
            onChange={(k) => {
              if (k === 'satellite') showToast('Satellite view is coming later');
            }}
            options={[
              { key: 'map', label: 'Map' },
              { key: 'satellite', label: 'Satellite' },
            ]}
          />
        </View>
        <View style={styles.chip} pointerEvents="none">
          <Icon name="pin" size={15} color={colors.mintText} />
          <Text style={styles.chipText}>{draft.meetingPoint ? 'Drag the pin onto the exact entrance' : 'Search, or tap the map to drop the pin'}</Text>
        </View>
      </View>

      {draft.meetingPoint ? (
        <Text style={styles.caption}>
          Pin set at <Mono size="small" style={styles.coords}>{formatLatLng(draft.meetingPoint)}</Mono> · the route starts here
        </Text>
      ) : (
        <Text style={styles.caption}>No pin yet. Cars will be sent here to line up.</Text>
      )}

      <TextField
        label="Directions for drivers"
        optional
        multiline
        rows={3}
        value={draft.meetingNotes ?? ''}
        onChangeText={(t) => save({ meetingNotes: t || undefined })}
        placeholder="Which entrance to use, where to line up"
        style={styles.notes}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  search: { zIndex: 2 },
  results: {
    marginTop: 6,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 16 },
  divided: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  resultName: { fontFamily: font.sans, fontSize: 15, color: colors.text },
  resultDetail: { ...type.caption },
  noResults: { ...type.caption, padding: 16 },
  mapWrap: {
    flex: 1,
    minHeight: 200,
    maxHeight: 300,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.mapBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  style: { position: 'absolute', top: 10, right: 10, width: 176 },
  chip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
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
  chipText: { ...type.caption, color: colors.textMuted },
  caption: { ...type.caption, marginTop: -6 },
  coords: { color: colors.textMuted },
  notes: { fontSize: 15 },
});
