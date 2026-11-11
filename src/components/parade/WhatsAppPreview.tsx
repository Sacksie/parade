import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { MapCanvasStatic } from '@/components/map/MapCanvas';
import { Mono } from '@/components/ui';
import { formatShortDate, parseISODate } from '@/lib/dates';
import { colors, font, radius, type } from '@/theme/tokens';
import type { Parade } from '@/types';

/** Static mock of how the invite unfurls in a chat, so the organiser knows what guests will see. */
export function WhatsAppPreview({ parade }: { parade: Parade }) {
  const date = formatShortDate(parseISODate(parade.date));
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>How the link looks in WhatsApp</Text>
      <View style={styles.card}>
        <View style={styles.map}>
          {parade.route.length > 1 ? (
            <MapCanvasStatic style={StyleSheet.absoluteFill} fit={parade.route} fitPadding={14} route={parade.route} routeStyle="draft" />
          ) : null}
        </View>
        <View style={styles.body}>
          <View style={styles.appIcon}>
            <Icon name="car" size={20} color={colors.mintInk} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.title} numberOfLines={1}>
              {parade.name || 'Untitled parade'}
            </Text>
            <Text style={styles.meta} numberOfLines={2}>
              {date} · sets off <Mono size="small" style={styles.metaMono}>{parade.setsOffAt}</Mono>
              {parade.meetingName ? ` · meet at ${parade.meetingName}` : ''}
            </Text>
            <Mono size="small" style={styles.link}>
              parade.app/{parade.code}
            </Mono>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  caption: { ...type.caption },
  card: { borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  map: { height: 112, backgroundColor: colors.mapBg },
  body: { flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  appIcon: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 3 },
  title: { fontFamily: font.sansSemi, fontSize: 15, lineHeight: 20, color: colors.text },
  meta: { ...type.caption, color: colors.textMuted },
  metaMono: { color: colors.textMuted },
  link: { fontSize: 12, color: colors.textFaint },
});
