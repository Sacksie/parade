import { MOCK_ROUTE } from '@/data/mockTown';
import { makeCode, toISODate, uid } from '@/lib/format';
import { getState, setState } from '@/store/store';
import type { Announcement, Car, CarPosition, CarRole, HelpKind, HelpRequest, LiveState, Parade, SplitAlert, Stop, Track } from '@/types';

/**
 * Every state change goes through here. Pure, synchronous, no geometry:
 * the simulator / location layer computes positions and calls `updatePositions`.
 */

const touchParade = (id: string, patch: Partial<Parade> | ((p: Parade) => Partial<Parade>)) =>
  setState((s) => {
    const p = s.parades[id];
    if (!p) return s;
    const next = typeof patch === 'function' ? patch(p) : patch;
    return { ...s, parades: { ...s.parades, [id]: { ...p, ...next } } };
  });

const touchCars = (paradeId: string, fn: (cars: Car[]) => Car[]) =>
  setState((s) => ({ ...s, cars: { ...s.cars, [paradeId]: fn(s.cars[paradeId] ?? []) } }));

const touchLive = (paradeId: string, fn: (live: LiveState) => LiveState) =>
  setState((s) => {
    const live = s.live[paradeId];
    if (!live) return s;
    const next = fn(live);
    return next === live ? s : { ...s, live: { ...s.live, [paradeId]: next } };
  });

// ---------- Create wizard ----------

/** Start a new draft (or resume the existing one) and make it the wizard's subject. */
export function beginDraft(): string {
  const s = getState();
  if (s.draftId && s.parades[s.draftId]?.status === 'draft') return s.draftId;
  const id = uid('p');
  const parade: Parade = {
    id,
    code: makeCode(),
    organiserId: s.me.id,
    name: '',
    date: toISODate(new Date(Date.now() + 7 * 86_400_000)),
    arriveAt: '17:15',
    setsOffAt: '17:45',
    joinMode: 'link',
    route: [],
    stops: [],
    tracks: [],
    loopPlaylist: true,
    rightsConfirmed: false,
    organiserPlace: 'lead_passenger',
    reminderDayBefore: true,
    status: 'draft',
    createdAt: Date.now(),
  };
  setState((st) => ({ ...st, draftId: id, parades: { ...st.parades, [id]: parade } }));
  return id;
}

/** Edit an existing parade (draft or published) in the wizard. */
export function editParade(id: string) {
  setState((s) => (s.parades[id] ? { ...s, draftId: id } : s));
}

export function updateParade(id: string, patch: Partial<Parade>) {
  touchParade(id, patch);
}

export function discardDraft(id: string) {
  setState((s) => {
    const p = s.parades[id];
    if (!p || p.status !== 'draft') return { ...s, draftId: null };
    const { [id]: _drop, ...parades } = s.parades;
    return { ...s, draftId: null, parades };
  });
}

export function deleteParade(id: string) {
  setState((s) => {
    const { [id]: _p, ...parades } = s.parades;
    const { [id]: _c, ...cars } = s.cars;
    const { [id]: _l, ...live } = s.live;
    return { ...s, parades, cars, live, draftId: s.draftId === id ? null : s.draftId };
  });
}

export function setRoute(id: string, route: Parade['route']) {
  touchParade(id, { route });
}

export function upsertStop(paradeId: string, stop: Omit<Stop, 'seq'> & { seq?: number }) {
  touchParade(paradeId, (p) => {
    const exists = p.stops.some((st) => st.id === stop.id);
    const stops = exists ? p.stops.map((st) => (st.id === stop.id ? { ...st, ...stop, seq: st.seq } : st)) : [...p.stops, { ...stop, seq: p.stops.length + 1 }];
    return { stops: stops.map((st, i) => ({ ...st, seq: i + 1 })) };
  });
}

