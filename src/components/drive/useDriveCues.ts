import { useEffect, useRef } from 'react';

import { success, tap, warning } from '@/components/ui';
import { speak } from '@/lib/speech';

import type { DriveModel } from './useDriveModel';

/** Spoken and haptic cues for drive mode. Each fires once per event, never on mount for old state. */
export function useDriveCues(m: DriveModel) {
  // Haptic on each new turn instruction (not the one showing when the screen opens).
  const turnKey = m.next ? `${Math.round(m.next.atM)}|${m.next.instruction}` : 'none';
  const lastTurn = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (lastTurn.current !== undefined && lastTurn.current !== turnKey) tap();
    lastTurn.current = turnKey;
  }, [turnKey]);

  // L5: once per off-route episode.
  const road = m.back?.road;
  const spokeOff = useRef(false);
  useEffect(() => {
    if (!m.offRoute) {
      spokeOff.current = false;
      return;
    }
    if (spokeOff.current) return;
    spokeOff.current = true;
    warning();
    speak(`You're off the route. Head back to ${road ?? 'the route'}.`);
  }, [m.offRoute, road]);

  // L2: once per new split, lead car only.
  const splitKey = m.isLead && m.split ? `${m.split.frontCarId}|${m.split.behindCarId}` : null;
  const lastSplit = useRef<string | null>(null);
  useEffect(() => {
    if (splitKey && splitKey !== lastSplit.current) {
      warning();
      speak('Slow down, the convoy has split', { interrupt: true });
    }
    lastSplit.current = splitKey;
  }, [splitKey]);

  // L4: read the arrival message on entering a stop, chime 30 s before moving off.
  const stop = m.current;
  const stopId = stop?.id ?? null;
  const arrival = stop?.arrivalMessage;
  const readStop = useRef<string | null>(null);
  useEffect(() => {
    if (!stopId || readStop.current === stopId) return;
    readStop.current = stopId;
    if (arrival) speak(arrival);
  }, [stopId, arrival]);

  const chimeDue = !!stop && stop.kind === 'stop' && stop.durationMin * 60 > 30 && m.stopRemainingS > 0 && m.stopRemainingS <= 30;
  const chimed = useRef<string | null>(null);
  useEffect(() => {
    if (!chimeDue || !stopId || chimed.current === stopId) return;
    chimed.current = stopId;
    success();
    speak('Moving off in 30 seconds');
  }, [chimeDue, stopId]);
}
