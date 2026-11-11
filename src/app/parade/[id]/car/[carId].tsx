import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Sheet } from '@/components/Sheet';
import { Button, Divider, Eyebrow, List, ListRow, Mono, Pill, RoleBadge, Toggle, goBackOr, showToast, success, type Tone } from '@/components/ui';
import { formatCarNumber, msToHHMM } from '@/lib/format';
import { removeCar, setCarRole, setOrganiserAccess } from '@/store/actions';
import { leadCar, tailCar, useCars, useIsOrganiser, useMe } from '@/store/selectors';
import { colors, font, type } from '@/theme/tokens';
import type { Car } from '@/types';

/**
 * A3: the car sheet. A transparent-modal route that draws our own <Sheet/>, so the screen
 * underneath stays visible on every platform. Closing animates the sheet out, then pops the route.
 */
export default function CarSheet() {
  const { id, carId } = useLocalSearchParams<{ id: string; carId: string }>();
  const cars = useCars(id);
  const isOrganiser = useIsOrganiser(id);
  const car = cars.find((c) => c.id === carId);
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    setTimeout(() => goBackOr(id ? `/parade/${id}` : '/'), 200);
  };

  const body = !car ? (
    <Text style={[type.body, styles.gone]}>This car has left the parade.</Text>
  ) : !isOrganiser ? (
    <Text style={[type.body, styles.gone]}>Only organisers can manage cars.</Text>
  ) : (
    <CarDetails paradeId={id} car={car} onClose={close} />
  );

  return (
    <View style={styles.root}>
      <Sheet open={open} onClose={close} scrollable>
        {body}
        {!car || !isOrganiser ? <Divider style={styles.gap} /> : null}
        {!car || !isOrganiser ? <Button title="Close" variant="secondary" onPress={close} /> : null}
      </Sheet>
    </View>
  );
}