export function removeStop(paradeId: string, stopId: string) {
  touchParade(paradeId, (p) => ({ stops: p.stops.filter((st) => st.id !== stopId).map((st, i) => ({ ...st, seq: i + 1 })) }));
}

export function setTracks(paradeId: string, tracks: Track[]) {
  touchParade(paradeId, { tracks: tracks.map((t, i) => ({ ...t, seq: i + 1 })) });
}

export function addTracks(paradeId: string, tracks: Omit<Track, 'seq'>[]) {
  touchParade(paradeId, (p) => ({ tracks: [...p.tracks, ...tracks].map((t, i) => ({ ...t, seq: i + 1 })) }));
}

export function removeTrack(paradeId: string, trackId: string) {
  touchParade(paradeId, (p) => ({ tracks: p.tracks.filter((t) => t.id !== trackId).map((t, i) => ({ ...t, seq: i + 1 })) }));
}

/** Publish: the organiser gets a car row (lead by default) so the crew list has them. */
export function publishParade(id: string) {
  const s = getState();
  const p = s.parades[id];
  if (!p) return;
  touchParade(id, { status: 'published', publishedAt: p.publishedAt ?? Date.now() });
  touchCars(id, (cars) => {
    if (cars.some((c) => c.userId === s.me.id)) return cars;
    const organiserCar: Car = {
      id: uid('car'),
      paradeId: id,
      userId: s.me.id,
      number: 1,
      name: p.organiserPlace === 'base' ? 'Organiser (at base)' : 'Lead car (organisers)',
      phone: s.me.phone,
      role: p.organiserPlace === 'base' ? 'car' : 'lead',
      isOrganiser: true,
      rsvpAt: Date.now(),
      musicProgress: 1,
      soundOk: false,
      locationOn: false,
      screenAwake: false,
    };
    return [organiserCar, ...cars].map((c, i) => ({ ...c, number: i + 1 }));
  });
  setState((st) => ({ ...st, draftId: st.draftId === id ? null : st.draftId }));
}

/** Dev helper for testing the route editor: drop in the mock town route. */
export function useMockRoute(id: string) {
  touchParade(id, { route: MOCK_ROUTE });
}

// ---------- Guests ----------

/** RSVP from the invite page. Returns the car. */
export function joinParade(paradeId: string, name: string, phone?: string): Car {
  const s = getState();
  const existing = (s.cars[paradeId] ?? []).find((c) => c.userId === s.me.id);
  if (existing) {
    touchCars(paradeId, (cars) => cars.map((c) => (c.id === existing.id ? { ...c, name, phone } : c)));
    return { ...existing, name, phone };
  }
  const car: Car = {
    id: uid('car'),
    paradeId,
    userId: s.me.id,
    number: (s.cars[paradeId]?.length ?? 0) + 1,
    name,
    phone,
    role: 'car',
    isOrganiser: false,
    rsvpAt: Date.now(),
    musicProgress: 0,
    soundOk: false,
    locationOn: false,
    screenAwake: false,
  };
  touchCars(paradeId, (cars) => [...cars, car]);
  setState((st) => ({ ...st, me: { ...st.me, phone: phone ?? st.me.phone } }));
  return car;
}

export function leaveParade(paradeId: string) {
  const me = getState().me.id;
  touchCars(paradeId, (cars) => cars.filter((c) => c.userId !== me));
}

export function updateCar(paradeId: string, carId: string, patch: Partial<Car>) {
  touchCars(paradeId, (cars) => cars.map((c) => (c.id === carId ? { ...c, ...patch } : c)));
}

export function checkIn(paradeId: string, carId: string) {
  updateCar(paradeId, carId, { checkedInAt: Date.now(), locationOn: true });
}

/** Give a car a role. Lead and tail are unique: the previous holder goes back to 'car'. */
export function setCarRole(paradeId: string, carId: string, role: CarRole) {
  touchCars(paradeId, (cars) =>
    cars.map((c) => {
      if (c.id === carId) return { ...c, role };
      if (role !== 'car' && c.role === role) return { ...c, role: 'car' };
      return c;
    }),
  );
}

