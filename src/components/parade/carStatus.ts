import type { Tone } from '@/components/ui';
import type { Car } from '@/types';

export type CarStatus = { label: string; tone: Tone };

/** One-word readiness for list rows: problems first, then "Here", then the music download. */
export function carStatus(car: Car): CarStatus {
  if (car.checkedInAt) {
    if (car.musicProgress < 1) return { label: `Music ${Math.round(car.musicProgress * 100)}%`, tone: 'indigo' };
    if (!car.soundOk) return { label: 'No sound', tone: 'warn' };
    return { label: 'Here', tone: 'mint' };
  }
  if (car.musicProgress < 1) return { label: `Music ${Math.round(car.musicProgress * 100)}%`, tone: 'indigo' };
  return { label: 'Music saved', tone: 'neutral' };
}

/** Checked in but not ready to roll: no sound check, or music still downloading. */
export const needsAttention = (car: Car) => !!car.checkedInAt && (!car.soundOk || car.musicProgress < 1);

export const roleLetter = (car: Car): 'L' | 'T' | 'O' | null =>
  car.role === 'lead' ? 'L' : car.role === 'tail' ? 'T' : car.isOrganiser ? 'O' : null;
