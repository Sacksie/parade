import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { bearingDeg, distanceM } from '@/lib/geo';
import type { LatLng } from '@/types';

/**
 * Foreground GPS for this phone (expo-location; the browser Geolocation API on web).
 * Nothing runs at import time. Background tracking is a later, native-only concern.
 */

export type MyLocationStatus = 'idle' | 'asking' | 'granted' | 'denied' | 'unavailable';
export type MyLocation = { position: LatLng | null; heading: number | null; status: MyLocationStatus };

const IDLE: MyLocation = { position: null, heading: null, status: 'idle' };

/** Watch my position while `enabled`. Heading comes from the GPS, or from the last move when it has none. */
export function useMyLocation(enabled: boolean): MyLocation {
  const [state, setState] = useState<MyLocation>({ ...IDLE, status: 'asking' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;
    let last: LatLng | null = null;

    const run = async () => {
      setState((s) => (s.status === 'asking' ? s : { ...s, status: 'asking' }));
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (perm.status !== Location.PermissionStatus.GRANTED) {
          setState({ position: null, heading: null, status: 'denied' });
          return;
        }
        setState((s) => ({ ...s, status: 'granted' }));
        const watch = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 2000 },
          (loc) => {
            const position = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            const gpsHeading = loc.coords.heading;
            let heading: number | null = gpsHeading != null && gpsHeading >= 0 ? gpsHeading : null;
            if (heading == null && last && distanceM(last, position) > 3) heading = bearingDeg(last, position);
            last = position;
            setState((s) => ({ position, heading: heading ?? s.heading, status: 'granted' }));
          },
          () => {
            if (!cancelled) setState((s) => ({ ...s, status: 'unavailable' }));
          },
        );
        if (cancelled) watch.remove();
        else sub = watch;
      } catch {
        if (!cancelled) setState((s) => ({ ...s, status: 'unavailable' }));
      }
    };
    run();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return enabled ? state : IDLE;
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

const toPermission = (s: Location.PermissionStatus): PermissionState =>
  s === Location.PermissionStatus.GRANTED ? 'granted' : s === Location.PermissionStatus.DENIED ? 'denied' : 'undetermined';

/** Current foreground location permission, and a way to ask for it (A1 arrival check). */
export function usePermissionStatus(): { status: PermissionState; request: () => Promise<PermissionState> } {
  const [status, setStatus] = useState<PermissionState>('undetermined');

  useEffect(() => {
    let cancelled = false;
    Location.getForegroundPermissionsAsync()
      .then((r) => {
        if (!cancelled) setStatus(toPermission(r.status));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const request = async (): Promise<PermissionState> => {
    try {
      const r = await Location.requestForegroundPermissionsAsync();
      const next = toPermission(r.status);
      setStatus(next);
      return next;
    } catch {
      setStatus('denied');
      return 'denied';
    }
  };

  return { status, request };
}
