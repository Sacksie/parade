import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { InvitePreview } from '@/components/parade/InvitePreview';
import { Button, EmptyState, Header, Screen, TextField, goReplace, success } from '@/components/ui';
import { formatLongDate, parseISODate } from '@/lib/dates';
import { joinParade } from '@/store/actions';
import { findParadeByCode, useMe, useMyCar } from '@/store/selectors';
import { useStore } from '@/store/store';
import { colors, font, type } from '@/theme/tokens';

/**
 * I2: the invite a guest lands on from `parade://invite/HEND26` or after typing the code.
 * Crew links (`?role=tail`, `?role=co`) were cut for this year: roles are assigned from the
 * car sheet instead, so any `role` param is deliberately ignored here.
 */
export default function Invite() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const parade = useStore((s) => findParadeByCode(s, String(code ?? '')));
  const me = useMe();
  const myCar = useMyCar(parade?.id);
  const isOrganiser = !!parade && parade.organiserId === me.id;

  const [name, setName] = useState(myCar?.name ?? '');
  const [phone, setPhone] = useState(myCar?.phone ?? me.phone ?? '');

  if (!parade) {
    return (
      <Screen footer={<Button title="Join with a code" variant="secondary" onPress={() => goReplace('/join')} />}>
        <Header left="close" onLeft={() => goReplace('/')} />
        <View style={styles.center}>
          <EmptyState title="This link doesn't match a parade" body="Check the link with whoever sent it, or type the 6-letter code instead." />
        </View>
      </Screen>
    );
  }

  const open = () => goReplace('/parade/[id]', { id: parade.id });

  // The organiser tapped their own link: send them to their invite screen.
  if (isOrganiser) {
    return (
      <Screen footer={<Button title="Open my parade" onPress={open} />}>
        <Header left="close" onLeft={() => goReplace('/')} title={parade.name} subtitle="This is your parade. This is the page your guests see." />
        <InvitePreview parade={parade} />
      </Screen>
    );
  }

  if (parade.status === 'draft' || parade.status === 'ended') {
    return (
      <Screen footer={<Button title="Back to My parades" variant="secondary" onPress={() => goReplace('/')} />}>
        <Header left="close" onLeft={() => goReplace('/')} />
        <View style={styles.center}>
          <EmptyState
            title={parade.status === 'draft' ? 'Not open yet' : 'This parade has finished'}
            body={parade.status === 'draft' ? `${parade.name} is still being set up. Try the link again later.` : `${parade.name} has already happened. See you at the next one.`}
          />
        </View>
      </Screen>
    );
  }

  const ready = name.trim().length > 0;
  const submit = () => {
    if (!ready) return;
    joinParade(parade.id, name.trim(), phone.trim() || undefined);
    success();
    open();
  };

  return (
    <Screen
      scroll
      keyboard
      footer={
        <>
          <Button title={myCar ? 'Update' : "We're coming"} onPress={submit} disabled={!ready} />
          <Text style={styles.footnote}>You&apos;ll get the route, the music and the announcements in this app.</Text>
        </>
      }>
      <Header left="close" onLeft={() => (myCar ? open() : goReplace('/'))} />
      <View style={styles.titles}>
        <Text style={styles.host}>{parade.host ? `${parade.host} invites you` : 'You’re invited'}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {parade.name}
        </Text>
        <Text style={styles.date}>{formatLongDate(parseISODate(parade.date))}</Text>
      </View>

      <InvitePreview parade={parade} />

      <View style={styles.form}>
        <TextField
          label="Name for your car"
          value={name}
          onChangeText={setName}
          placeholder="e.g. The Levy family"
          autoCapitalize="words"
          returnKeyType="next"
          maxLength={40}
        />
        <TextField
          label="Mobile number"
          mono
          value={phone}
          onChangeText={setPhone}
          placeholder="07700 900000"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          hint="Only the organisers see this, in case you need help."
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  titles: { gap: 8, marginTop: 4 },
  host: { ...type.label, color: colors.indigoBright },
  title: { fontFamily: font.sansBold, fontSize: 32, lineHeight: 34, letterSpacing: -0.96, color: colors.text },
  date: { ...type.body, color: colors.textMuted },
  form: { gap: 14, marginTop: 2 },
  footnote: { ...type.caption, textAlign: 'center' },
});
