import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { useSheet } from '@/components/Sheet';
import {
  Banner,
  Button,
  Header,
  IconButton,
  List,
  ListRow,
  Mono,
  Screen,
  StatRow,
  StatTile,
  StatusPill,
  Toggle,
  go,
  goBackOr,
  goReplace,
} from '@/components/ui';
import { formatShortDate, parseISODate } from '@/lib/dates';
import { dateTimeMs, formatUntil } from '@/lib/format';
import { deleteParade, editParade, updateParade } from '@/store/actions';
import { useCars, useLive, useMe } from '@/store/selectors';
import { colors, font, space, type } from '@/theme/tokens';
import type { Parade } from '@/types';

import { CarRow } from './CarRow';
import { isParadeToday, useCountdownRedirect, useNow } from './hooks';
import { QrSheet } from './QrSheet';
import { copyText, inviteLink, inviteMessage, shareText } from './share';
import { WhatsAppPreview } from './WhatsAppPreview';

const PREVIEW_ROWS = 5;

/** I1: the organiser's view of their parade. Share it, watch RSVPs, and on the day, start it. */
export function OrganiserHub({ parade }: { parade: Parade }) {
  const id = parade.id;
  const cars = useCars(id);
  const live = useLive(id);
  const me = useMe();
  const now = useNow(15_000);
  const qr = useSheet();
  const [confirmDelete, setConfirmDelete] = useState(false);
  useCountdownRedirect(id, parade, live);

  const edit = () => {
    editParade(id);
    go('/create/basics');
  };

  const setsOff = dateTimeMs(parade.date, parade.setsOffAt);
  const today = isParadeToday(parade, now);
  const dateLine = today ? (
    <Text style={styles.meta}>
      Today · sets off <Mono style={styles.metaMono}>{parade.setsOffAt}</Mono>
      {setsOff > now ? ` · ${formatUntil(setsOff, now)}` : ''}
    </Text>
  ) : (
    <Text style={styles.meta}>
      {formatShortDate(parseISODate(parade.date))} · {formatUntil(setsOff, now)}
    </Text>
  );

  const musicSaved = cars.filter((c) => c.musicProgress >= 1).length;
  const isDraft = parade.status === 'draft';
  const isLive = parade.status === 'live';
  const isEnded = parade.status === 'ended';
  // Mint once: on the day (or while live / after) the big action is the start, not the share.
  const sharePrimary = !isDraft && !isLive && !isEnded && !today;

  const pill = isDraft ? (
    <StatusPill label="Draft" tone="indigo" />
  ) : isLive ? (
    <StatusPill label="Live" tone="mint" solid />
  ) : isEnded ? (
    <StatusPill label="Finished" tone="neutral" />
  ) : (
    <StatusPill label="Published" tone="mint" />
  );

  const footer = isDraft ? (
    <Button title="Finish setting up" onPress={edit} />
  ) : isLive ? (
    <Button title="Open console" icon="megaphone" onPress={() => go('/parade/[id]/console', { id })} />
  ) : isEnded ? (
    <Button title="See how it went" onPress={() => go('/parade/[id]/done', { id })} />
  ) : today ? (
    <Button title="Ready to start" iconRight="arrowRight" onPress={() => go('/parade/[id]/ready', { id })} />
  ) : (
    <>
      <Button title="Open parade control" variant="secondary" onPress={() => go('/parade/[id]/ready', { id })} />
      <Text style={styles.footnote}>Use it on the day, as cars arrive.</Text>
    </>
  );

  return (
    <View style={styles.root}>
      <Screen scroll footer={footer}>
        <Header
          left="back"
          onLeft={() => goBackOr('/')}
          right={
            isLive || isEnded ? undefined : (
              <PressableScale onPress={edit} accessibilityRole="button" style={styles.textBtn}>
                <Text style={styles.textBtnLabel}>Edit parade</Text>
              </PressableScale>
            )
          }
        />

        <View style={styles.titles}>
          {pill}
          <Text accessibilityRole="header" style={styles.title}>
            {parade.name || 'Untitled parade'}
          </Text>
          {dateLine}
        </View>

        {isDraft ? (
          <Banner tone="info" icon="info" title="Not published yet" body="Guests can't join until you publish. Finish the route and music, then publish from the last step." />
        ) : (
          <>
            <StatRow columns={2}>
              <StatTile size="big" value={cars.length} label={cars.length === 1 ? 'car coming' : 'cars coming'} />
              <StatTile size="big" value={musicSaved} label="have music saved" />
            </StatRow>

            <WhatsAppPreview parade={parade} />

            <View style={styles.shareRow}>
              <Button
                title="Share invite"
                icon="share"
                size="md"
                variant={sharePrimary ? 'primary' : 'secondary'}
                full
                onPress={() => shareText(inviteMessage(parade))}
              />
              <IconButton icon="copy" size={50} accessibilityLabel="Copy invite link" onPress={() => copyText(inviteLink(parade.code), `Link copied · code ${parade.code}`)} />
              <IconButton icon="qr" size={50} accessibilityLabel="Show QR code to print" onPress={qr.show} />
            </View>

            <List>
              <View style={styles.toggleRow}>
                <Toggle
                  label="Day-before reminder"
                  description="Every car gets a nudge the evening before"
                  value={parade.reminderDayBefore}
                  onChange={(v) => updateParade(id, { reminderDayBefore: v })}
                />
              </View>
            </List>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Guest list</Text>
                <Mono size="small" style={styles.sectionCount}>
                  {cars.length}
                </Mono>
              </View>
              {cars.length === 0 ? (
                <View style={styles.empty}>
                  <Icon name="users" size={20} color={colors.textFaint} />
                  <Text style={[type.caption, { flex: 1 }]}>No cars yet. Share the invite in your community WhatsApp group.</Text>
                </View>
              ) : (
                <List>
                  {cars.slice(0, PREVIEW_ROWS).map((c) => (
                    <CarRow key={c.id} car={c} showRole isMe={c.userId === me.id} onPress={() => go('/parade/[id]/car/[carId]', { id, carId: c.id })} />
                  ))}
                  <ListRow title={`All ${cars.length} cars`} onPress={() => go('/parade/[id]/cars', { id })} chevron minHeight={52} />
                </List>
              )}
            </View>
          </>
        )}

        <View style={styles.danger}>
          {confirmDelete ? (
            <Banner
              tone="danger"
              icon="trash"
              title={`Delete ${parade.name || 'this parade'}?`}
              body={cars.length > 0 ? `${cars.length} cars have joined. They lose the route and music. This can't be undone.` : "This can't be undone."}
              actions={
                <>
                  <Button title="Keep it" size="sm" variant="secondary" full onPress={() => setConfirmDelete(false)} />
                  <Button
                    title="Delete"
                    size="sm"
                    variant="danger"
                    full
                    onPress={() => {
                      goReplace('/');
                      deleteParade(id);
                    }}
                  />
                </>
              }
            />
          ) : isLive ? null : (
            <PressableScale onPress={() => setConfirmDelete(true)} accessibilityRole="button" style={styles.deleteBtn}>
              <Text style={styles.deleteText}>Delete parade</Text>
            </PressableScale>
          )}
        </View>
      </Screen>
      <QrSheet open={qr.open} onClose={qr.hide} code={parade.code} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onyx },
  textBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  textBtnLabel: { fontFamily: font.sans, fontSize: 15, color: colors.indigoBright },
  titles: { gap: 6 },
  title: { ...type.h1, fontSize: 28, lineHeight: 33, letterSpacing: -0.7 },
  meta: { ...type.label, fontSize: 15, lineHeight: 21, color: colors.textMuted },
  metaMono: { fontSize: 15, color: colors.text },
  shareRow: { flexDirection: 'row', gap: 8 },
  toggleRow: { paddingHorizontal: 14, paddingVertical: 8 },
  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  sectionTitle: { ...type.label, color: colors.textMuted },
  sectionCount: { color: colors.textMuted },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  footnote: { ...type.caption, textAlign: 'center' },
  danger: { marginTop: space.lg },
  deleteBtn: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  deleteText: { fontFamily: font.sans, fontSize: 15, color: colors.danger },
});
