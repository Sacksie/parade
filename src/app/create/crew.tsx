import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RadioList } from '@/components/create/RadioList';
import { WizardHeader, useWizard } from '@/components/create/wizard';
import { Icon } from '@/components/icons';
import { Sheet } from '@/components/Sheet';
import { Banner, Button, CarNumber, List, ListRow, RoleBadge, Screen, showToast } from '@/components/ui';
import { setCarRole, setOrganiserAccess } from '@/store/actions';
import { leadCar, tailCar, useCars, useMe } from '@/store/selectors';
import { colors, radius, space, type } from '@/theme/tokens';
import type { OrganiserPlace } from '@/types';

type Role = 'lead' | 'tail' | 'co';

const ROLE_TITLE: Record<Role, string> = { lead: 'Lead car', tail: 'Tail car', co: 'Co-organiser' };

/** C7 · Crew & roles. */
export default function CreateCrew() {
  const { draft, save, advance, back, primaryLabel } = useWizard();
  const me = useMe();
  const cars = useCars(draft?.id);
  const [choosing, setChoosing] = useState<Role | null>(null);

  if (!draft) return <Screen>{null}</Screen>;

  const lead = leadCar(cars);
  const tail = tailCar(cars);
  const coOrganisers = cars.filter((c) => c.isOrganiser && c.userId !== me.id);
  const driving = draft.organiserPlace === 'driving';

  const leadSub = lead ? (lead.userId === me.id ? 'Your car · sets the pace' : `${lead.name} · sets the pace`) : draft.organiserPlace === 'base' ? 'Not chosen · pick one on the night' : 'Your car · sets the pace';
  const coSub = coOrganisers.length > 0 ? `${coOrganisers.map((c) => c.name).join(', ')} · can announce, run music, edit` : 'None yet · can announce, run music, edit';

  const copyInvite = async (role: Role) => {
    const link = `parade://invite/${draft.code}?role=${role}`;
    try {
      await Clipboard.setStringAsync(link);
      showToast('Copied. Assign roles from the car list on the night too.');
    } catch {
      showToast("Couldn't copy the link");
    }
  };

  const choose = (carId: string) => {
    if (!choosing) return;
    if (choosing === 'co') {
      const car = cars.find((c) => c.id === carId);
      setOrganiserAccess(draft.id, carId, !car?.isOrganiser);
    } else {
      setCarRole(draft.id, carId, choosing);
      setChoosing(null);
    }
  };

  const roleButton = (role: Role, label: string, primary?: boolean) => (
    <Button title={label} size="sm" variant={primary ? 'ghost' : 'secondary'} onPress={() => setChoosing(role)} accessibilityLabel={`${label} ${ROLE_TITLE[role].toLowerCase()}`} />
  );

  return (
    <View style={styles.root}>
      <Screen footer={<Button title={primaryLabel} onPress={() => advance('/create/publish')} />}>
        <WizardHeader step={5} title="Crew & roles" onLeft={() => back('/create/music')} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <RadioList<OrganiserPlace>
            label="Where will you be on the night?"
            value={draft.organiserPlace}
            onChange={(organiserPlace) => save({ organiserPlace })}
            options={[
              { key: 'lead_passenger', label: 'Passenger in the lead car' },
              { key: 'driving', label: 'Driving a car' },
              { key: 'base', label: 'Not in the parade, running it from base' },
            ]}
          />

          {driving && coOrganisers.length === 0 ? (
            <Banner
              tone="warn"
              icon="warning"
              title="Add a co-organiser"
              body="Nobody should run the console while driving. Ask someone riding as a passenger to announce and run the music."
              actions={<Button title="Add co-organiser" size="sm" variant="secondary" onPress={() => setChoosing('co')} />}
            />
          ) : null}

          <View style={styles.group}>
            <Text style={styles.label}>Roles</Text>
            <List>
              <ListRow left={<RoleBadge letter="L" size={36} />} title="Lead car" subtitle={leadSub} minHeight={64} right={roleButton('lead', 'Change', true)} />
              <ListRow
                left={<RoleBadge letter="T" size={36} />}
                title="Tail car"
                subtitle={tail ? `${tail.name} · helps anyone who stops` : 'Not chosen · recommended'}
                subtitleTone={tail ? undefined : 'warn'}
                minHeight={64}
                right={roleButton('tail', tail ? 'Change' : 'Add')}
              />
              <ListRow left={<RoleBadge letter="C" size={36} />} title="Co-organisers" subtitle={coSub} minHeight={64} right={roleButton('co', 'Add')} />
            </List>
          </View>

          <View style={styles.note}>
            <Icon name="info" size={18} color={colors.indigoBright} />
            <Text style={styles.noteText}>
              The lead car sets the pace and the tail car helps anyone who stops. You can swap either on the night from any car&apos;s sheet.
            </Text>
          </View>
        </ScrollView>
      </Screen>

      <Sheet
        open={choosing != null}
        onClose={() => setChoosing(null)}
        title={choosing ? `Choose the ${ROLE_TITLE[choosing].toLowerCase()}` : undefined}
        scrollable
        footer={
          choosing ? (
            <View style={styles.sheetFoot}>
              <Button title="Copy invite link" icon="link" variant="secondary" size="md" onPress={() => copyInvite(choosing)} />
              <Button title="Done" variant="ghost" size="md" onPress={() => setChoosing(null)} />
            </View>
          ) : null
        }>
        {cars.length === 0 ? (
          <View style={styles.noCars}>
            <Icon name="users" size={22} color={colors.textFaint} />
            <Text style={styles.noCarsText}>Cars appear here once people join. Publish, share the invite, then come back and pick from the list.</Text>
          </View>
        ) : (
          <List>
            {cars.map((c) => {
              const picked = choosing === 'co' ? c.isOrganiser : choosing ? c.role === choosing : false;
              const mine = c.userId === me.id;
              return (
                <ListRow
                  key={c.id}
                  left={<CarNumber value={c.number} />}
                  title={mine ? `${c.name} (you)` : c.name}
                  subtitle={c.role !== 'car' ? `${c.role === 'lead' ? 'Lead' : 'Tail'} car` : undefined}
                  onPress={mine && choosing === 'co' ? undefined : () => choose(c.id)}
                  right={picked ? <Icon name="check" size={18} color={colors.mintText} /> : null}
                />
              );
            })}
          </List>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onyx },
  scroll: { flex: 1, marginHorizontal: -space.xl },
  body: { paddingHorizontal: space.xl, paddingTop: 2, paddingBottom: space.lg, gap: 16 },
  group: { gap: 8 },
  label: { ...type.label, color: colors.textMuted },
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  noteText: { flex: 1, ...type.caption, lineHeight: 19, color: colors.textMuted },
  sheetFoot: { gap: 4 },
  noCars: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 8 },
  noCarsText: { flex: 1, ...type.label, lineHeight: 20 },
});
