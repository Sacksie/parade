import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRef, useSyncExternalStore } from 'react';

import { seedState } from '@/data/seed';
import type { Car, LiveState, Me, Parade } from '@/types';

/**
 * App state. One plain object, replaced immutably on every change.
 * Persisted to AsyncStorage (localStorage on web) so a reload keeps your drafts.
 * Supabase will sit behind the same actions later; screens never touch storage.
 */
export type AppState = {
  hydrated: boolean;
  me: Me;
  parades: Record<string, Parade>;
  /** Cars keyed by parade id. */
  cars: Record<string, Car[]>;
  /** Live state keyed by parade id. Only present while live/ended. */
  live: Record<string, LiveState>;
  /** The parade currently being edited in the Create wizard. */
  draftId: string | null;
  /** Cumulative counters for stats on the finish screen. */
  stats: Record<string, { announcements: number; helpRequests: number }>;
};

const STORAGE_KEY = 'parade.state.v1';

let state: AppState = { ...seedState(), hydrated: false };
const listeners = new Set<() => void>();

export function getState(): AppState {
  return state;
}

export function setState(updater: (s: AppState) => AppState): void {
  const next = updater(state);
  if (next === state) return;
  state = next;
  listeners.forEach((l) => l());
  schedulePersist();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Subscribe a component to a slice of state.
 * The selector result is cached per (state, selector) so selectors may return
 * fresh arrays/objects: React requires getSnapshot to be stable between changes.
 */
export function useStore<T>(selector: (s: AppState) => T): T {
  const cache = useRef<{ state: AppState; selector: (s: AppState) => T; value: T } | null>(null);
  const getSnapshot = () => {
    const c = cache.current;
    if (c && c.state === state && c.selector === selector) return c.value;
    const value = selector(state);
    cache.current = { state, selector, value };
    return value;
  };
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist() {
  if (!state.hydrated) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    // Live positions churn every second; don't persist them.
    const { live, ...rest } = state;
    const slim = { ...rest, live: Object.fromEntries(Object.entries(live).map(([k, v]) => [k, { ...v, positions: {} }])) };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(slim)).catch(() => {});
  }, 400);
}

/** Load persisted state once at boot. Falls back to the seed. */
export async function hydrate(): Promise<void> {
  if (state.hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppState>;
      state = { ...seedState(), ...saved, hydrated: true };
    } else {
      state = { ...state, hydrated: true };
    }
  } catch {
    state = { ...state, hydrated: true };
  }
  listeners.forEach((l) => l());
}

/** Dev: wipe everything and go back to the seeded demo data. */
export async function resetToSeed(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  state = { ...seedState(), hydrated: true };
  listeners.forEach((l) => l());
}
