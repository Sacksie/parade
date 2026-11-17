import { StyleSheet, Text, View } from 'react-native';

import { MapCanvasStatic } from '@/components/map/MapCanvas';
import { KeyValue, Mono } from '@/components/ui';
import { formatDistance, plural } from '@/lib/format';
import { routeLengthM } from '@/lib/geo';
import { colors, radius, type } from '@/theme/tokens';
import type { Parade } from '@/types';

/** I2: route thumbnail next to the times and where to meet. */
export function InvitePreview({ parade }: { parade: Parade }) {
  const hasRoute = parade.route.length > 1;
  const stops = parade.stops.filter((s) => s.kind === 'stop').length;
  return (
    <View style={styles.card}>
      <View style={styles.map}>
        {hasRoute ? (
          <MapCanvasStatic
            style={StyleSheet.absoluteFill}
            fit={parade.route}
            fitPadding={18}
            route={parade.route}
            routeStyle="draft"
            stops={parade.stops}
            meetingPoint={parade.meetingPoint}
          />
        ) : (
          <View style={styles.noRoute}>
            <Text style={type.caption}>Route coming soon</Text>
          </View>
        )}
      </View>
      <View style={styles.facts}>
        <KeyValue label="Arrive" value={parade.arriveAt} mono />
        <KeyValue label="Sets off" value={parade.setsOffAt} mono />
        <KeyValue
          label="Route"
          value={
            hasRoute ? (
              <Text style={styles.value}>
                <Mono style={styles.value}>{formatDistance(routeLengthM(parade.route))}</Mono> · {plural(stops, 'stop')}
              </Text>
            ) : (
              <Text style={styles.value}>Not drawn yet</Text>
            )
          }
        />
        <KeyValue label="Meet at" value={<Text style={styles.value}>{parade.meetingName ?? 'Details to follow'}</Text>} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, padding: 12, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  map: { width: 140, height: 200, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.mapBg },
  noRoute: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  facts: { flex: 1, minWidth: 0, gap: 12, paddingTop: 2 },
  value: { ...type.body, fontSize: 15, lineHeight: 20 },
});
