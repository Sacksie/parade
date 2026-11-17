import { latLngToPx, pxToLatLng, ROADS, roadAtPx, type Px } from '@/data/mockTown';
import type { CarPosition, LatLng, SplitAlert, Stop } from '@/types';

/**
 * Route geometry. Pure functions, no React.
 * Distances are metres, bearings are degrees (0 = north, clockwise), positions are LatLng.
 * Everything except the "mock town" helpers at the bottom works on real coordinates.
 */

const R_EARTH = 6_371_008.8;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export const ll = (lat: number, lng: number): LatLng => ({ lat, lng });
export const sameLL = (a: LatLng, b: LatLng, eps = 1e-9) => Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps;
/** Normalise any angle to [0, 360). */
export const normDeg = (d: number) => ((d % 360) + 360) % 360;
/** Signed smallest difference b − a in (−180, 180]. Positive = clockwise (right). */
export function angleDiff(a: number, b: number): number {
  const d = normDeg(b - a);
  return d > 180 ? d - 360 : d;
}

/** Great-circle distance (haversine). */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a to b. */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const φ1 = rad(a.lat);
  const φ2 = rad(b.lat);
  const Δλ = rad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normDeg(deg(Math.atan2(y, x)));
}

/** Point `metres` away from a along `bearing`. */
export function destination(a: LatLng, bearing: number, metres: number): LatLng {
  const δ = metres / R_EARTH;
  const θ = rad(bearing);
  const φ1 = rad(a.lat);
  const λ1 = rad(a.lng);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: deg(φ2), lng: deg(λ2) };
}

/** Linear interpolation between two nearby points (fine at street scale). */
export const lerpLL = (a: LatLng, b: LatLng, t: number): LatLng => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });

// ---------- Polylines ----------

/** Metres along the route at each vertex. Same length as the route; starts at 0. */
export function cumulativeDistances(route: LatLng[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i < route.length; i++) {
    if (i > 0) acc += distanceM(route[i - 1], route[i]);
    out.push(acc);
  }
  return out;
}

export function routeLengthM(route: LatLng[]): number {
  let acc = 0;
  for (let i = 1; i < route.length; i++) acc += distanceM(route[i - 1], route[i]);
  return acc;
}

/** Local flat metres around an origin (equirectangular; accurate to well under 1% across a town). */
function toLocal(o: LatLng, p: LatLng) {
  const kx = 111_320 * Math.cos(rad(o.lat));
  return { x: (p.lng - o.lng) * kx, y: (p.lat - o.lat) * 111_320 };
}

export type RouteProjection = { progressM: number; offRouteM: number; point: LatLng; segmentIndex: number };

/** Nearest point on the polyline to p. */
export function projectOnRoute(route: LatLng[], p: LatLng): RouteProjection {
  if (route.length === 0) return { progressM: 0, offRouteM: Infinity, point: p, segmentIndex: 0 };
  if (route.length === 1) return { progressM: 0, offRouteM: distanceM(route[0], p), point: route[0], segmentIndex: 0 };
  let best: RouteProjection = { progressM: 0, offRouteM: Infinity, point: route[0], segmentIndex: 0 };
  let acc = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const segLen = distanceM(a, b);
    const B = toLocal(a, b);
    const P = toLocal(a, p);
    const len2 = B.x * B.x + B.y * B.y;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (P.x * B.x + P.y * B.y) / len2));
    const dx = P.x - B.x * t;
    const dy = P.y - B.y * t;
    const d = Math.hypot(dx, dy);
    if (d < best.offRouteM) best = { progressM: acc + segLen * t, offRouteM: d, point: lerpLL(a, b, t), segmentIndex: i };
    acc += segLen;
  }
  return best;
}

/** Index of the segment containing `metres`, plus metres into it. */
function locate(route: LatLng[], metres: number) {
  let acc = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const len = distanceM(route[i], route[i + 1]);
    if (metres <= acc + len || i === route.length - 2) return { i, into: Math.max(0, Math.min(len, metres - acc)), len };
    acc += len;
  }
  return { i: 0, into: 0, len: 0 };
}

