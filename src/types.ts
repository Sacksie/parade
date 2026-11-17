/** Domain model. Mirrors docs/design/README.md §5 so it maps 1:1 onto Supabase later. */

export type LatLng = { lat: number; lng: number };

export type JoinMode = 'link' | 'approve';
export type ParadeStatus = 'draft' | 'published' | 'live' | 'ended';
/** Where the organiser says they'll be on the night. */
export type OrganiserPlace = 'lead_passenger' | 'driving' | 'base';
export type StopKind = 'stop' | 'drive_past';
export type CarRole = 'car' | 'lead' | 'tail';
export type HelpKind = 'breakdown' | 'lost' | 'medical' | 'other';

export type Stop = {
  id: string;
  seq: number;
  name: string;
  kind: StopKind;
  /** Minutes the convoy stays. 0 for drive-past. */
  durationMin: number;
  position: LatLng;
  /** Stop triggers when the lead car enters this circle. */
  radiusM: number;
  pauseMusic: boolean;
  arrivalMessage: string;
};

export type Track = {
  id: string;
  seq: number;
  title: string;
  durationS: number;
  sizeBytes: number;
  /** Local file URI once picked / downloaded. */
  uri?: string;
};

export type Parade = {
  id: string;
  /** Short join code, e.g. "HEND26". Also the deep-link path. */
  code: string;
  organiserId: string;
  name: string;
  host?: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  /** HH:MM, 24h. */
  arriveAt: string;
  setsOffAt: string;
  finishAt?: string;
  joinMode: JoinMode;
  meetingPoint?: LatLng;
  meetingName?: string;
  meetingNotes?: string;
  /** One fixed polyline every car navigates against. */
  route: LatLng[];
  stops: Stop[];
  tracks: Track[];
  loopPlaylist: boolean;
  rightsConfirmed: boolean;
  organiserPlace: OrganiserPlace;
  reminderDayBefore: boolean;
  closingMessage?: string;
  status: ParadeStatus;
  createdAt: number;
  publishedAt?: number;
  liveStartedAt?: number;
  endedAt?: number;
};

export type Car = {
  id: string;
  paradeId: string;
  userId: string;
  /** Position in the sign-up order, 1-based. Shown as "Car 07". */
  number: number;
  name: string;
  phone?: string;
  role: CarRole;
  isOrganiser: boolean;
  rsvpAt: number;
  checkedInAt?: number;
  /** 0..1 share of the playlist saved on the phone. */
  musicProgress: number;
  soundOk: boolean;
  locationOn: boolean;
  screenAwake: boolean;
};

export type Announcement = {
  id: string;
  paradeId: string;
  text: string;
  createdAt: number;
  createdBy: string;
};

export type HelpRequest = {
  id: string;
  paradeId: string;
  carId: string;
  kind: HelpKind;
  note?: string;
  position?: LatLng;
  status: 'open' | 'tail_sent' | 'resolved';
  createdAt: number;
};

export type CarPosition = {
  carId: string;
  position: LatLng;
  /** Metres along the route of the nearest point on the line. */
  progressM: number;
  /** Metres away from the line. */
  offRouteM: number;
  speedMps: number;
  updatedAt: number;
};

export type MusicState = {
  trackIndex: number;
  /** Shared-clock epoch ms when the current track started. */
  startedAt: number;
  paused: boolean;
  /** Seconds into the track when paused. */
  pausedAtS?: number;
};

export type SplitAlert = {
  /** The car at the front of the gap (the one everyone behind lost). */
  frontCarId: string;
  behindCarId: string;
  gapM: number;
  position: LatLng;
  detectedAt: number;
};

export type LiveState = {
  paradeId: string;
  positions: Record<string, CarPosition>;
  music: MusicState;
  announcements: Announcement[];
  help: HelpRequest[];
  currentStop: { stopId: string; enteredAt: number } | null;
  completedStopIds: string[];
  split: SplitAlert | null;
  /** Mute music on this phone only. */
  mutedLocally: boolean;
  /** Set while the A4 countdown is running. */
  countdownEndsAt?: number;
  /** Lead car heard from recently? Organiser is prompted after 60 s of silence. */
  leadLastSeenAt?: number;
};

export type Me = {
  id: string;
  name: string;
  phone?: string;
};
