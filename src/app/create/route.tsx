import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWizard } from '@/components/create/wizard';
import { Icon } from '@/components/icons';
import { MapCanvas } from '@/components/map/MapCanvas';
import { PressableScale } from '@/components/PressableScale';
import { Button, IconButton, Mono, Segmented, StatRow, StatTile, go, showToast } from '@/components/ui';
import { formatDistance, formatDuration, uid } from '@/lib/format';
import { extendRouteLatLng, routeStats, snapLatLngToRoad } from '@/lib/geo';
import { setRoute, upsertStop, useMockRoute as applyDemoRoute } from '@/store/actions';
import { colors, font, radius, space, type } from '@/theme/tokens';
import type { LatLng } from '@/types';

/** C3 · Route editor. Tap to extend along the roads, drag any dot, undo. */
export default function CreateRoute() {
  const insets = useSafeAreaInsets();
  const { draft, editing, advance, back } = useWizard();
  // Route length before each tap, so Undo removes exactly the last appended segment.
  const [history, setHistory] = useState<number[]>([]);
  // Fit once, on arrival: re-fitting on every tap would make the map jump under your finger.
  const [initialFit] = useState<LatLng[] | undefined>(() => {
    if (!draft) return undefined;
    if (draft.route.length > 1) return draft.route;
    return draft.meetingPoint ? [draft.meetingPoint] : undefined;
  });

  if (!draft) return <View style={styles.root} />;

  const route = draft.route;
  const stats = routeStats(route, draft.stops);
  const drawn = route.length >= 2;

  const extend = (tap: LatLng) => {
    const base = route.length === 0 && draft.meetingPoint ? [draft.meetingPoint] : route;
    const next = extendRouteLatLng(base, tap);
    if (next.length === route.length) return;
    setHistory((h) => [...h, route.length]);
    setRoute(draft.id, next);
  };

  const dragPoint = (index: number, ll: LatLng) => {
    const next = route.slice();
    next[index] = snapLatLngToRoad(ll);
    setRoute(draft.id, next);
  };

  const undo = () => {
    if (route.length === 0) return;
    const prevLen = history.length > 0 ? history[history.length - 1] : route.length - 1;
    setHistory((h) => h.slice(0, -1));
    // Don't leave the meeting point alone on the map: that's not a route yet.
    const next = route.slice(0, Math.min(prevLen, route.length - 1));
    setRoute(draft.id, next.length === 1 ? [] : next);
  };

  const addStop = () => {
    const at = route[route.length - 1];
    if (!at) return;
    const id = uid('stop');
    upsertStop(draft.id, {
      id,
      name: `Stop ${draft.stops.length + 1}`,
      kind: 'stop',
      durationMin: 10,
      position: at,
      radiusM: 40,
      pauseMusic: true,
      arrivalMessage: '',
    });
    go('/create/stop', { stopId: id, isNew: 1 });
  };

  return (
    <View style={styles.root}>
      <MapCanvas
        style={StyleSheet.absoluteFill}
        fit={initialFit}
        fitPadding={60}
        zoom={1.6}
        route={route}
        routeStyle="draft"
        stops={draft.stops}
        stopLabels
        meetingPoint={draft.meetingPoint}
        onPressMap={extend}
        onDragRoutePoint={dragPoint}
      />

      <View style={[styles.top, { top: insets.top + 12 }]} pointerEvents="box-none">
        <View style={styles.headerRow} pointerEvents="box-none">
          <IconButton icon="back" size={46} accessibilityLabel="Back" onPress={() => back('/create/meet')} />
          <View style={styles.titleBox}>
            <Text style={styles.title}>Route</Text>
            <Text style={styles.stepText}>
              Step <Mono size="small" style={styles.stepText}>3</Mono> of 6
            </Text>
          </View>
          <IconButton icon="undo" size={46} accessibilityLabel="Undo last point" onPress={undo} disabled={route.length === 0} />
        </View>
        <View style={styles.subRow} pointerEvents="box-none">
          <View style={styles.chip} pointerEvents="none">
            <Icon name="route" size={15} color={colors.mintText} />
            <Text style={styles.chipText}>{route.length === 0 ? 'Tap the road to start from the meeting point' : 'Tap to extend · drag any dot to adjust'}</Text>
          </View>
          <IconButton icon="satellite" size={46} accessibilityLabel="Satellite view" onPress={() => showToast('Satellite view is coming later')} />
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) + 6 }]}>
        <Segmented
          height={42}
          accessibilityLabel="How to make the route"
          value="draw"
          onChange={(k) => {
            if (k === 'record') showToast('Recording a drive is coming next year');
          }}
          options={[
            { key: 'draw', label: 'Draw on map' },
            { key: 'record', label: 'Record a drive', dot: colors.dangerSolid },
          ]}
        />

        <StatRow>
          <StatTile value={formatDistance(stats.distanceM)} label="Distance" />
          <StatTile value={drawn ? `~${formatDuration(stats.totalS)}` : '–'} label="Incl. stops" />
          <StatTile value={stats.stops} label="Stops" />
        </StatRow>

        {draft.stops.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
            {draft.stops.map((s) => (
              <PressableScale
                key={s.id}
                pressedScale={0.96}
                onPress={() => go('/create/stop', { stopId: s.id })}
                accessibilityRole="button"
                accessibilityLabel={`Edit stop ${s.seq}, ${s.name}`}
                style={styles.pill}>
                <View style={styles.pillNo}>
                  <Text style={styles.pillNoText}>{s.seq}</Text>
                </View>
                <Text style={styles.pillText} numberOfLines={1}>
                  {s.name}
                </Text>
              </PressableScale>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.actions}>
          <Button title="Stop" icon="plus" variant="secondary" size="md" onPress={addStop} disabled={!drawn} style={styles.stopBtn} />
          <Button
            title={editing ? 'Save' : 'Check the route'}
            size="md"
            full
            disabled={!drawn}
            onPress={() => advance('/create/check')}
            style={styles.primary}
          />
        </View>
        {!drawn ? <Text style={styles.hint}>Draw at least two points to check the route or add stops.</Text> : null}

        <PressableScale
          pressedScale={0.97}
          onPress={() => {
            applyDemoRoute(draft.id);
            setHistory([]);
          }}
          accessibilityRole="button"
          style={styles.dev}>
          <Text style={styles.devText}>Use the demo route</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mapBg },
  top: { position: 'absolute', left: 12, right: 12, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontFamily: font.sansSemi, fontSize: 16, color: colors.text },
  stepText: { ...type.caption, color: colors.textFaint },
  subRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  chip: {
    flexShrink: 1,
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
  chipText: { ...type.caption, color: colors.textMuted, flexShrink: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
    gap: 14,
    backgroundColor: colors.sheet,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  pills: { gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    maxWidth: 220,
  },
  pillNo: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  pillNoText: { fontFamily: font.monoSemi, fontSize: 13, color: colors.onyx },
  pillText: { fontFamily: font.sans, fontSize: 14, color: colors.text, flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  stopBtn: { height: 56, borderRadius: radius.button },
  primary: { height: 56, borderRadius: radius.button },
  hint: { ...type.caption, marginTop: -6 },
  dev: { alignSelf: 'center', minHeight: 32, justifyContent: 'center', paddingHorizontal: 12 },
  devText: { ...type.caption, fontSize: 12, color: colors.textFaint, opacity: 0.6 },
});
