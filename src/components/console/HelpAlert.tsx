import { Linking } from 'react-native';

import type { IconName } from '@/components/icons';
import { Banner, Button, success, tap } from '@/components/ui';
import { roadNameAt } from '@/data/mockTown';
import { formatAgo, formatCarNumber } from '@/lib/format';
import { setHelpStatus } from '@/store/actions';
import type { Car, HelpKind, HelpRequest, LatLng } from '@/types';

const KIND: Record<HelpKind, { verb: string; icon: IconName }> = {
  breakdown: { verb: 'has broken down', icon: 'wrench' },
  lost: { verb: 'is lost', icon: 'location' },
  medical: { verb: 'needs medical help', icon: 'warning' },
  other: { verb: 'needs help', icon: 'help' },
};

type Props = {
  paradeId: string;
  help: HelpRequest;
  car: Car | undefined;
  /** Where the car is now (falls back to where it asked from). */
  position: LatLng | undefined;
  hasTail: boolean;
  now: number;
};

/** Danger banner per open help request: send the tail car, or call. */
export function HelpAlert({ paradeId, help, car, position, hasTail, now }: Props) {
  const k = KIND[help.kind];
  const who = car ? `Car ${formatCarNumber(car.number)}` : 'A car';
  const road = position ? roadNameAt(position) : null;
  const sent = help.status === 'tail_sent';
  const body = [car?.name, road, formatAgo(help.createdAt, now), sent ? 'Tail car on its way' : null].filter(Boolean).join(' · ');

  const call = car?.phone ? (
    <Button
      title="Call"
      icon="phone"
      variant="danger"
      size="sm"
      accessibilityLabel={`Call ${car.name}`}
      onPress={() => Linking.openURL(`tel:${car.phone!.replace(/\s/g, '')}`).catch(() => {})}
    />
  ) : null;

  const primary = sent ? (
    <Button
      title="Resolve"
      icon="check"
      variant="white"
      size="sm"
      full
      onPress={() => {
        success();
        setHelpStatus(paradeId, help.id, 'resolved');
      }}
    />
  ) : (
    <Button
      title={hasTail ? 'Send tail car' : 'No tail car'}
      variant="white"
      size="sm"
      full
      disabled={!hasTail}
      onPress={() => {
        tap();
        setHelpStatus(paradeId, help.id, 'tail_sent');
      }}
    />
  );

  return (
    <Banner
      tone="danger"
      icon={k.icon}
      title={`${who} ${k.verb}`}
      body={!sent && !hasTail ? `${body}\nChoose a tail car from the car list` : body}
      actions={
        <>
          {primary}
          {call}
        </>
      }
    />
  );
}
