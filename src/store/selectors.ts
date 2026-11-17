import { useStore } from '@/store/store';
import type { Car, LiveState, Parade } from '@/types';

export const useMe = () => useStore((s) => s.me);
export const useHydrated = () => useStore((s) => s.hydrated);

export const useParade = (id: string | undefined): Parade | undefined => useStore((s) => (id ? s.parades[id] : undefined));

const EMPTY_CARS: Car[] = [];
export const useCars = (paradeId: string | undefined): Car[] => useStore((s) => (paradeId ? s.cars[paradeId] ?? EMPTY_CARS : EMPTY_CARS));

export const useLive = (paradeId: string | undefined): LiveState | undefined => useStore((s) => (paradeId ? s.live[paradeId] : undefined));

/** My car in this parade, if I joined it. */
export const useMyCar = (paradeId: string | undefined): Car | undefined =>
  useStore((s) => (paradeId ? (s.cars[paradeId] ?? []).find((c) => c.userId === s.me.id) : undefined));

/** True if I created the parade or was given organiser access. */
export const useIsOrganiser = (paradeId: string | undefined): boolean =>
  useStore((s) => {
    if (!paradeId) return false;
    const p = s.parades[paradeId];
    if (!p) return false;
    if (p.organiserId === s.me.id) return true;
    return (s.cars[paradeId] ?? []).some((c) => c.userId === s.me.id && c.isOrganiser);
  });

export const useDraft = (): Parade | undefined => useStore((s) => (s.draftId ? s.parades[s.draftId] : undefined));

/** Every parade I'm involved in, soonest first. */
export const useMyParades = (): { parade: Parade; role: 'hosting' | 'joined'; carCount: number }[] =>
  useStore((s) => {
    const out: { parade: Parade; role: 'hosting' | 'joined'; carCount: number }[] = [];
    for (const p of Object.values(s.parades)) {
      const cars = s.cars[p.id] ?? [];
      const hosting = p.organiserId === s.me.id || cars.some((c) => c.userId === s.me.id && c.isOrganiser);
      const joined = cars.some((c) => c.userId === s.me.id);
      if (!hosting && !joined) continue;
      out.push({ parade: p, role: hosting ? 'hosting' : 'joined', carCount: cars.length });
    }
    return out.sort((a, b) => a.parade.date.localeCompare(b.parade.date));
  });

export const findParadeByCode = (s: { parades: Record<string, Parade> }, code: string): Parade | undefined =>
  Object.values(s.parades).find((p) => p.code.toUpperCase() === code.trim().toUpperCase());

export const leadCar = (cars: Car[]) => cars.find((c) => c.role === 'lead');
export const tailCar = (cars: Car[]) => cars.find((c) => c.role === 'tail');
