import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { Banner, Button, EmptyState, Header, Screen, TextField, goBackOr, goReplace, showToast, success } from '@/components/ui';
import { requestHelp } from '@/store/actions';
import { useCars, useMyCar } from '@/store/selectors';
import { colors, font, radius } from '@/theme/tokens';
import type { HelpKind } from '@/types';

const KINDS: { kind: HelpKind; icon: IconName; title: string; body: string }[] = [
  { kind: 'breakdown', icon: 'wrench', title: 'Breakdown', body: "We've stopped and can't continue" },
  { kind: 'lost', icon: 'route', title: 'Lost', body: "I can't find the convoy" },
  { kind: 'medical', icon: 'warning', title: 'Medical', body: 'Someone needs medical help · call 999 first' },
  { kind: 'other', icon: 'help', title: 'Something else', body: 'Tell the organisers below' },
];

const isKind = (k: unknown): k is HelpKind => typeof k === 'string' && KINDS.some((x) => x.kind === k);

const call = (phone: string) => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => showToast("Couldn't start a call on this device"));

/** Need help: pick what happened, the organisers' console gets a danger alert with my position. */
export default function Help() {
  const { id, kind: initial } = useLocalSearchParams<{ id: string; kind?: string }>();
  const myCar = useMyCar(id);
  const cars = useCars(id);
  const [kind, setKind] = useState<HelpKind | null>(isKind(initial) ? initial : null);
  const [note, setNote] = useState('');

  const organiserPhone = cars.find((c) => c.isOrganiser && c.phone && c.id !== myCar?.id)?.phone;

  if (!myCar) {
    return (
      <Screen>
        <Header left="close" />
        <View style={styles.empty}>
          <EmptyState
            title="You're not in this parade"
            body="Only cars in the convoy can send a help alert."
            action={<Button title="Home" variant="secondary" onPress={() => goReplace('/')} style={styles.emptyBtn} />}
          />
        </View>
      </Screen>
    );
  }

  const send = () => {
    if (!kind) return;
    requestHelp(id, myCar.id, kind, note.trim() || undefined);
    success();
    showToast('Sent. The organisers can see where you are.');
    if (router.canGoBack()) router.back();
    else goBackOr(`/parade/${id}/drive`);
  };

  return (
    <Screen
      scroll
      keyboard
      footer={
        <>
          <Button title="Send to organisers" icon="send" onPress={send} disabled={!kind} />
          {organiserPhone ? <Button title="Call the organiser" icon="phone" variant="secondary" onPress={() => call(organiserPhone)} /> : null}
        </>
      }>
      <Header left="close" title="What's happened?" subtitle="The organisers get an alert with where you are. Stay with your car if it's safe." />

      <View style={styles.list} accessibilityRole="radiogroup">
        {KINDS.map((k) => {
          const on = kind === k.kind;
          const danger = k.kind === 'medical';
          return (
            <PressableScale
              key={k.kind}
              pressedScale={0.98}
              onPress={() => setKind(k.kind)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${k.title}. ${k.body}`}
              style={[styles.row, on && (danger ? styles.rowDanger : styles.rowOn)]}>
              <View style={[styles.tile, danger && styles.tileDanger]}>
                <Icon name={k.icon} size={24} color={danger ? colors.danger : colors.indigoBright} />
              </View>
              <View style={styles.texts}>
                <Text style={styles.title}>{k.title}</Text>
                <Text style={styles.body}>{k.body}</Text>
              </View>
              <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
            </PressableScale>
          );
        })}
      </View>

      {kind === 'medical' ? (
        <Banner
          tone="danger"
          icon="phone"
          title="Call 999 first"
          body="Then send this so the organisers can stop the convoy behind you."
          actionsInline
          actions={<Button title="Call 999" size="sm" variant="danger" onPress={() => call('999')} />}
        />
      ) : null}

      <TextField
        label="Anything else"
        optional
        multiline
        rows={3}
        value={note}
        onChangeText={setNote}
        placeholder={kind === 'lost' ? 'Where are you? A road name or landmark helps' : 'e.g. flat tyre, we’re on the left after the lights'}
        maxLength={200}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center' },
  emptyBtn: { marginTop: 16, alignSelf: 'center' },
  list: { gap: 10, marginTop: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 76,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowOn: { borderColor: colors.indigo, backgroundColor: colors.indigoTint },
  rowDanger: { borderColor: colors.dangerSolid, backgroundColor: colors.dangerBg },
  tile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.indigoTint, alignItems: 'center', justifyContent: 'center' },
  tileDanger: { backgroundColor: colors.dangerBg },
  texts: { flex: 1, gap: 2 },
  title: { fontFamily: font.sansSemi, fontSize: 17, lineHeight: 22, color: colors.text },
  body: { fontFamily: font.sansRegular, fontSize: 14, lineHeight: 19, color: colors.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.text },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.text },
});
