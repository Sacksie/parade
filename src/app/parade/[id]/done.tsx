import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { NotFound } from '@/components/parade/NotFound';
import { shareText } from '@/components/parade/share';
import { Button, Screen, StatRow, StatTile, goReplace } from '@/components/ui';
import { formatDistance, formatDuration } from '@/lib/format';
import { routeLengthM } from '@/lib/geo';
import { useCars, useIsOrganiser, useParade } from '@/store/selectors';
import { useStore } from '@/store/store';
import { colors, font, radius, type } from '@/theme/tokens';

/** F1: the parade is over. Stats, the organiser's closing words, and what happens to your data. */
export default function Done() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parade = useParade(id);
  const cars = useCars(id);
  const isOrganiser = useIsOrganiser(id);
  const announcements = useStore((s) => (id ? s.stats[id]?.announcements ?? 0 : 0));

  if (!parade) return <NotFound />;

  const durationS = parade.liveStartedAt && parade.endedAt ? (parade.endedAt - parade.liveStartedAt) / 1000 : null;
  const distance = parade.route.length > 1 ? formatDistance(routeLengthM(parade.route)) : '–';

  const thankYou = () =>
    shareText(
      [
        `Thank you for joining ${parade.name}!`,
        `${cars.length} cars, ${distance} together${durationS ? `, ${formatDuration(durationS)} on the road` : ''}.`,
        parade.closingMessage ?? '',
      ]
        .filter(Boolean)
        .join('\n'),
    );

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      footer={
        <>
          {isOrganiser ? <Button title="Share a thank-you" icon="share" variant="indigoSoft" onPress={thankYou} /> : null}
          <Button title="Back to my parades" variant="secondary" onPress={() => goReplace('/')} />
        </>
      }>
      <View style={styles.hero}>
        <View style={styles.check}>
          <Icon name="check" size={30} strokeWidth={2.6} color={colors.mintInk} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Parade complete
        </Text>
        <Text style={styles.lede}>Drive home safely.</Text>
      </View>

      <StatRow columns={2}>
        <StatTile size="big" value={cars.length} label="cars" />
        <StatTile size="big" value={distance} label="driven together" />
        <StatTile size="big" value={durationS != null ? formatDuration(durationS) : '–'} label="on the road" />
        <StatTile size="big" value={announcements} label={announcements === 1 ? 'announcement' : 'announcements'} />
      </StatRow>

      {parade.closingMessage ? (
        <View style={styles.message}>
          <View style={styles.messageHead}>
            <Icon name="megaphone" size={16} color={colors.indigoText2} />
            <Text style={styles.messageLabel}>From the organiser</Text>
          </View>
          <Text style={styles.messageText}>{parade.closingMessage}</Text>
        </View>
      ) : null}

      <View style={styles.privacy}>
        <View style={styles.privacyRow}>
          <Icon name="locationOff" size={18} color={colors.textFaint} />
          <Text style={styles.privacyText}>Location sharing is off</Text>
        </View>
        <View style={styles.privacyRow}>
          <Icon name="music" size={18} color={colors.textFaint} />
          <Text style={styles.privacyText}>Music will be deleted from this phone in 7 days</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 56, gap: 22 },
  hero: { gap: 14 },
  check: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.sansBold, fontSize: 34, lineHeight: 36, letterSpacing: -1, color: colors.text },
  lede: { ...type.label, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  message: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.indigoTint, borderWidth: 1, borderColor: colors.indigoBorder, gap: 8 },
  messageHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  messageLabel: { ...type.caption, color: colors.indigoText2 },
  messageText: { fontFamily: font.sans, fontSize: 18, lineHeight: 25, color: colors.text },
  privacy: { gap: 10 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyText: { ...type.caption },
});
