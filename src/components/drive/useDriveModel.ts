import { useEffect, useMemo, useState } from 'react';

import type { MapCar } from '@/components/map/MapCanvas';
import { roadNameAt } from '@/data/mockTown';
import {
  angleDiff,
  bearingDeg,
  distanceM,
  headingAtProgress,
  isOffRoute,
  nextStop,
  nextTurn,
  OFF_ROUTE_M,
  orderCars,
  projectOnRoute,
  turnList,
  type Turn,
} from '@/lib/geo';
import { useCars, useLive, useMyCar, useParade } from '@/store/selectors';
import type { CarPosition, LatLng, Stop } from '@/types';

export type DriveState = 'stop' | 'offroute' | 'lead' | 'drive';

const EMPTY_ROUTE: LatLng[] = [];
const EMPTY_STOPS: Stop[] = [];
const EMPTY_POS: Record<string, CarPosition> = {};
/** ETA fallback when my car is standing still. */
const FALLBACK_MPS = 15 / 3.6;

/** Turn kind → banner icon. The folded start line reads "Leave car park, right onto …". */
export function turnIcon(t: Turn | null): 'turnLeft' | 'turnRight' | 'straight' | 'flag' {
  if (!t) return 'flag';
  if (t.kind === 'left') return 'turnLeft';
  if (t.kind === 'right') return 'turnRight';
  if (t.kind === 'finish') return 'flag';
  if (/\bleft\b/i.test(t.instruction)) return 'turnLeft';
  if (/\bright\b/i.test(t.instruction)) return 'turnRight';
  return 'straight';
}

/** Everything drive mode shows, derived from the live state once a second. */
export function useDriveModel(id: string) {
  const parade = useParade(id);
  const live = useLive(id);
  const cars = useCars(id);
  const myCar = useMyCar(id);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const route = parade?.route ?? EMPTY_ROUTE;
  const stops = parade?.stops ?? EMPTY_STOPS;
  const turns = useMemo(() => turnList(route, stops), [route, stops]);
  const positions = live?.positions ?? EMPTY_POS;
  const me = myCar ? positions[myCar.id] : undefined;
  const progressM = me?.progressM ?? 0;
  const offRouteM = me?.offRouteM ?? 0;

  // Off route = > 40 m away for > 10 s. Track when this episode began (derived state, set in render).
  const far = offRouteM > OFF_ROUTE_M;
  const [offSince, setOffSince] = useState<number | null>(null);
  if (far && offSince == null) setOffSince(now);
  if (!far && offSince != null) setOffSince(null);
  const offRoute = !!me && isOffRoute(offRouteM, offSince, now);

  const heading = headingAtProgress(route, progressM);
  const speed = me && me.speedMps > 0.5 ? me.speedMps : FALLBACK_MPS;
  const next = nextTurn(turns, progressM);
  const toNextM = next ? Math.max(0, next.atM - progressM) : 0;
  const completed = live?.completedStopIds ?? [];
  const upcoming = nextStop(stops, route, progressM, completed);
  const stopEtaS = upcoming ? upcoming.distanceM / speed : 0;

  // Convoy order, front first.
  const order = orderCars(positions);
  const myIndex = myCar ? order.findIndex((p) => p.carId === myCar.id) : -1;
  const total = order.length || cars.length;
  const rank = myIndex >= 0 ? myIndex + 1 : myCar?.number ?? 0;
  const behind = myIndex >= 0 ? order.length - 1 - myIndex : 0;
  const convoyM = order.length > 1 ? order[0].progressM - order[order.length - 1].progressM : 0;

  const byId = new Map(cars.map((c) => [c.id, c]));
  const mapCars: MapCar[] = order.map((p) => ({
    id: p.carId,
    position: p.position,
    role: byId.get(p.carId)?.role ?? 'car',
    isMe: p.carId === myCar?.id,
  }));

  // L5: the nearest point on the line and which way to turn to reach it.
  let back: { distanceM: number; road: string; icon: 'turnLeft' | 'turnRight' | 'straight' } | null = null;
  if (offRoute && me) {
    const proj = projectOnRoute(route, me.position);
    // Mock-town road names; real maps will give this from the directions API.
    const road = roadNameAt(proj.point) ?? next?.road ?? 'the route';
    const turn = angleDiff(heading, bearingDeg(me.position, proj.point));
    back = { distanceM: distanceM(me.position, proj.point), road, icon: turn > 30 ? 'turnRight' : turn < -30 ? 'turnLeft' : 'straight' };
  }

  const current = live?.currentStop ? stops.find((s) => s.id === live.currentStop!.stopId) ?? null : null;
  const stopElapsedS = live?.currentStop ? Math.max(0, (now - live.currentStop.enteredAt) / 1000) : 0;
  const stopRemainingS = current ? Math.max(0, current.durationMin * 60 - stopElapsedS) : 0;

  const split = live?.split ?? null;
  const splitFront = split ? byId.get(split.frontCarId) : undefined;
  const splitHeld = split ? order.filter((p) => p.progressM <= (positions[split.behindCarId]?.progressM ?? -1)).length : 0;

  const myHelp = myCar ? [...(live?.help ?? [])].reverse().find((h) => h.carId === myCar.id && h.status !== 'resolved') ?? null : null;
  const anns = live?.announcements ?? [];
  const lastAnnouncement = anns.length ? anns[anns.length - 1] : null;

  const isLead = myCar?.role === 'lead';
  const state: DriveState = current ? 'stop' : offRoute ? 'offroute' : isLead ? 'lead' : 'drive';

  return {
    now,
    parade,
    live,
    myCar,
    me,
    route,
    stops,
    progressM,
    heading,
    offRoute,
    next,
    toNextM,
    upcoming,
    stopEtaS,
    rank,
    total,
    behind,
    convoyM,
    mapCars,
    back,
    current,
    stopRemainingS,
    split,
    splitFrontNumber: splitFront?.number,
    splitHeld,
    myHelp,
    lastAnnouncement,
    isLead,
    state,
  };
}

export type DriveModel = ReturnType<typeof useDriveModel>;
