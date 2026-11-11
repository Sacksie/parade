import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { goReplace } from '@/components/ui';
import { toISODate } from '@/lib/format';
import type { LiveState, Parade } from '@/types';

/** Re-render every `ms` with the current time. Countdowns derive from timestamps, never accumulate. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Is the parade happening today (local time)? */
export const isParadeToday = (p: Parade, now = Date.now()) => p.date === toISODate(new Date(now));

/**
 * Start sequence: when the organiser starts the countdown, every phone sitting on the hub,
 * arrival check or ready screen jumps to the countdown together.
 */
export function useCountdownRedirect(paradeId: string | undefined, parade: Parade | undefined, live: LiveState | undefined) {
  const endsAt = live?.countdownEndsAt;
  const status = parade?.status;
  // Focus-scoped: the hub stays mounted under /arrive and /ready, and only the top screen should navigate.
  useFocusEffect(
    useCallback(() => {
      if (!paradeId || !endsAt || status === 'live' || status === 'ended') return;
      goReplace('/parade/[id]/countdown', { id: paradeId });
    }, [paradeId, endsAt, status]),
  );
}
