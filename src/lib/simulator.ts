import { useEffect } from 'react';

import { detectSplit, destination, distanceM, headingAtProgress, orderCars, pointAtProgress, routeLengthM, stopProgress } from '@/lib/geo';
import { enterStop, leaveStop, requestHelp, setHelpStatus, setSplit, updatePositions } from '@/store/actions';
import { getState } from '@/store/store';
import type { Car, CarPosition } from '@/types';

/**
 * Demo convoy driver: moves every checked-in car along the route once a second so every live
 * screen works without GPS. Reads state with getState() and writes only through store actions.
 *
 * Scripted (tick numbers divide by timeScale):
 *  - tick 90: car 40 (or the middle car) is held at the lights for 90 s → the convoy splits.
 *  - tick 180: car 7 breaks down for good and asks for help. If the organiser sends the tail car,
 *    it drives back to it over ~20 s, then both rejoin and the request is resolved.
 */

const TICK_MS = 1000;
const kmh = (v: number) => v / 3.6;
const LEAD_KMH = 15;
const DRIVE_PAST_KMH = 8;
const FOLLOW_KMH = 20;
const CATCH_UP_KMH = 30;
const SPACING_M = 12;
const HOLD_TICK = 90;
/** Long enough that the gap passes the 300 m split threshold at 15 km/h. */
const HOLD_S = 120;
const BREAKDOWN_TICK = 180;
const OFF_ROUTE_S = 25;
const RESCUE_S = 20;

type SimCar = {
  progressM: number;
  speedMps: number;
  /** Fixed sideways nudge so dots don't overlap exactly (≤ 3 m). */
  jitterM: number;
  /** Preferred gap to the car in front, 12–18 m. */
  gapM: number;
  heldUntilTick?: number;
  broken?: boolean;
  offRouteUntilTick?: number;
  /** Driving back up to the convoy after a rescue; left out of split detection meanwhile. */
  rejoining?: boolean;
};

type Rescue = { helpId: string; brokenId: string; tailId: string; fromM: number; startTick: number };

type Sim = {
  paradeId: string;
  timer: ReturnType<typeof setInterval> | null;
  tick: number;
  timeScale: number;
  cars: Map<string, SimCar>;
  refs: number;
  heldDone: boolean;
  breakdownDone: boolean;
  rescue: Rescue | null;
  rescued: Set<string>;
};

const sims = new Map<string, Sim>();

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Lead first, then by car number, tail last. Only cars that have checked in take part. */
function convoyOrder(cars: Car[]): Car[] {
  const rank = (c: Car) => (c.role === 'lead' ? 0 : c.role === 'tail' ? 2 : 1);
  return cars.filter((c) => c.checkedInAt != null).sort((a, b) => rank(a) - rank(b) || a.number - b.number);
}

function seed(sim: Sim, order: Car[], routeLen: number) {
  const n = order.length;
  const queue = (n - 1) * SPACING_M;
  const stack = queue > routeLen * 0.5;
  order.forEach((c, i) => {
    if (sim.cars.has(c.id)) return;
    const behindLast = Math.min(...[...sim.cars.values()].map((s) => s.progressM), Infinity);
    const progressM = sim.tick > 0 && Number.isFinite(behindLast) ? Math.max(0, behindLast - SPACING_M) : stack ? 0 : queue - i * SPACING_M;
    sim.cars.set(c.id, { progressM, speedMps: 0, jitterM: rand(-3, 3), gapM: rand(12, 18) });
  });
}

