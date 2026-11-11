import type { LatLng } from '@/types';

/** "51.58731, −0.22710" with a real minus sign. */
export function formatLatLng(p: LatLng): string {
  const f = (n: number) => n.toFixed(5).replace('-', '−');
  return `${f(p.lat)}, ${f(p.lng)}`;
}

/** Turn-list distances always in km, as drivers hear them: "0.6 km". */
export const formatKm = (m: number) => `${(m / 1000).toFixed(1)} km`;

/** "Sevivon (final mix).mp3" → "Sevivon (final mix)" */
export const titleFromFilename = (name: string) =>
  name
    .replace(/\.[a-z0-9]{2,4}$/i, '')
    .replace(/[_]+/g, ' ')
    .trim() || 'Untitled track';

/** Rough length of an MP3 from its size, assuming 128 kbps. */
export const estimateDurationS = (bytes: number) => Math.max(1, Math.round(bytes / 16_000));
