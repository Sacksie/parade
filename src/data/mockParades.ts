// Placeholder data until parades are loaded from Supabase.
export type ParadeSummary = {
  id: string;
  name: string;
  hostedBy?: string;
  date: string; // ISO date
  setsOff: string; // HH:MM
  role: 'hosting' | 'joined';
  status: 'draft' | 'live' | 'upcoming';
  cars?: number;
};

export const mockParades: ParadeSummary[] = [
  {
    id: '1',
    name: 'Chanukah Car Parade',
    hostedBy: 'Hendon Shul',
    date: '2026-12-06',
    setsOff: '17:45',
    role: 'hosting',
    status: 'draft',
  },
  {
    id: '2',
    name: 'Menorah Lights Drive',
    hostedBy: 'Borehamwood Youth',
    date: '2026-12-09',
    setsOff: '18:00',
    role: 'joined',
    status: 'upcoming',
    cars: 42,
  },
];
