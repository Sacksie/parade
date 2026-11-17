import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { MapCanvas, MapCanvasStatic, type MapCar } from '@/components/map/MapCanvas';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/ui';
import { getState } from '@/store/store';
import { colors, font, radius } from '@/theme/tokens';
import type { LatLng, Stop } from '@/types';

export type ConvoyMapData = {
  route: LatLng[];
  stops: Stop[];
  cars: MapCar[];
  progressM: number;
  split?: { position: LatLng; fromM?: number; toM?: number };
  leadLabel: string;
  hasTail: boolean;
};

const REFIT_MS = 10_000;

/** Route plus every car's position, read straight from the store so it can be sampled on a timer. */
function convoyPoints(paradeId: string): LatLng[] {
  const s = getState();
  const route = s.parades[paradeId]?.route ?? [];
  const positions = Object.values(s.live[paradeId]?.positions ?? {}).map((p) => p.position);
  return [...route, ...positions];
}

/**
 * Fit points that only change every 10 s (or on demand), so the camera doesn't
 * twitch every time the convoy moves a metre.
 */
export function useConvoyFit(paradeId: string, enabled = true) {
  const [fit, setFit] = useState<LatLng[]>(() => convoyPoints(paradeId));
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setFit(convoyPoints(paradeId)), REFIT_MS);
    return () => clearInterval(t);
  }, [paradeId, enabled]);
  return { fit, refit: () => setFit(convoyPoints(paradeId)) };
}

function Legend({ leadLabel, hasTail }: { leadLabel: string; hasTail: boolean }) {
  return (
    <View pointerEvents="none" style={styles.legend}>
      <View style={styles.chip}>
        <View style={[styles.swatch, { backgroundColor: colors.white, borderColor: colors.mint }]} />
        <Text style={styles.chipText} numberOfLines={1}>
          {leadLabel}
        </Text>
      </View>
      {hasTail ? (
        <View style={styles.chip}>
          <View style={[styles.swatch, { borderColor: colors.indigoBright }]} />
          <Text style={styles.chipText}>Tail</Text>
        </View>
      ) : null}
    </View>
  );
}

/** L6 convoy overview: 196 high, tap to open the full-screen map. */
export function ConvoyMap({ paradeId, data, onExpand }: { paradeId: string; data: ConvoyMapData; onExpand: () => void }) {
  const { fit } = useConvoyFit(paradeId);
  return (
    <Pressable onPress={onExpand} accessibilityRole="button" accessibilityLabel="Convoy map. Open full screen" style={styles.box}>
      <MapCanvasStatic
        style={StyleSheet.absoluteFill}
        fit={fit}
        fitPadding={18}
        route={data.route}
        routeStyle="live"
        progressM={data.progressM}
        stops={data.stops}
        cars={data.cars}
        split={data.split}>
        <Legend leadLabel={data.leadLabel} hasTail={data.hasTail} />
      </MapCanvasStatic>
    </Pressable>
  );
}

/** Full-screen version the organiser can pan and pinch. Render it last in the screen. */
export function ConvoyMapSheet({ paradeId, data, open, onClose }: { paradeId: string; data: ConvoyMapData; open: boolean; onClose: () => void }) {
  const { height } = useWindowDimensions();
  // Fit once when opened and on Recentre; never on a timer, or it would undo the organiser's pan.
  const { fit, refit } = useConvoyFit(paradeId, false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) refit();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Convoy"
      height={Math.round(height * 0.88)}
      footer={
        <View style={styles.sheetFooter}>
          <Button title="Recentre" icon="location" variant="secondary" size="md" full onPress={refit} />
          <Button title="Done" variant="white" size="md" full onPress={onClose} />
        </View>
      }>
      <View style={styles.bigWrap}>
        {open ? (
          <MapCanvas
            style={StyleSheet.absoluteFill}
            interactive
            fit={fit}
            fitPadding={28}
            route={data.route}
            routeStyle="live"
            progressM={data.progressM}
            stops={data.stops}
            stopLabels
            cars={data.cars}
            split={data.split}>
            <Legend leadLabel={data.leadLabel} hasTail={data.hasTail} />
          </MapCanvas>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 196,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.mapBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bigWrap: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.mapBg, borderWidth: 1, borderColor: colors.border },
  legend: { position: 'absolute', left: 10, bottom: 10, right: 10, flexDirection: 'row', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 1,
  },
  swatch: { width: 8, height: 8, borderRadius: 4, borderWidth: 2 },
  chipText: { fontFamily: font.sans, fontSize: 12, lineHeight: 15, color: colors.textMuted, flexShrink: 1 },
  sheetFooter: { flexDirection: 'row', gap: 10 },
});
