import { useLocalSearchParams } from 'expo-router';

import { GuestHub } from '@/components/parade/GuestHub';
import { NotFound } from '@/components/parade/NotFound';
import { OrganiserHub } from '@/components/parade/OrganiserHub';
import { useIsOrganiser, useParade } from '@/store/selectors';

/** The parade hub. Organisers get the invite screen (I1); cars get "You're going" (I3). */
export default function ParadeHub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parade = useParade(id);
  const isOrganiser = useIsOrganiser(id);

  if (!parade) return <NotFound />;
  return isOrganiser ? <OrganiserHub parade={parade} /> : <GuestHub parade={parade} />;
}
