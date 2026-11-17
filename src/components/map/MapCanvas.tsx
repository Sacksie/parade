import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures, useTapGesture } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { SvgXml } from 'react-native-svg';

import type { Px } from '@/data/mockTown';
import { routeLengthM, sliceRoute } from '@/lib/geo';
import { colors } from '@/theme/tokens';
import type { LatLng, Stop } from '@/types';

import { BASEMAP_XML } from './basemap';
import {
  DEFAULT_ZOOM,
  clampCamera,
  fitCamera,
  fromWorld,
  panBy,
  pointsKey,
  sceneViewBox,
  screenToWorld,
  toWorld,
  worldToScreen,
  zoomAround,
  type Camera,
  type Size,
} from './camera';
import { MapOverlays, type OverlayCar } from './MapOverlays';
import { useCameraState, useGlide } from './useGlide';

export type MapCar = { id: string; position: LatLng; role: 'car' | 'lead' | 'tail'; isMe?: boolean; alert?: boolean };

export type MapCanvasProps = {
  style?: StyleProp<ViewStyle>;
  /** Initial camera. If `fit` is given it wins. */
  center?: LatLng;
  /** Screen px per basemap px (0.3 … 4). Default 1.4. */
  zoom?: number;
  /** Fit these points in view on mount and whenever their values change. */
  fit?: LatLng[];
  fitPadding?: number;
  /** Keep this point centred (drive mode), animated. */
  follow?: LatLng;
  /** Your heading; draws the tick on the "me" car and, with `rotate`, turns the map heading-up. */
  heading?: number;
  rotate?: boolean;
  /** Pan + pinch. Default true. */
  interactive?: boolean;
  route?: LatLng[];
  /** draft: C3 editor line with vertex dots. live: behind indigo, ahead mint with glow (L1). */
  routeStyle?: 'draft' | 'live';
  /** Splits a live route into behind / ahead. */
  progressM?: number;
  stops?: Stop[];
  showStopRadius?: boolean;
  /** Name pills next to stop numbers (C3, L1). */
  stopLabels?: boolean;
  meetingPoint?: LatLng;
  cars?: MapCar[];
  /** Draggable pin (C2). */
  pin?: LatLng;
  onPinChange?: (ll: LatLng) => void;
  /** Tap anywhere (C3 extend route). */
  onPressMap?: (ll: LatLng) => void;
  /** Drag a route vertex (C3). Called continuously while dragging. */
  onDragRoutePoint?: (index: number, ll: LatLng) => void;
  /** Amber split marker (L6). With fromM/toM (route progress) the gap is dashed along the route. */
  split?: { position: LatLng; fromM?: number; toM?: number };
  /** Overlay UI (chips, buttons) positioned absolutely by the caller. */
  children?: ReactNode;
};

const GLIDE_MAX_CARS = 100;

/** The one map every screen uses. Needs a GestureHandlerRootView above it (root layout). */
export function MapCanvas(props: MapCanvasProps) {
  return <MapCanvasImpl {...props} gestures />;
}

/** Same map, no gestures at all: thumbnails and previews (I1, I2). */
export function MapCanvasStatic(props: MapCanvasProps) {
  return <MapCanvasImpl {...props} interactive={false} gestures={false} />;
}

export default MapCanvas;

