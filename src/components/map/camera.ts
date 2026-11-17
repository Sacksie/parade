import { latLngToPx, pxToLatLng, TOWN, type Px } from '@/data/mockTown';
import type { LatLng } from '@/types';

/**
 * Map camera math. The ONLY place that knows how LatLng becomes screen pixels, so live tiles can
 * replace the mock basemap later by swapping `toWorld` / `fromWorld` and the basemap layer.
 *
 * World = basemap px (1200×1600). Camera = the world point at the centre of the view, a zoom
 * (screen px per world px) and a rotation (the map heading that points up, degrees clockwise).
 *   screen = S + rot(-rotation) · zoom · (world − centre)      S = view centre
 */

export type Size = { width: number; height: number };
export type Camera = { cx: number; cy: number; zoom: number; rotation: number };

export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 4;
export const DEFAULT_ZOOM = 1.4;
export const WORLD = { width: TOWN.width, height: TOWN.height };

export const toWorld = (ll: LatLng): Px => latLngToPx(ll);
export const fromWorld = (p: Px): LatLng => pxToLatLng(p);

export const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

/** Keep the centre over the basemap. */
export function clampCamera(c: Camera): Camera {
  return {
    ...c,
    zoom: clampZoom(c.zoom),
    cx: Math.max(0, Math.min(WORLD.width, c.cx)),
    cy: Math.max(0, Math.min(WORLD.height, c.cy)),
  };
}

const rad = (d: number) => (d * Math.PI) / 180;

export function worldToScreen(p: Px, cam: Camera, size: Size): Px {
  const a = rad(-cam.rotation);
  const dx = (p.x - cam.cx) * cam.zoom;
  const dy = (p.y - cam.cy) * cam.zoom;
  return {
    x: size.width / 2 + dx * Math.cos(a) - dy * Math.sin(a),
    y: size.height / 2 + dx * Math.sin(a) + dy * Math.cos(a),
  };
}

export function screenToWorld(s: Px, cam: Camera, size: Size): Px {
  const a = rad(cam.rotation);
  const dx = (s.x - size.width / 2) / cam.zoom;
  const dy = (s.y - size.height / 2) / cam.zoom;
  return { x: cam.cx + dx * Math.cos(a) - dy * Math.sin(a), y: cam.cy + dx * Math.sin(a) + dy * Math.cos(a) };
}

/** Move the camera by a screen-space drag. */
export function panBy(cam: Camera, dxScreen: number, dyScreen: number): Camera {
  const a = rad(cam.rotation);
  const dx = dxScreen / cam.zoom;
  const dy = dyScreen / cam.zoom;
  return clampCamera({ ...cam, cx: cam.cx - (dx * Math.cos(a) - dy * Math.sin(a)), cy: cam.cy - (dx * Math.sin(a) + dy * Math.cos(a)) });
}

/** Zoom by `factor`, keeping the world point under `focal` (screen px) fixed. */
export function zoomAround(cam: Camera, size: Size, focal: Px, factor: number): Camera {
  const zoom = clampZoom(cam.zoom * factor);
  const w = screenToWorld(focal, cam, size);
  const next = { ...cam, zoom };
  const after = screenToWorld(focal, next, size);
  return clampCamera({ ...next, cx: next.cx + (w.x - after.x), cy: next.cy + (w.y - after.y) });
}

/** Camera that fits these world points in view with `padding` screen px around them. */
export function fitCamera(points: Px[], size: Size, padding = 32, fallbackZoom = DEFAULT_ZOOM): Camera {
  if (points.length === 0) return { cx: WORLD.width / 2, cy: WORLD.height / 2, zoom: fallbackZoom, rotation: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const zoom = points.length === 1 ? fallbackZoom : Math.min((size.width - 2 * padding) / w, (size.height - 2 * padding) / h);
  return clampCamera({ cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, zoom: Math.max(MIN_ZOOM, zoom), rotation: 0 });
}

/**
 * The basemap and overlays are drawn into a square of side `diag` (the view's diagonal) centred on
 * the view, then rotated with a View transform. This is that square's viewBox in world px.
 */
export function sceneViewBox(cam: Camera, size: Size) {
  const diag = Math.ceil(Math.hypot(size.width, size.height));
  const side = diag / cam.zoom;
  return { diag, viewBox: `${cam.cx - side / 2} ${cam.cy - side / 2} ${side} ${side}` };
}

/** Shortest-path interpolation between two cameras (t in 0..1). */
export function lerpCamera(a: Camera, b: Camera, t: number): Camera {
  const dr = ((((b.rotation - a.rotation) % 360) + 540) % 360) - 180;
  return {
    cx: a.cx + (b.cx - a.cx) * t,
    cy: a.cy + (b.cy - a.cy) * t,
    zoom: a.zoom + (b.zoom - a.zoom) * t,
    rotation: a.rotation + dr * t,
  };
}

/** Stable key for a list of points, so callers can pass fresh arrays without re-fitting. */
export const pointsKey = (pts: LatLng[] | undefined) => (pts ? pts.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join(';') : '');