function step(sim: Sim) {
  const s = getState();
  const parade = s.parades[sim.paradeId];
  if (!parade || parade.status === 'ended' || parade.status === 'draft') return stopSimulation(sim.paradeId);
  const live = s.live[sim.paradeId];
  if (parade.status !== 'live' || !live || parade.route.length < 2) return; // waiting for the start

  sim.tick += 1;
  const tick = sim.tick;
  const dt = sim.timeScale; // simulated seconds per tick
  const route = parade.route;
  const routeLen = routeLengthM(route);
  const order = convoyOrder(s.cars[sim.paradeId] ?? []);
  if (order.length === 0) return;
  seed(sim, order, routeLen);
  const lead = order[0];
  const tail = order.length > 1 && order[order.length - 1].role === 'tail' ? order[order.length - 1] : null;

  // ---- Scripted events
  if (!sim.heldDone && tick >= Math.round(HOLD_TICK / sim.timeScale)) {
    sim.heldDone = true;
    const victim = order.find((c) => c.number === 40 && c.role === 'car') ?? order[Math.floor(order.length / 2)];
    const sc = victim && victim.id !== lead.id ? sim.cars.get(victim.id) : undefined;
    if (sc) sc.heldUntilTick = tick + Math.round(HOLD_S / sim.timeScale);
  }
  if (!sim.breakdownDone && tick >= Math.round(BREAKDOWN_TICK / sim.timeScale)) {
    sim.breakdownDone = true;
    const victim = order.find((c) => c.number === 7 && c.role === 'car');
    if (victim) breakDown(sim, victim.id);
  }

  // ---- Tail rescue
  if (!sim.rescue && tail) {
    const sent = live.help.find((h) => h.status === 'tail_sent' && sim.cars.get(h.carId)?.broken && !sim.rescued.has(h.id));
    const tailSim = sim.cars.get(tail.id);
    if (sent && tailSim) sim.rescue = { helpId: sent.id, brokenId: sent.carId, tailId: tail.id, fromM: tailSim.progressM, startTick: tick };
  }

  // ---- Stops (triggered by the lead)
  const leadSim = sim.cars.get(lead.id)!;
  const leadPos = pointAtProgress(route, leadSim.progressM);
  const current = live.currentStop ? parade.stops.find((st) => st.id === live.currentStop!.stopId) : undefined;
  if (current && live.currentStop) {
    const elapsedS = (Date.now() - live.currentStop.enteredAt) / 1000;
    const holdS = current.kind === 'stop' ? (current.durationMin * 60) / sim.timeScale : 8;
    if (elapsedS >= holdS) leaveStop(sim.paradeId);
  } else {
    const hit = parade.stops.find((st) => !live.completedStopIds.includes(st.id) && distanceM(leadPos, st.position) <= st.radiusM);
    if (hit) enterStop(sim.paradeId, hit.id);
  }
  const atStop = current?.kind === 'stop';

  // ---- Move the lead
  let leadKmh = LEAD_KMH * rand(0.9, 1.1);
  const ahead = parade.stops.filter((st) => st.kind === 'drive_past' && !live.completedStopIds.includes(st.id));
  for (const st of ahead) {
    const d = stopProgress(route, st) - leadSim.progressM;
    if (d > -st.radiusM && d < 150) leadKmh = DRIVE_PAST_KMH;
  }
  if (atStop || leadSim.progressM >= routeLen) leadKmh = 0;
  move(leadSim, Math.min(routeLen, leadSim.progressM + kmh(leadKmh) * dt), dt);

  // ---- Everyone else follows whoever is physically in front of them (so a car that dropped
  // back, e.g. after a breakdown, rejoins at the back instead of holding everyone up).
  const rankOf = new Map(order.map((c, i) => [c.id, i]));
  const chain = order.slice(1).sort((a, b) => sim.cars.get(b.id)!.progressM - sim.cars.get(a.id)!.progressM || rankOf.get(a.id)! - rankOf.get(b.id)!);
  let front: SimCar = leadSim;
  for (const c of chain) {
    const sc = sim.cars.get(c.id)!;
    if (sim.rescue && (c.id === sim.rescue.tailId || c.id === sim.rescue.brokenId)) continue;
    if (sc.broken) continue;
    if (sc.heldUntilTick != null && tick < sc.heldUntilTick) {
      move(sc, sc.progressM, dt);
      front = sc;
      continue;
    }
    const want = Math.max(0, front.progressM - sc.gapM);
    const gap = want - sc.progressM;
    const vmax = kmh(gap > 60 ? CATCH_UP_KMH : FOLLOW_KMH) * dt;
    move(sc, sc.progressM + Math.max(0, Math.min(gap, vmax)), dt);
    if (sc.rejoining && gap <= 60) sc.rejoining = false;
    if (Math.random() < 0.05) sc.gapM = rand(12, 18);
    front = sc;
  }

  // ---- Rescue run: tail drives back to the broken car over ~20 s, then both rejoin
  if (sim.rescue) {
    const r = sim.rescue;
    const tailSim = sim.cars.get(r.tailId);
    const brokenSim = sim.cars.get(r.brokenId);
    if (!tailSim || !brokenSim) sim.rescue = null;
    else {
      const t = Math.min(1, (tick - r.startTick) / (RESCUE_S / sim.timeScale));
      move(tailSim, r.fromM + (brokenSim.progressM - SPACING_M - r.fromM) * t, dt);
      if (t >= 1 && tick - r.startTick > (RESCUE_S + 10) / sim.timeScale) {
        brokenSim.broken = false;
        brokenSim.rejoining = true;
        tailSim.rejoining = true;
        sim.rescued.add(r.helpId);
        setHelpStatus(sim.paradeId, r.helpId, 'resolved');
        sim.rescue = null;
      }
    }
  }

  // ---- Publish
  const now = Date.now();
  const positions: Record<string, CarPosition> = {};
  for (const c of order) {
    const sc = sim.cars.get(c.id)!;
    const on = pointAtProgress(route, sc.progressM);
    const off = sc.offRouteUntilTick != null && tick < sc.offRouteUntilTick ? 60 : 0;
    const side = sc.broken ? 5 : sc.jitterM;
    const position = destination(on, headingAtProgress(route, sc.progressM) + 90, side + off);
    positions[c.id] = { carId: c.id, position, progressM: sc.progressM, offRouteM: off, speedMps: sc.speedMps, updatedAt: now };
  }
  updatePositions(sim.paradeId, positions, lead.id);

  const healthy: Record<string, CarPosition> = {};
  for (const id in positions) {
    const sc = sim.cars.get(id);
    if (sc?.broken || sc?.rejoining || id === sim.rescue?.tailId) continue;
    healthy[id] = positions[id];
  }
  setSplit(sim.paradeId, detectSplit(orderCars(healthy), 300, route));
}