function MapCanvasImpl({ gestures, ...props }: MapCanvasProps & { gestures: boolean }) {
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState<Size | null>(null);
  const { camera, setCamera, glideTo, camRef } = useCameraState(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.width !== width || size.height !== height) setSize({ width, height });
  };

  // Initial camera, and re-fit when the fit points (by value) or the view size change.
  const fitKey = pointsKey(props.fit);
  const sizeKey = size ? `${size.width}x${size.height}` : '';
  // Effects below read the latest props through this ref so they re-run only on their keys.
  const initRef = useRef({ props, camRef, glideTo });
  useEffect(() => {
    initRef.current = { props, camRef, glideTo };
  });
  useEffect(() => {
    if (!size || size.width === 0) return;
    const { props: p, camRef: cr, glideTo: go } = initRef.current;
    const rotation = p.rotate && p.heading != null ? p.heading : 0;
    if (p.fit && p.fit.length > 0) {
      go({ ...fitCamera(p.fit.map(toWorld), size, p.fitPadding ?? 32, p.zoom ?? DEFAULT_ZOOM), rotation }, false);
    } else if (!cr.current) {
      const c = p.follow ?? p.center ?? p.pin ?? p.meetingPoint;
      const w = c ? toWorld(c) : { x: 600, y: 800 };
      go(clampCamera({ cx: w.x, cy: w.y, zoom: p.zoom ?? DEFAULT_ZOOM, rotation }), false);
    }
  }, [fitKey, sizeKey, size]);

  // Follow mode: recentre (and turn heading-up) on every change, gliding like the car dots.
  const followKey = props.follow ? `${props.follow.lat.toFixed(7)},${props.follow.lng.toFixed(7)}|${props.rotate ? Math.round(props.heading ?? 0) : 0}` : '';
  const hasCamera = camera !== null;
  useEffect(() => {
    const { props: p, camRef: cr, glideTo: go } = initRef.current;
    if (!p.follow || !cr.current) return;
    const w = toWorld(p.follow);
    go({ cx: w.x, cy: w.y, zoom: cr.current.zoom, rotation: p.rotate ? p.heading ?? 0 : 0 }, !reducedMotion);
  }, [followKey, reducedMotion, hasCamera]);

  // Car targets in world px, glided.
  const cars = props.cars ?? [];
  const targets: Record<string, Px> = {};
  let carsKey = '';
  for (const c of cars) {
    targets[c.id] = toWorld(c.position);
    carsKey += `${c.id}:${c.position.lat.toFixed(7)},${c.position.lng.toFixed(7)};`;
  }
  const shown = useGlide(targets, carsKey, !reducedMotion && cars.length <= GLIDE_MAX_CARS);

  const scene = size && camera ? <Scene props={props} camera={camera} size={size} shown={shown} /> : null;

  return (
    <View style={[styles.root, props.style]} onLayout={onLayout}>
      {gestures && size ? (
        <MapGestures props={props} size={size} camRef={camRef} setCamera={setCamera}>
          <View style={StyleSheet.absoluteFill}>{scene}</View>
        </MapGestures>
      ) : (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {scene}
        </View>
      )}
      {props.children}
    </View>
  );
}

function Scene({ props, camera, size, shown }: { props: MapCanvasProps; camera: Camera; size: Size; shown: Record<string, Px> }) {
  const { diag, viewBox } = sceneViewBox(camera, size);
  const route = props.route ?? [];
  const style = props.routeStyle ?? 'draft';
  let behind: Px[] | undefined;
  let ahead: Px[] | undefined;
  if (style === 'live' && route.length > 1) {
    const len = routeLengthM(route);
    const at = Math.max(0, Math.min(len, props.progressM ?? 0));
    behind = at > 0 ? sliceRoute(route, 0, at).map(toWorld) : undefined;
    ahead = at < len ? sliceRoute(route, at, len).map(toWorld) : undefined;
  }
  const split = props.split;
  const splitPath = split && split.fromM != null && split.toM != null && route.length > 1 ? sliceRoute(route, split.fromM, split.toM).map(toWorld) : undefined;
  const cars: OverlayCar[] = (props.cars ?? []).map((c) => ({ id: c.id, at: shown[c.id] ?? toWorld(c.position), role: c.role, isMe: c.isMe, alert: c.alert }));

  return (
    <View
      style={{
        position: 'absolute',
        left: (size.width - diag) / 2,
        top: (size.height - diag) / 2,
        width: diag,
        height: diag,
        transform: camera.rotation ? [{ rotate: `${-camera.rotation}deg` }] : undefined,
      }}>
      <Basemap diag={diag} viewBox={viewBox} />
      <Svg style={StyleSheet.absoluteFill} width={diag} height={diag} viewBox={viewBox}>
        <MapOverlays
          zoom={camera.zoom}
          rotation={camera.rotation}
          route={style === 'draft' ? route.map(toWorld) : undefined}
          routeStyle={style}
          behind={behind}
          ahead={ahead}
          stops={props.stops}
          showStopRadius={props.showStopRadius}
          stopLabels={props.stopLabels}
          meetingPoint={props.meetingPoint ? toWorld(props.meetingPoint) : undefined}
          cars={cars}
          heading={props.heading}
          pin={props.pin ? toWorld(props.pin) : undefined}
          splitPath={splitPath}
          split={split ? toWorld(split.position) : undefined}
        />
      </Svg>
    </View>
  );
}