export function setOrganiserAccess(paradeId: string, carId: string, isOrganiser: boolean) {
  updateCar(paradeId, carId, { isOrganiser });
}

export function removeCar(paradeId: string, carId: string) {
  touchCars(paradeId, (cars) => cars.filter((c) => c.id !== carId));
}

// ---------- Live ----------

function emptyLive(paradeId: string): LiveState {
  return {
    paradeId,
    positions: {},
    music: { trackIndex: 0, startedAt: Date.now(), paused: true },
    announcements: [],
    help: [],
    currentStop: null,
    completedStopIds: [],
    split: null,
    mutedLocally: false,
  };
}

/** A4: every phone counts down together. */
export function startCountdown(paradeId: string, seconds = 10) {
  const endsAt = Date.now() + seconds * 1000;
  setState((s) => ({
    ...s,
    live: { ...s.live, [paradeId]: { ...(s.live[paradeId] ?? emptyLive(paradeId)), countdownEndsAt: endsAt } },
  }));
}

/** Zero on the countdown: parade goes live and the playlist starts on the shared clock. */
export function startParade(paradeId: string) {
  const now = Date.now();
  setState((s) => {
    const p = s.parades[paradeId];
    if (!p) return s;
    const live = s.live[paradeId] ?? emptyLive(paradeId);
    return {
      ...s,
      parades: { ...s.parades, [paradeId]: { ...p, status: 'live', liveStartedAt: now } },
      live: { ...s.live, [paradeId]: { ...live, countdownEndsAt: undefined, music: { trackIndex: 0, startedAt: now, paused: false }, leadLastSeenAt: now } },
      stats: { ...s.stats, [paradeId]: { announcements: 0, helpRequests: 0 } },
    };
  });
}

export function endParade(paradeId: string) {
  touchParade(paradeId, { status: 'ended', endedAt: Date.now() });
  touchLive(paradeId, (l) => ({ ...l, music: { ...l.music, paused: true }, split: null, currentStop: null }));
}

/** Called by the simulator or the location layer every tick. */
export function updatePositions(paradeId: string, positions: Record<string, CarPosition>, leadCarId?: string) {
  touchLive(paradeId, (l) => ({
    ...l,
    positions,
    leadLastSeenAt: leadCarId && positions[leadCarId] ? positions[leadCarId].updatedAt : l.leadLastSeenAt,
  }));
}

export function announce(paradeId: string, text: string): Announcement {
  const a: Announcement = { id: uid('ann'), paradeId, text: text.trim(), createdAt: Date.now(), createdBy: getState().me.id };
  setState((s) => {
    const live = s.live[paradeId] ?? emptyLive(paradeId);
    const stats = s.stats[paradeId] ?? { announcements: 0, helpRequests: 0 };
    return {
      ...s,
      live: { ...s.live, [paradeId]: { ...live, announcements: [...live.announcements, a] } },
      stats: { ...s.stats, [paradeId]: { ...stats, announcements: stats.announcements + 1 } },
    };
  });
  return a;
}

export function requestHelp(paradeId: string, carId: string, kind: HelpKind, note?: string): HelpRequest {
  const pos = getState().live[paradeId]?.positions[carId]?.position;
  const h: HelpRequest = { id: uid('help'), paradeId, carId, kind, note, position: pos, status: 'open', createdAt: Date.now() };
  setState((s) => {
    const live = s.live[paradeId] ?? emptyLive(paradeId);
    const stats = s.stats[paradeId] ?? { announcements: 0, helpRequests: 0 };
    return {
      ...s,
      live: { ...s.live, [paradeId]: { ...live, help: [...live.help, h] } },
      stats: { ...s.stats, [paradeId]: { ...stats, helpRequests: stats.helpRequests + 1 } },
    };
  });
  return h;
}