/** The point `metres` along the route (clamped to its ends). */
export function pointAtProgress(route: LatLng[], metres: number): LatLng {
  if (route.length === 0) return { lat: 0, lng: 0 };
  if (route.length === 1 || metres <= 0) return route[0];
  const { i, into, len } = locate(route, metres);
  return len === 0 ? route[i] : lerpLL(route[i], route[i + 1], into / len);
}

/** Direction of travel at `metres` along the route. */
export function headingAtProgress(route: LatLng[], metres: number): number {
  if (route.length < 2) return 0;
  const { i } = locate(route, Math.max(0, metres));
  return bearingDeg(route[i], route[i + 1]);
}

/** The part of the route between two progress values, as a polyline. */
export function sliceRoute(route: LatLng[], fromM: number, toM: number): LatLng[] {
  if (route.length < 2) return route.slice();
  const lo = Math.max(0, Math.min(fromM, toM));
  const hi = Math.max(fromM, toM);
  const cum = cumulativeDistances(route);
  const out: LatLng[] = [pointAtProgress(route, lo)];
  for (let i = 0; i < route.length; i++) if (cum[i] > lo && cum[i] < hi) out.push(route[i]);
  out.push(pointAtProgress(route, hi));
  return out;
}

// ---------- Turn list (C4) ----------

export type Turn = {
  kind: 'start' | 'left' | 'right' | 'straight' | 'stop' | 'finish';
  atM: number;
  position: LatLng;
  road?: string;
  instruction: string;
  warning?: string;
  stop?: Stop;
};

export const WARN_NO_LIGHTS = 'No traffic lights. The convoy will break up here. Put a marshal on this corner.';
export const WARN_ACROSS_MAIN = 'Turning across a main road. Expect long waits; the lead car should slow down after it.';

type Road = (typeof ROADS)[number];

/** The named road a segment runs along (mock town: roads are axis-aligned). */
function roadForSegment(a: LatLng, b: LatLng): Road | null {
  const pa = latLngToPx(a);
  const pb = latLngToPx(b);
  const horizontal = Math.abs(pb.x - pa.x) >= Math.abs(pb.y - pa.y);
  const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
  let best: { r: Road; d: number } | null = null;
  for (const r of ROADS) {
    if ((r.axis === 'h') !== horizontal) continue;
    const along = r.axis === 'h' ? mid.x : mid.y;
    if (along < r.from - 18 || along > r.to + 18) continue;
    const d = Math.abs((r.axis === 'h' ? mid.y : mid.x) - r.at);
    if (d <= 18 && (!best || d < best.d)) best = { r, d };
  }
  return best?.r ?? roadAtPx(mid);
}

const shortRoad = (name: string) => name.replace(/ Road$/, ' Rd').replace(/ Street$/, ' St');

/**
 * Warnings for a turn from road `from` onto road `to`.
 * A junction counts as lit only if both roads have lights. At an unlit junction:
 *  - a right turn onto a main road crosses its oncoming traffic (UK) → "across a main road";
 *  - joining a busy road (one that has lights elsewhere) → "no traffic lights".
 */
function turnWarning(dir: 'left' | 'right', from: Road | null, to: Road | null): string | undefined {
  if (!to) return undefined;
  const lit = !!from?.lights && !!to.lights;
  if (lit) return undefined;
  if (dir === 'right' && to.main) return WARN_ACROSS_MAIN;
  if (to.lights) return WARN_NO_LIGHTS;
  return undefined;
}

/** Where each stop sits along the route. */
export function stopProgress(route: LatLng[], stop: Stop): number {
  return projectOnRoute(route, stop.position).progressM;
}

/**
 * Turn-by-turn list as drivers hear it: start, every turn > 30°, stops merged in route order, finish.
 * The first turn is folded into the start line when the first leg is a short exit (< 300 m), e.g.
 * "Leave car park, right onto Church Rd".
 */
