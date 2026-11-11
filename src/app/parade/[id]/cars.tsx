import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CarRow } from '@/components/parade/CarRow';
import { needsAttention } from '@/components/parade/carStatus';
import { NotFound } from '@/components/parade/NotFound';
import { Header, Screen, Segmented, TextField, go } from '@/components/ui';
import { plural } from '@/lib/format';
import { useCars, useIsOrganiser, useMe, useParade } from '@/store/selectors';
import { colors, radius, type } from '@/theme/tokens';

type Filter = 'all' | 'here' | 'attention';

/** Every car in the parade, searchable. Organisers tap a car for the car sheet (A3). */
export default function Cars() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parade = useParade(id);
  const cars = useCars(id);
  const isOrganiser = useIsOrganiser(id);
  const me = useMe();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  if (!parade) return <NotFound />;

  const here = cars.filter((c) => c.checkedInAt).length;
  const attention = cars.filter(needsAttention).length;
  const q = query.trim().toLowerCase();
  const shown = cars.filter((c) => {
    if (filter === 'here' && !c.checkedInAt) return false;
    if (filter === 'attention' && !needsAttention(c)) return false;
    if (!q) return true;
    // Organisers can find a car by its number, name or phone; guests by number or name.
    return c.name.toLowerCase().includes(q) || String(c.number).padStart(2, '0').includes(q) || (isOrganiser && !!c.phone?.replace(/\s/g, '').includes(q.replace(/\s/g, '')));
  });

  return (
    <Screen>
      <Header left="back" title="All cars" subtitle={`${plural(cars.length, 'car')} · ${here} here`} />
      <View style={styles.controls}>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder={isOrganiser ? 'Search by name, number or phone' : 'Search by name or number'}
          leftIcon="search"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search cars"
        />
        {isOrganiser ? (
          <Segmented<Filter>
            accessibilityLabel="Filter cars"
            value={filter}
            onChange={setFilter}
            options={[
              { key: 'all', label: 'All' },
              { key: 'here', label: `Here ${here}` },
              { key: 'attention', label: `Needs help ${attention}` },
            ]}
          />
        ) : null}
      </View>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={shown}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<Text style={styles.empty}>{q ? `No car matches “${query.trim()}”.` : 'No cars here yet.'}</Text>}
        renderItem={({ item, index }) => (
          <View style={[styles.item, index === 0 && styles.first, index === shown.length - 1 && styles.last]}>
            <CarRow
              car={item}
              showRole
              showPhone={isOrganiser}
              isMe={item.userId === me.id}
              onPress={isOrganiser ? () => go('/parade/[id]/car/[carId]', { id: parade.id, carId: item.id }) : undefined}
            />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { gap: 10, marginTop: 14, marginBottom: 12 },
  list: { flex: 1, marginHorizontal: -4 },
  listContent: { paddingHorizontal: 4, paddingBottom: 24 },
  item: { backgroundColor: colors.surface, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  first: { borderTopWidth: 1, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card },
  last: { borderBottomWidth: 1, borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card },
  sep: { height: 1, backgroundColor: colors.divider, marginHorizontal: 1 },
  empty: { ...type.caption, textAlign: 'center', marginTop: 24 },
});
