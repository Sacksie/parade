import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { AnnounceSheet } from '@/components/parade/AnnounceSheet';
import { CarRow } from '@/components/parade/CarRow';
import { needsAttention } from '@/components/parade/carStatus';
import { useCountdownRedirect, useNow } from '@/components/parade/hooks';
import { NotFound } from '@/components/parade/NotFound';
import { PressableScale } from '@/components/PressableScale';
import { useSheet } from '@/components/Sheet';
import { Button, HoldButton, IconButton, List, ListRow, Mono, ReadinessRow, RoleBadge, Screen, go, goBackOr, showToast } from '@/components/ui';
import { dateTimeMs, formatUntil } from '@/lib/format';
import { checkIn, startCountdown } from '@/store/actions';
import { leadCar, tailCar, useCars, useIsOrganiser, useLive, useMe, useParade } from '@/store/selectors';
import { colors, font, radius, type } from '@/theme/tokens';

const ATTENTION_CAP = 5;

/** A2: the organiser's pre-start view. Who's here, who's ready, and hold to start. */
export default function Ready() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parade = useParade(id);
  const cars = useCars(id);
  const live = useLive(id);
  const me = useMe();
  const isOrganiser = useIsOrganiser(id);
  const now = useNow();
  const announceSheet = useSheet();
  useCountdownRedirect(id, parade, live);

  if (!parade) return <NotFound />;
  if (!isOrganiser) return <NotFound title="Organisers only" body="Only the organisers can start the parade." />;

  const here = cars.filter((c) => c.checkedInAt);
  const musicOk = here.filter((c) => c.musicProgress >= 1).length;
  const soundOk = here.filter((c) => c.soundOk).length;
  const locationOk = here.filter((c) => c.locationOn).length;
  const lead = leadCar(cars);
  const tail = tailCar(cars);
  const attention = cars.filter(needsAttention);
  const setsOff = dateTimeMs(parade.date, parade.setsOffAt);
  const leadHere = !!lead?.checkedInAt;
  const leadIsMine = lead?.userId === me.id;
  const openCar = (carId: string) => go('/parade/[id]/car/[carId]', { id: parade.id, carId });

  const start = () => {
    // Every phone on the hub / arrival / ready screens follows live.countdownEndsAt to the countdown.
    startCountdown(parade.id, 10);
  };

  const leadSubtitle = !lead ? 'Not chosen · the parade needs one' : leadHere ? (leadIsMine ? 'Your car · here' : `${lead.name} · here`) : leadIsMine ? 'Your car · not checked in' : `${lead.name} · not checked in`;

  return (
    <View style={styles.root}>
      <Screen
        scroll
        footer={
          <>
            {leadHere ? (
              <HoldButton title="Hold to start parade" onComplete={start} accessibilityHint="Press and hold for 2 seconds to start the countdown in every car" />
            ) : (
              <View style={styles.holdOff} accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Hold to start parade, unavailable">
                <Icon name="play" size={20} color={colors.mintText} />
                <Text style={styles.holdOffText}>Hold to start parade</Text>
              </View>
            )}
            <Text style={[styles.footnote, !leadHere && { color: colors.warn }]}>
              {leadHere ? 'Hold 2 seconds. Starts navigation, music and tracking in every car.' : !lead ? 'Choose a lead car first.' : 'The lead car has to check in before you can start.'}
            </Text>
            {leadHere && !tail ? <Text style={[styles.footnote, { color: colors.warn }]}>No tail car. You can start without one.</Text> : null}
          </>
        }>
        <View style={styles.top}>
          <IconButton icon="back" variant="ghost" accessibilityLabel="Back" onPress={() => goBackOr(`/parade/${parade.id}`)} />
          <View style={styles.titles}>
            <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
              {parade.name}
            </Text>
            <Text style={styles.sub}>
              Sets off <Mono size="small" style={styles.subMono}>{parade.setsOffAt}</Mono>
              {' · '}
              {setsOff - now > 30_000 ? (
                <>
                  in{' '}
                  <Mono size="small" style={styles.subMono}>
                    {formatUntil(setsOff, now).replace(/^in /, '')}
                  </Mono>
                </>
              ) : (
                'now'
              )}
            </Text>
          </View>
          <IconButton icon="megaphone" size={46} accessibilityLabel="Announce to everyone" onPress={announceSheet.show} />
        </View>

        <View style={styles.hereCard}>
          <View style={styles.hereRow}>
            <Mono size="hero" style={styles.hereNum}>
              {here.length}
            </Mono>
            <Text style={styles.hereText}>
              of <Mono style={styles.hereText}>{cars.length}</Mono> cars here
            </Text>
          </View>
          <View style={styles.bars}>
            <ReadinessRow label="Music saved" done={musicOk} total={here.length} />
            <ReadinessRow label="Sound check" done={soundOk} total={here.length} />
            <ReadinessRow label="Location on" done={locationOk} total={here.length} />
          </View>
        </View>

        <List>
          <ListRow
            left={<RoleBadge letter="L" />}
            title="Lead car"
            subtitle={leadSubtitle}
            subtitleTone={leadHere ? 'mint' : 'warn'}
            onPress={lead ? () => openCar(lead.id) : undefined}
            right={
              lead && !leadHere && leadIsMine ? (
                <Button
                  title="I'm here"
                  size="sm"
                  variant="secondary"
                  onPress={() => {
                    checkIn(parade.id, lead.id);
                    showToast('Your car is checked in');
                  }}
                />
              ) : !lead ? (
                <Button title="Choose" size="sm" variant="secondary" onPress={() => go('/parade/[id]/cars', { id: parade.id })} />
              ) : undefined
            }
            chevron={!!lead && !(lead && !leadHere && leadIsMine)}
          />
          <ListRow
            left={<RoleBadge letter="T" />}
            title="Tail car"
            subtitle={tail ? `${tail.name}${tail.checkedInAt ? ' · here' : ' · not checked in'}` : 'Not chosen · recommended'}
            subtitleTone={tail ? (tail.checkedInAt ? undefined : 'warn') : 'warn'}
            onPress={tail ? () => openCar(tail.id) : undefined}
            right={tail ? undefined : <Button title="Choose" size="sm" variant="secondary" onPress={() => go('/parade/[id]/cars', { id: parade.id })} />}
            chevron={!!tail}
          />
        </List>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>
              Needs attention{attention.length > 0 ? ' · ' : ''}
              {attention.length > 0 ? <Mono size="small" style={styles.sectionTitle}>{attention.length}</Mono> : null}
            </Text>
            <PressableScale onPress={() => go('/parade/[id]/cars', { id: parade.id })} accessibilityRole="button" style={styles.link}>
              <Text style={styles.linkText}>
                All <Mono size="small" style={styles.linkText}>{cars.length}</Mono> cars
              </Text>
            </PressableScale>
          </View>
          {attention.length === 0 ? (
            <View style={styles.allGood}>
              <Icon name="checkCircle" size={18} color={colors.textMuted} />
              <Text style={[type.caption, { flex: 1 }]}>{here.length ? 'Every car that’s here is ready.' : 'No cars checked in yet.'}</Text>
            </View>
          ) : (
            <List>
              {attention.slice(0, ATTENTION_CAP).map((c) => (
                <CarRow key={c.id} car={c} onPress={() => openCar(c.id)} isMe={c.userId === me.id} />
              ))}
              {attention.length > ATTENTION_CAP ? (
                <ListRow title={`${attention.length - ATTENTION_CAP} more`} onPress={() => go('/parade/[id]/cars', { id: parade.id })} chevron minHeight={48} />
              ) : null}
            </List>
          )}
        </View>
      </Screen>
      <AnnounceSheet open={announceSheet.open} onClose={announceSheet.hide} paradeId={parade.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onyx },
  top: { flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: -8 },
  titles: { flex: 1, gap: 2 },
  title: { ...type.title, letterSpacing: -0.4 },
  sub: { ...type.label, color: colors.textMuted },
  subMono: { fontSize: 14, color: colors.text },
  hereCard: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 12 },
  hereRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  hereNum: { lineHeight: 46 },
  hereText: { ...type.label, fontSize: 15, color: colors.textMuted },
  bars: { gap: 10 },
  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4 },
  sectionTitle: { ...type.caption },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  linkText: { ...type.caption, color: colors.indigoBright },
  allGood: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  holdOff: {
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.mintTint,
    borderWidth: 1,
    borderColor: colors.mintBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    opacity: 0.4,
  },
  holdOffText: { fontFamily: font.sansSemi, fontSize: 18, lineHeight: 23, color: colors.mintText },
  footnote: { ...type.caption, textAlign: 'center' },
});