export function turnList(route: LatLng[], stops: Stop[] = []): Turn[] {
  if (route.length < 2) return [];
  const cum = cumulativeDistances(route);
  const roads: (Road | null)[] = [];
  for (let i = 0; i < route.length - 1; i++) roads.push(roadForSegment(route[i], route[i + 1]));

  const turns: Turn[] = [];
  let startFolded = false;
  for (let i = 1; i < route.length - 1; i++) {
    const delta = angleDiff(bearingDeg(route[i - 1], route[i]), bearingDeg(route[i], route[i + 1]));
    if (Math.abs(delta) <= 30) continue;
    const dir = delta > 0 ? 'right' : 'left';
    const to = roads[i];
    const name = to?.name;
    if (turns.length === 0 && !startFolded && i === 1 && cum[1] < 300) {
      startFolded = true;
      turns.push({
        kind: 'start',
        // The manoeuvre happens at the first vertex, so nav counts down to it.
        atM: cum[1],
        position: route[1],
        road: name,
        instruction: name ? `Leave car park, ${dir} onto ${shortRoad(name)}` : `Leave car park, turn ${dir}`,
        warning: turnWarning(dir, roads[0], to),
      });
      continue;
    }
    turns.push({
      kind: dir,
      atM: cum[i],
      position: route[i],
      road: name,
      instruction: name ? `${dir === 'left' ? 'Left' : 'Right'} onto ${name}` : `Turn ${dir}`,
      warning: turnWarning(dir, roads[i - 1], to),
    });
  }
  if (!startFolded) {
    const name = roads[0]?.name;
    turns.unshift({ kind: 'start', atM: 0, position: route[0], road: name, instruction: name ? `Start on ${name}` : 'Start' });
  }

  for (const stop of stops) {
    const proj = projectOnRoute(route, stop.position);
    const seg = Math.min(proj.segmentIndex, roads.length - 1);
    turns.push({ kind: 'stop', atM: proj.progressM, position: stop.position, road: roads[seg]?.name, instruction: stop.name, stop });
  }

  const lastRoad = roads[roads.length - 1]?.name;
  turns.push({
    kind: 'finish',
    atM: cum[cum.length - 1],
    position: route[route.length - 1],
    road: lastRoad,
    instruction: lastRoad ? `Finish · ${lastRoad}` : 'Finish',
  });

  // Stable sort keeps a stop after a turn at the same spot.
  return turns.map((t, i) => ({ t, i })).sort((a, b) => a.t.atM - b.t.atM || a.i - b.i).map(({ t }) => t);
}

/** Next real manoeuvre (not a stop) more than 5 m ahead. */
export function nextTurn(turns: Turn[], progressM: number): Turn | null {
  return turns.find((t) => t.kind !== 'stop' && t.atM > progressM + 5) ?? null;
}

export type NextStop = { stop: Stop; distanceM: number; progressM: number };

/** Next stop ahead of `progressM` (optionally skipping ones already done). */
export function nextStop(stops: Stop[], route: LatLng[], progressM: number, skipIds: string[] = []): NextStop | null {
  let best: NextStop | null = null;
  for (const stop of stops) {
    if (skipIds.includes(stop.id)) continue;
    const at = stopProgress(route, stop);
    if (at < progressM - stop.radiusM) continue;
    const d = Math.max(0, at - progressM);
    if (!best || d < best.distanceM) best = { stop, distanceM: d, progressM: at };
  }
  return best;
}

export type RouteStats = { distanceM: number; drivingS: number; stopsS: number; totalS: number; stops: number };

/** Distance and time including stops. Drive-pasts add no time. */
export function routeStats(route: LatLng[], stops: Stop[], avgKmh = 12): RouteStats {
  const distance = routeLengthM(route);
  const drivingS = distance / (avgKmh / 3.6);
  const stopsS = stops.reduce((s, st) => s + (st.kind === 'stop' ? st.durationMin * 60 : 0), 0);
  return { distanceM: distance, drivingS, stopsS, totalS: drivingS + stopsS, stops: stops.length };
}

// ---------- Convoy ----------

/** Front of the convoy first. */
export function orderCars(positions: Record<string, CarPosition>): CarPosition[] {
  return Object.values(positions).sort((a, b) => b.progressM - a.progressM);
}

/**
 * Largest gap along the route between neighbouring cars, if above threshold.
 * Pass the route to place the marker on the line; otherwise it's the midpoint of the two cars.
 */
export function detectSplit(ordered: CarPosition[], thresholdM = 300, route?: LatLng[]): SplitAlert | null {
  let best: SplitAlert | null = null;
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    const gap = a.progressM - b.progressM;
    if (gap > thresholdM && (!best || gap > best.gapM)) {
      const mid = (a.progressM + b.progressM) / 2;
      best = {
        frontCarId: a.carId,
        behindCarId: b.carId,
        gapM: gap,
        position: route && route.length > 1 ? pointAtProgress(route, mid) : lerpLL(a.position, b.position, 0.5),
        detectedAt: Date.now(),
      };
    }
  }
  return best;
}