function move(sc: SimCar, toM: number, dt: number) {
  sc.speedMps = Math.max(0, toM - sc.progressM) / dt;
  sc.progressM = Math.max(0, toM);
}

function breakDown(sim: Sim, carId: string) {
  const sc = sim.cars.get(carId);
  if (!sc || sc.broken) return;
  sc.broken = true;
  sc.speedMps = 0;
  const live = getState().live[sim.paradeId];
  if (!live?.help.some((h) => h.carId === carId && h.status !== 'resolved')) requestHelp(sim.paradeId, carId, 'breakdown');
}

// ---------- Public API ----------

/** Start driving the demo convoy. Safe to call twice. */
export function startSimulation(paradeId: string, opts?: { timeScale?: number }) {
  let sim = sims.get(paradeId);
  if (!sim) {
    sim = { paradeId, timer: null, tick: 0, timeScale: 1, cars: new Map(), refs: 0, heldDone: false, breakdownDone: false, rescue: null, rescued: new Set() };
    sims.set(paradeId, sim);
  }
  if (opts?.timeScale) sim.timeScale = Math.max(0.1, opts.timeScale);
  if (!sim.timer) {
    const s = sim;
    s.timer = setInterval(() => step(s), TICK_MS);
  }
}

/** Stop and forget the simulation (positions stay where they were). */
export function stopSimulation(paradeId: string) {
  const sim = sims.get(paradeId);
  if (!sim) return;
  if (sim.timer) clearInterval(sim.timer);
  sims.delete(paradeId);
}

export const isSimulating = (paradeId: string) => !!sims.get(paradeId)?.timer;

/** Current simulator speed for a parade (1 when not running). */
export function getTimeScale(paradeId: string): number {
  return sims.get(paradeId)?.timeScale ?? 1;
}

export function setTimeScale(paradeId: string, n: number) {
  const sim = sims.get(paradeId);
  if (sim) sim.timeScale = Math.max(0.1, n);
}

/** Push a car 60 m off the line for 25 s, then let it return. */
export function simulateOffRoute(paradeId: string, carId: string) {
  const sim = sims.get(paradeId);
  const sc = sim?.cars.get(carId);
  if (sim && sc) sc.offRouteUntilTick = sim.tick + Math.round(OFF_ROUTE_S / sim.timeScale);
}

/** Stop a car for good and raise a breakdown help request. */
export function simulateBreakdown(paradeId: string, carId: string) {
  const sim = sims.get(paradeId);
  if (sim) breakDown(sim, carId);
}

/**
 * Run the simulation while a screen is mounted and `enabled` is true. Several screens can hold it
 * at once; it stops when the last one lets go.
 */
export function useSimulation(paradeId: string | undefined, enabled: boolean, opts?: { timeScale?: number }) {
  const timeScale = opts?.timeScale;
  useEffect(() => {
    if (!paradeId || !enabled) return;
    startSimulation(paradeId, { timeScale });
    const sim = sims.get(paradeId)!;
    sim.refs += 1;
    return () => {
      const cur = sims.get(paradeId);
      if (cur !== sim) return;
      cur.refs -= 1;
      if (cur.refs <= 0) stopSimulation(paradeId);
    };
  }, [paradeId, enabled, timeScale]);
}