function CarDetails({ paradeId, car, onClose }: { paradeId: string; car: Car; onClose: () => void }) {
  const cars = useCars(paradeId);
  const me = useMe();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const lead = leadCar(cars);
  const tail = tailCar(cars);
  const mine = car.userId === me.id;
  const isLead = car.role === 'lead';
  const isTail = car.role === 'tail';
  const here = car.checkedInAt;
  const chips: { label: React.ReactNode; tone: Tone }[] = [
    here ? { label: 'Here', tone: 'mint' } : { label: 'Not here yet', tone: 'neutral' },
    car.locationOn ? { label: 'Location on', tone: 'mint' } : { label: 'Location off', tone: here ? 'warn' : 'neutral' },
    car.musicProgress >= 1 ? { label: 'Music saved', tone: 'mint' } : { label: `Music ${Math.round(car.musicProgress * 100)}%`, tone: 'indigo' },
    car.soundOk ? { label: 'Sound OK', tone: 'mint' } : { label: 'No sound', tone: here ? 'warn' : 'neutral' },
    car.screenAwake ? { label: 'Screen on', tone: 'mint' } : { label: 'Screen may sleep', tone: 'neutral' },
  ];
  const leadSubtitle = isLead
    ? 'This is the lead car'
    : lead
      ? lead.userId === me.id
        ? 'Your car becomes a regular car'
        : `${lead.name} becomes a regular car`
      : 'Sets the pace at the front';
  const tailSubtitle = isTail ? 'Tap to make them a regular car' : tail ? `${tail.name} becomes a regular car` : "They'll be asked to join at the back";
  const phone = car.phone?.replace(/[^\d+]/g, '');

  return (
    <View style={styles.content}>
      <View style={styles.top}>
        <View style={styles.numberSquare}>
          <Mono style={styles.number}>{formatCarNumber(car.number)}</Mono>
        </View>
        <View style={styles.topText}>
          <Text accessibilityRole="header" style={styles.name}>
            {car.name}
            {mine ? <Text style={styles.you}> (you)</Text> : null}
          </Text>
          <Text style={styles.caption}>
            Car <Mono size="small" style={styles.captionMono}>{formatCarNumber(car.number)}</Mono>
            {here ? (
              <>
                {' '}
                · here since <Mono size="small" style={styles.captionMono}>{msToHHMM(here)}</Mono>
              </>
            ) : (
              ' · not checked in'
            )}
            {car.phone ? (
              <>
                {' '}
                · <Mono size="small" style={styles.captionMono}>{car.phone}</Mono>
              </>
            ) : null}
          </Text>
        </View>
      </View>

      <View style={styles.chips}>
        {chips.map((c, i) => (
          <Pill key={i} label={c.label} tone={c.tone} />
        ))}
      </View>

      {!mine ? (
        <View style={styles.contact}>
          <Button
            title="Call"
            icon="phone"
            size="md"
            variant="secondary"
            full
            disabled={!phone}
            onPress={() => Linking.openURL(`tel:${phone}`).catch(() => showToast('Calling isn’t available here'))}
          />
          <Button
            title="Message"
            icon="message"
            size="md"
            variant="secondary"
            full
            disabled={!phone}
            onPress={() => Linking.openURL(`sms:${phone}`).catch(() => showToast('Messaging isn’t available here'))}
          />
        </View>
      ) : null}
      {!phone && !mine ? <Text style={styles.caption}>No phone number. They didn&apos;t leave one when they joined.</Text> : null}

      <View style={styles.section}>
        <Eyebrow>Role</Eyebrow>
        <List>
          <View style={isLead ? styles.disabled : undefined}>
            <ListRow
              minHeight={60}
              left={<RoleBadge letter="L" size={30} />}
              title={isLead ? 'Lead car' : 'Make lead car'}
              subtitle={leadSubtitle}
              onPress={
                isLead
                  ? undefined
                  : () => {
                      setCarRole(paradeId, car.id, 'lead');
                      success();
                      showToast(`${car.name} is now the lead car`);
                    }
              }
            />
          </View>
          <ListRow
            minHeight={60}
            left={<RoleBadge letter="T" size={30} />}
            title={isTail ? 'Tail car' : 'Make tail car'}
            subtitle={tailSubtitle}
            onPress={() => {
              setCarRole(paradeId, car.id, isTail ? 'car' : 'tail');
              success();
              showToast(isTail ? `${car.name} is a regular car again` : `${car.name} is now the tail car`);
            }}
          />
          <ListRow
            minHeight={60}
            left={<RoleBadge letter="C" size={30} />}
            title="Give organiser access"
            subtitle="Announce, run music, see help requests"
            right={<Toggle value={car.isOrganiser} onChange={(v) => setOrganiserAccess(paradeId, car.id, v)} />}
          />
        </List>
      </View>

      {!mine ? (
        confirmRemove ? (
          <View style={styles.confirm}>
            <Text style={styles.confirmText}>
              Remove {car.name}? They lose the route and the announcements.{isLead ? ' Choose a new lead car before you start.' : ''}
            </Text>
            <View style={styles.contact}>
              <Button title="Keep" size="sm" variant="secondary" full onPress={() => setConfirmRemove(false)} />
              <Button
                title="Remove"
                size="sm"
                variant="danger"
                full
                onPress={() => {
                  removeCar(paradeId, car.id);
                  showToast(`${car.name} removed`);
                  onClose();
                }}
              />
            </View>
          </View>
        ) : (
          <PressableScale onPress={() => setConfirmRemove(true)} accessibilityRole="button" style={styles.removeBtn}>
          <Text style={styles.removeText}>Remove from parade</Text>
        </PressableScale>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the screen underneath shows through the scrim (web needs the explicit value).
  root: { flex: 1, backgroundColor: Platform.OS === 'web' ? 'transparent' : undefined },
  content: { gap: 16 },
  gone: { color: colors.textMuted, marginBottom: 8 },
  gap: { marginVertical: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  numberSquare: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.indigoTint, alignItems: 'center', justifyContent: 'center' },
  number: { fontFamily: font.monoSemi, fontSize: 18, lineHeight: 22, color: colors.indigoBright },
  topText: { flex: 1, gap: 4 },
  name: { fontFamily: font.sansBold, fontSize: 22, lineHeight: 27, letterSpacing: -0.44, color: colors.text },
  you: { fontFamily: font.sans, color: colors.textFaint },
  caption: { ...type.caption },
  captionMono: { color: colors.textFaint },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  contact: { flexDirection: 'row', gap: 8 },
  section: { gap: 8 },
  disabled: { opacity: 0.55 },
  confirm: { gap: 10, padding: 14, borderRadius: 16, backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder },
  confirmText: { ...type.label, color: colors.dangerText },
  removeBtn: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  removeText: { fontFamily: font.sans, fontSize: 15, color: colors.danger },
});