export const OFF_ROUTE_M = 40;
export const OFF_ROUTE_GRACE_MS = 10_000;

/** Off route = more than 40 m from the line for more than 10 s. */
export function isOffRoute(offRouteM: number, firstOffSinceMs: number | null, now: number = Date.now()): boolean {
  return offRouteM > OFF_ROUTE_M && firstOffSinceMs != null && now - firstOffSinceMs >= OFF_ROUTE_GRACE_MS;
}

// ---------- Mock town: snap-to-road route drawing (C3) ----------

const SNAP_PX = 60;
const ON_ROAD_PX = 1.5;

type RoadHit = { road: Road; d: number; snapped: Px };

function hitRoad(r: Road, p: Px): RoadHit {
  const along = r.axis === 'h' ? p.x : p.y;
  const clamped = Math.max(r.from, Math.min(r.to, along));
  const snapped = r.axis === 'h' ? { x: clamped, y: r.at } : { x: r.at, y: clamped };
  return { road: r, d: Math.hypot(snapped.x - p.x, snapped.y - p.y), snapped };
}

/** Snap a basemap point to the nearest road line (within 60 px), else return it unchanged. */
export function snapToRoad(px: Px): Px {
  let best: RoadHit | null = null;
  for (const r of ROADS) {
    const h = hitRoad(r, px);
    if (!best || h.d < best.d) best = h;
  }
  return best && best.d <= SNAP_PX ? best.snapped : px;
}

/** Roads a point lies on (a junction lies on two). */
const roadsAt = (p: Px) => ROADS.filter((r) => hitRoad(r, p).d <= ON_ROAD_PX);

const onRoad = (r: Road, p: Px) => hitRoad(r, p).d <= ON_ROAD_PX;
const pathLen = (pts: Px[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
const crossing = (a: Road, b: Road): Px | null => {
  if (a.axis === b.axis) return null;
  const h = a.axis === 'h' ? a : b;
  const v = a.axis === 'h' ? b : a;
  const p = { x: v.at, y: h.at };
  return onRoad(h, p) && onRoad(v, p) ? p : null;
};

/**
 * Extend a drawn route to a tap, following roads. Same road: straight on. Crossing roads: an L via
 * the junction. Parallel roads: along, across a connecting road, along. Otherwise a straight line.
 */
export function extendRoute(routePx: Px[], tapPx: Px): Px[] {
  const target = snapToRoad(tapPx);
  if (routePx.length === 0) return [target];
  const last = routePx[routePx.length - 1];
  if (Math.hypot(target.x - last.x, target.y - last.y) < 1) return routePx;
  const from = roadsAt(last);
  const to = roadsAt(target);
  if (from.some((r) => to.includes(r))) return [...routePx, target];

  let best: Px[] | null = null;
  const consider = (via: Px[]) => {
    const path = [last, ...via, target];
    if (!best || pathLen(path) < pathLen([last, ...best, target])) best = via;
  };
  for (const a of from) {
    for (const b of to) {
      const x = crossing(a, b);
      if (x) consider([x]);
      else if (a.axis === b.axis) {
        for (const c of ROADS) {
          const x1 = crossing(a, c);
          const x2 = crossing(c, b);
          if (x1 && x2) consider([x1, x2]);
        }
      }
    }
  }
  const via: Px[] = (best ?? []) as Px[];
  const out = [...routePx];
  for (const p of [...via, target]) {
    const prev = out[out.length - 1];
    if (Math.hypot(p.x - prev.x, p.y - prev.y) >= 1) out.push(p);
  }
  return out;
}

/** LatLng wrappers for the route editor. */
export const snapLatLngToRoad = (p: LatLng): LatLng => pxToLatLng(snapToRoad(latLngToPx(p)));
export const extendRouteLatLng = (route: LatLng[], tap: LatLng): LatLng[] => {
  const px = extendRoute(route.map(latLngToPx), latLngToPx(tap));
  // Keep the caller's exact existing vertices; only new points are converted back.
  return [...route, ...px.slice(route.length).map(pxToLatLng)];
};