export function setHelpStatus(paradeId: string, helpId: string, status: HelpRequest['status']) {
  touchLive(paradeId, (l) => ({ ...l, help: l.help.map((h) => (h.id === helpId ? { ...h, status } : h)) }));
}

/** Stops are entered by the lead car (simulator / geo layer decides). */
export function enterStop(paradeId: string, stopId: string) {
  touchLive(paradeId, (l) => {
    if (l.currentStop?.stopId === stopId || l.completedStopIds.includes(stopId)) return l;
    const stop = getState().parades[paradeId]?.stops.find((s) => s.id === stopId);
    const music = stop?.pauseMusic && stop.kind === 'stop' ? pauseMusicState(l.music) : l.music;
    return { ...l, currentStop: { stopId, enteredAt: Date.now() }, music };
  });
}

/** Timer ran out, or the organiser moved everyone off early. */
export function leaveStop(paradeId: string) {
  touchLive(paradeId, (l) => {
    if (!l.currentStop) return l;
    const stop = getState().parades[paradeId]?.stops.find((s) => s.id === l.currentStop!.stopId);
    const music = stop?.pauseMusic && stop.kind === 'stop' ? resumeMusicState(l.music) : l.music;
    return { ...l, currentStop: null, completedStopIds: [...l.completedStopIds, l.currentStop.stopId], music };
  });
}

export function setSplit(paradeId: string, split: SplitAlert | null) {
  touchLive(paradeId, (l) => {
    if (l.split === split) return l;
    if (!l.split || !split) return { ...l, split };
    const same = l.split.frontCarId === split.frontCarId && l.split.behindCarId === split.behindCarId;
    // Same gap: keep the original detection time so "x min ago" stays honest, but refresh the distance.
    return same ? { ...l, split: { ...split, detectedAt: l.split.detectedAt } } : { ...l, split };
  });
}

// ---------- Music (shared clock) ----------

function pauseMusicState(m: LiveState['music']): LiveState['music'] {
  if (m.paused) return m;
  return { ...m, paused: true, pausedAtS: (Date.now() - m.startedAt) / 1000 };
}

function resumeMusicState(m: LiveState['music']): LiveState['music'] {
  if (!m.paused) return m;
  return { ...m, paused: false, startedAt: Date.now() - (m.pausedAtS ?? 0) * 1000, pausedAtS: undefined };
}

export function pauseMusic(paradeId: string) {
  touchLive(paradeId, (l) => ({ ...l, music: pauseMusicState(l.music) }));
}

export function resumeMusic(paradeId: string) {
  touchLive(paradeId, (l) => ({ ...l, music: resumeMusicState(l.music) }));
}

export function toggleMusic(paradeId: string) {
  touchLive(paradeId, (l) => ({ ...l, music: l.music.paused ? resumeMusicState(l.music) : pauseMusicState(l.music) }));
}

/** Jump to a track for every car. Wraps when looping. */
export function skipTrack(paradeId: string, delta = 1) {
  const p = getState().parades[paradeId];
  if (!p || p.tracks.length === 0) return;
  touchLive(paradeId, (l) => {
    let idx = l.music.trackIndex + delta;
    if (idx >= p.tracks.length) idx = p.loopPlaylist ? 0 : p.tracks.length - 1;
    if (idx < 0) idx = p.loopPlaylist ? p.tracks.length - 1 : 0;
    return { ...l, music: { trackIndex: idx, startedAt: Date.now(), paused: l.music.paused, pausedAtS: l.music.paused ? 0 : undefined } };
  });
}

export function toggleMuteLocally(paradeId: string) {
  touchLive(paradeId, (l) => ({ ...l, mutedLocally: !l.mutedLocally }));
}

// ---------- Me ----------

export function updateMe(patch: Partial<{ name: string; phone: string }>) {
  setState((s) => ({ ...s, me: { ...s.me, ...patch } }));
}
