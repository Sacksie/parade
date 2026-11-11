import type { LatLng, Stop } from '@/types';

/**
 * The made-up town from the design mockups (docs/design/assets/basemap.svg).
 * Until live map tiles are wired in, the MapCanvas draws this basemap and
 * everything else in the app uses real lat/lng + metres, so swapping in
 * real tiles later only touches the projection.
 *
 * Basemap is 1200×1600 px. One px ≈ 4 m. The car-park entrance on Church
 * Road sits at px (450,1110) and at 51.58731, −0.22710 (the C2 mockup).
 */
export const TOWN = {
  width: 1200,
  height: 1600,
  metresPerPx: 4,
  origin: { x: 450, y: 1110 },
  originLatLng: { lat: 51.58731, lng: -0.2271 } as LatLng,
} as const;

const M_PER_DEG_LAT = 111_320;
const M_PER_DEG_LNG = M_PER_DEG_LAT * Math.cos((TOWN.originLatLng.lat * Math.PI) / 180);

export type Px = { x: number; y: number };

export function pxToLatLng(p: Px): LatLng {
  const dxM = (p.x - TOWN.origin.x) * TOWN.metresPerPx;
  const dyM = (p.y - TOWN.origin.y) * TOWN.metresPerPx;
  return {
    lat: TOWN.originLatLng.lat - dyM / M_PER_DEG_LAT,
    lng: TOWN.originLatLng.lng + dxM / M_PER_DEG_LNG,
  };
}

export function latLngToPx(ll: LatLng): Px {
  const dyM = (TOWN.originLatLng.lat - ll.lat) * M_PER_DEG_LAT;
  const dxM = (ll.lng - TOWN.originLatLng.lng) * M_PER_DEG_LNG;
  return { x: TOWN.origin.x + dxM / TOWN.metresPerPx, y: TOWN.origin.y + dyM / TOWN.metresPerPx };
}

/** Named roads in the basemap: axis-aligned, so a point is "on" a road when it's near its line. */
export const ROADS: { name: string; axis: 'h' | 'v'; at: number; from: number; to: number; main?: boolean; lights?: boolean }[] = [
  { name: 'High Street', axis: 'h', at: 700, from: 0, to: 1200, main: true, lights: true },
  { name: 'Church Road', axis: 'h', at: 1050, from: 0, to: 1200 },
  { name: 'Queens Road', axis: 'h', at: 400, from: 0, to: 1200, main: true },
  { name: 'Station Road', axis: 'v', at: 600, from: 0, to: 1600, main: true, lights: true },
  { name: 'Brent Way', axis: 'v', at: 900, from: 0, to: 1600 },
  { name: 'Hale Lane', axis: 'h', at: 1430, from: 0, to: 1200 },
  { name: 'Elm Grove', axis: 'h', at: 600, from: 0, to: 500 },
  { name: 'Mill Lane', axis: 'h', at: 600, from: 600, to: 1200 },
  { name: 'Albert Street', axis: 'h', at: 900, from: 0, to: 600 },
  { name: 'Cedar Road', axis: 'h', at: 900, from: 900, to: 1200 },
  { name: 'Park Avenue', axis: 'h', at: 1250, from: 0, to: 600 },
  { name: 'Rosewood Ave', axis: 'h', at: 1250, from: 600, to: 1200 },
  { name: 'Kings Close', axis: 'h', at: 300, from: 0, to: 600 },
  { name: 'Wharf Road', axis: 'h', at: 300, from: 600, to: 1200 },
  { name: 'Hill Rise', axis: 'v', at: 500, from: 800, to: 1000 },
  { name: 'Orchard Way', axis: 'v', at: 750, from: 400, to: 600 },
  { name: 'Bury Road', axis: 'v', at: 1000, from: 400, to: 700 },
  { name: 'Vale Road', axis: 'v', at: 800, from: 1250, to: 1430 },
  { name: 'Ashley Gardens', axis: 'v', at: 450, from: 1050, to: 1430 },
];

/** Street name for a basemap point, if it lies on a known road. */
export function roadNameAtPx(p: Px, tolerancePx = 18): string | null {
  let best: { name: string; d: number } | null = null;
  for (const r of ROADS) {
    const along = r.axis === 'h' ? p.x : p.y;
    if (along < r.from - tolerancePx || along > r.to + tolerancePx) continue;
    const d = Math.abs((r.axis === 'h' ? p.y : p.x) - r.at);
    if (d <= tolerancePx && (!best || d < best.d)) best = { name: r.name, d };
  }
  return best?.name ?? null;
}

export function roadAtPx(p: Px, tolerancePx = 18) {
  const name = roadNameAtPx(p, tolerancePx);
  return name ? ROADS.find((r) => r.name === name) ?? null : null;
}

export function roadNameAt(ll: LatLng): string | null {
  return roadNameAtPx(latLngToPx(ll));
}

/** The mock parade's route, as drawn in the C3 mockup. ≈6.5 km. */
export const MOCK_ROUTE_PX: Px[] = [
  { x: 450, y: 1110 }, // Leisure Centre car park
  { x: 450, y: 1050 }, // onto Church Road
  { x: 600, y: 1050 }, // left onto Station Road
  { x: 600, y: 700 }, // right onto High Street
  { x: 900, y: 700 }, // left onto Brent Way
  { x: 900, y: 400 }, // left onto Queens Road
  { x: 600, y: 400 }, // right onto Station Road
  { x: 600, y: 232 }, // finish
];

export const MOCK_ROUTE: LatLng[] = MOCK_ROUTE_PX.map(pxToLatLng);
export const MOCK_MEETING_POINT: LatLng = pxToLatLng({ x: 450, y: 1110 });

export const MOCK_STOPS: Stop[] = [
  {
    id: 'stop-1',
    seq: 1,
    name: 'Menorah lighting',
    kind: 'stop',
    durationMin: 10,
    position: pxToLatLng({ x: 680, y: 700 }),
    radiusM: 40,
    pauseMusic: true,
    arrivalMessage: "We've reached the Town Hall. Pull in behind the car in front and turn your engine off.",
  },
  {
    id: 'stop-2',
    seq: 2,
    name: 'Care home',
    kind: 'drive_past',
    durationMin: 0,
    position: pxToLatLng({ x: 900, y: 560 }),
    radiusM: 40,
    pauseMusic: false,
    arrivalMessage: 'Slow right down and wave to the residents at the care home on your left.',
  },
];

/** Address search results for the C2 mock (no geocoding API yet). */
export const MOCK_PLACES: { name: string; detail: string; position: LatLng }[] = [
  { name: 'Leisure Centre car park', detail: 'Church Road', position: pxToLatLng({ x: 450, y: 1110 }) },
  { name: 'Town Hall', detail: 'High Street', position: pxToLatLng({ x: 680, y: 660 }) },
  { name: 'Victoria Park', detail: 'Albert Street', position: pxToLatLng({ x: 800, y: 922 }) },
  { name: 'Grove Park', detail: 'Hale Lane', position: pxToLatLng({ x: 1000, y: 1450 }) },
  { name: 'Station car park', detail: 'Station Road', position: pxToLatLng({ x: 640, y: 1430 }) },
];