/** The mock-town basemap. Memoised: it only redraws when the camera moves. */
const Basemap = memo(function Basemap({ diag, viewBox }: { diag: number; viewBox: string }) {
  return <SvgXml xml={BASEMAP_XML} width={diag} height={diag} viewBox={viewBox} style={StyleSheet.absoluteFill} />;
});

type DragMode = { kind: 'none' } | { kind: 'pan' } | { kind: 'pin'; dx: number; dy: number } | { kind: 'vertex'; index: number; dx: number; dy: number };

const PIN_HIT = 30;
const VERTEX_HIT = 24;

/** Pan, pinch, tap, and dragging the pin / route vertices. All callbacks run on the JS thread. */
function MapGestures({
  props,
  size,
  camRef,
  setCamera,
  children,
}: {
  props: MapCanvasProps;
  size: Size;
  camRef: { current: Camera | null };
  setCamera: (next: Camera | ((c: Camera) => Camera)) => void;
  children: ReactNode;
}) {
  const latest = useRef({ props, size });
  useEffect(() => {
    latest.current = { props, size };
  });
  const mode = useRef<DragMode>({ kind: 'none' });

  const toLL = (x: number, y: number) => {
    const cam = camRef.current;
    return cam ? fromWorld(screenToWorld({ x, y }, cam, latest.current.size)) : null;
  };

  const interactive = props.interactive ?? true;

  const pan = usePanGesture({
    disableReanimated: true,
    enabled: interactive || !!props.onPinChange || !!props.onDragRoutePoint,
    onBegin: (e) => {
      const { props: p, size: s } = latest.current;
      const cam = camRef.current;
      mode.current = { kind: (p.interactive ?? true) ? 'pan' : 'none' };
      if (!cam) return;
      if (p.pin && p.onPinChange) {
        const sp = worldToScreen(toWorld(p.pin), cam, s);
        // The pin's head sits ~26 px above its tip; accept touches on either.
        if (Math.hypot(e.x - sp.x, e.y - sp.y) < PIN_HIT || Math.hypot(e.x - sp.x, e.y - (sp.y - 26)) < PIN_HIT) {
          mode.current = { kind: 'pin', dx: sp.x - e.x, dy: sp.y - e.y };
          return;
        }
      }
      if (p.onDragRoutePoint && p.route) {
        let best = -1;
        let bestD = VERTEX_HIT;
        p.route.forEach((ll, i) => {
          const sp = worldToScreen(toWorld(ll), cam, s);
          const d = Math.hypot(e.x - sp.x, e.y - sp.y);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        if (best >= 0) {
          const sp = worldToScreen(toWorld(p.route[best]), cam, s);
          mode.current = { kind: 'vertex', index: best, dx: sp.x - e.x, dy: sp.y - e.y };
        }
      }
    },
    onUpdate: (e) => {
      const m = mode.current;
      const p = latest.current.props;
      if (m.kind === 'pan') setCamera((c) => panBy(c, e.changeX, e.changeY));
      else if (m.kind === 'pin') {
        const ll = toLL(e.x + m.dx, e.y + m.dy);
        if (ll) p.onPinChange?.(ll);
      } else if (m.kind === 'vertex') {
        const ll = toLL(e.x + m.dx, e.y + m.dy);
        if (ll) p.onDragRoutePoint?.(m.index, ll);
      }
    },
    onFinalize: () => {
      mode.current = { kind: 'none' };
    },
  });

  const pinch = usePinchGesture({
    disableReanimated: true,
    enabled: interactive,
    onUpdate: (e) => {
      if (mode.current.kind === 'pin' || mode.current.kind === 'vertex') return;
      setCamera((c) => zoomAround(c, latest.current.size, { x: e.focalX, y: e.focalY }, e.scaleChange));
    },
  });

  const tap = useTapGesture({
    disableReanimated: true,
    enabled: !!props.onPressMap,
    onActivate: (e) => {
      const ll = toLL(e.x, e.y);
      if (ll) latest.current.props.onPressMap?.(ll);
    },
  });

  const gesture = useSimultaneousGestures(pan, pinch, tap);
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: colors.mapBg },
});
