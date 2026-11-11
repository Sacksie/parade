import { pad2 } from '@/lib/dates';

/** "650 m" under 1 km, "2.0 km" above. */
export function formatDistance(metres: number): string {
  if (!Number.isFinite(metres)) return '–';
  if (metres < 1000) return `${Math.max(0, Math.round(metres / 10) * 10)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/** "4 min", "1 h 05 min", "45 s" */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${pad2(m % 60)} min`;
}

/** "mm:ss" for countdowns and track positions. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
}

/** "2 min ago", "just now" */
export function formatAgo(timestampMs: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - timestampMs) / 1000));
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
}

/** "in 6 min", "in 2 h", "in 24 days", "now" */
export function formatUntil(timestampMs: number, now = Date.now()): string {
  const s = Math.round((timestampMs - now) / 1000);
  if (s <= 30) return 'now';
  if (s < 3600) return `in ${Math.round(s / 60)} min`;
  if (s < 86400) return `in ${Math.round(s / 3600)} h`;
  const d = Math.round(s / 86400);
  return `in ${d} day${d === 1 ? '' : 's'}`;
}

/** "2.4 MB", "640 KB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "07" */
export const formatCarNumber = (n: number) => pad2(n);

/** Combine a parade's ISO date and HH:MM into local epoch ms. */
export function dateTimeMs(isoDate: string, hhmm: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

export function msToHHMM(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

/** 6-char parade join code, no ambiguous characters. */
export function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
