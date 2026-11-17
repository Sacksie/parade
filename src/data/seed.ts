import { MOCK_MEETING_POINT, MOCK_ROUTE, MOCK_STOPS } from '@/data/mockTown';
import { msToHHMM, toISODate } from '@/lib/format';
import type { Car, LiveState, Me, Parade, Track } from '@/types';

/**
 * Demo data so every screen is reachable without a backend:
 *  - "Chanukah Car Parade": you're the organiser, it's published, 71 cars, happening today.
 *  - "Menorah Lights Drive": your draft, only the basics filled in.
 *  - "Borehamwood Menorah Parade": you joined as car 42 of 87.
 */

export const ME: Me = { id: 'user-me', name: 'Gavriel', phone: '07700 900123' };

const FAMILIES = [
  'The Cohen family', 'Goldbergs', 'The Levy family', 'Team Katz', 'The Shapiro family', 'Friedmans', 'The Adler family',
  'Weiss family', 'The Berger family', 'Rosen crew', 'The Kaplan family', 'Schwartz family', 'The Klein family', 'Grossman family',
  'The Feldman family', 'Stern family', 'The Roth family', 'Blum family', 'The Weinberg family', 'Horowitz family',
  'The Segal family', 'Gordon family', 'The Marks family', 'Newman family', 'The Wolf family', 'Fine family', 'The Harris family',
  'Baum family', 'The Lipman family', 'Salter family', 'The Green family', 'Jacobs family', 'The Hyman family', 'Isaacs family',
  'The Ross family', 'Bloom family', 'The Fisher family', 'Mendel family', 'The Perlman family', 'Rubin family',
];

const seedName = (i: number) => (i < FAMILIES.length ? FAMILIES[i] : `${FAMILIES[i % FAMILIES.length]} ${Math.floor(i / FAMILIES.length) + 1}`);

const TRACK_TITLES = [
  'Maoz Tzur', 'Chanukah Oh Chanukah', 'Sevivon Sov Sov Sov', 'Al Hanisim', 'Mi Yimalel', 'Haneirot Halalu', 'Ocho Kandelikas',
  'Light One Candle', 'Latke Song', 'Dreidel Medley', 'Oseh Shalom',
];

const makeTracks = (): Track[] =>
  TRACK_TITLES.map((title, i) => ({
    id: `trk-${i + 1}`,
    seq: i + 1,
    title,
    durationS: 150 + ((i * 37) % 90),
    sizeBytes: 3_200_000 + ((i * 911_000) % 2_400_000),
  }));

function makeCars(paradeId: string, count: number, opts: { myNumber?: number; myRole?: Car['role']; myIsOrganiser?: boolean; checkedIn: number }): Car[] {
  const cars: Car[] = [];
  for (let i = 1; i <= count; i++) {
    const mine = i === opts.myNumber;
    const checkedIn = i <= opts.checkedIn;
    cars.push({
      id: `${paradeId}-car-${i}`,
      paradeId,
      userId: mine ? ME.id : `user-${paradeId}-${i}`,
      number: i,
      name: mine ? (opts.myIsOrganiser ? 'Lead car (organisers)' : 'The Sacks family') : seedName(i - 1),
      phone: `07700 9${String(10000 + i * 7).slice(-5)}`,
      role: mine ? opts.myRole ?? 'car' : 'car',
      isOrganiser: mine ? !!opts.myIsOrganiser : false,
      rsvpAt: Date.now() - (count - i) * 3_600_000 * 5,
      checkedInAt: checkedIn ? Date.now() - (opts.checkedIn - i) * 60_000 : undefined,
      musicProgress: i === 19 ? 0.4 : i % 17 === 0 ? 0.8 : 1,
      soundOk: checkedIn && i !== 7 && i % 11 !== 0,
      locationOn: checkedIn,
      screenAwake: checkedIn,
    });
  }
  return cars;
}

export function seedState() {
  const now = Date.now();
  const today = toISODate(new Date(now));

  const hendon: Parade = {
    id: 'p-hendon',
    code: 'HEND26',
    organiserId: ME.id,
    name: 'Chanukah Car Parade',
    host: 'Hendon Shul',
    date: today,
    arriveAt: msToHHMM(now + 15 * 60_000),
    setsOffAt: msToHHMM(now + 25 * 60_000),
    joinMode: 'link',
    meetingPoint: MOCK_MEETING_POINT,
    meetingName: 'Leisure Centre car park, Church Road',
    meetingNotes: 'Enter from Church Road. Park in rows facing the exit, in the order you arrive.',
    route: MOCK_ROUTE,
    stops: MOCK_STOPS,
    tracks: makeTracks(),
    loopPlaylist: true,
    rightsConfirmed: true,
    organiserPlace: 'lead_passenger',
    reminderDayBefore: true,
    closingMessage: 'Thank you for lighting up Hendon tonight. Drive home safely and chag sameach!',
    status: 'published',
    createdAt: now - 14 * 86_400_000,
    publishedAt: now - 10 * 86_400_000,
  };

  const draft: Parade = {
    id: 'p-draft',
    code: 'MENO26',
    organiserId: ME.id,
    name: 'Menorah Lights Drive',
    host: 'Edgware Community',
    date: '2026-12-06',
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
    createdAt: now - 86_400_000,
  };

  const joined: Parade = {
    id: 'p-boreham',
    code: 'BORE26',
    organiserId: 'user-boreham-org',
    name: 'Borehamwood Menorah Parade',
    host: 'Borehamwood Youth',
    date: '2026-12-09',
    arriveAt: '17:30',
    setsOffAt: '18:00',
    joinMode: 'link',
    meetingPoint: MOCK_MEETING_POINT,
    meetingName: 'Leisure Centre car park',
    meetingNotes: 'Enter from Church Road and follow the marshals.',
    route: MOCK_ROUTE,
    stops: MOCK_STOPS,
    tracks: makeTracks(),
    loopPlaylist: true,
    rightsConfirmed: true,
    organiserPlace: 'lead_passenger',
    reminderDayBefore: true,
    closingMessage: 'Thanks for coming. See you next year!',
    status: 'published',
    createdAt: now - 20 * 86_400_000,
    publishedAt: now - 18 * 86_400_000,
  };

  const hendonCars = makeCars(hendon.id, 71, { myNumber: 1, myRole: 'lead', myIsOrganiser: true, checkedIn: 64 });
  const borehamCars = makeCars(joined.id, 87, { myNumber: 42, myRole: 'car', checkedIn: 0 });
  // The Borehamwood organiser's car leads; give it a tail too.
  borehamCars[0] = { ...borehamCars[0], name: 'Lead car (organisers)', role: 'lead', isOrganiser: true, userId: 'user-boreham-org' };
  borehamCars[86] = { ...borehamCars[86], role: 'tail' };

  return {
    me: ME,
    parades: { [hendon.id]: hendon, [draft.id]: draft, [joined.id]: joined } as Record<string, Parade>,
    cars: { [hendon.id]: hendonCars, [joined.id]: borehamCars } as Record<string, Car[]>,
    live: {} as Record<string, LiveState>,
    draftId: null as string | null,
    stats: {} as Record<string, { announcements: number; helpRequests: number }>,
  };
}
