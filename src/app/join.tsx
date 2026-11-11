import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { colors, radius, space, type } from '@/theme/tokens';

/** Placeholder join flow: enter the code a host shared. */
export default function JoinParade() {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const ready = code.trim().length >= 4;

  return (
    <View style={[styles.screen, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
      <PressableScale
        pressedScale={0.9}
        onPress={() => router.back()}
        style={styles.close}
        accessibilityLabel="Close">
        <CloseIcon />
      </PressableScale>

      <Text style={[type.display, { marginTop: space.lg }]}>Join a parade</Text>
      <Text style={[type.caption, { marginTop: space.sm, marginBottom: space.xl }]}>
        Enter the code from the host, or open the link they sent you.
      </Text>

      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="PARADE CODE"
        placeholderTextColor={colors.textFaint}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        maxLength={8}
        selectionColor={colors.indigoBright}
        style={styles.code}
      />

      <View style={{ flex: 1 }} />

      <PressableScale
        disabled={!ready}
        // TODO: look up the parade by code.
        onPress={() => {}}
        style={[styles.cta, !ready && { opacity: 0.4 }]}>
        <Text style={styles.ctaText}>Find parade</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.onyx, paddingHorizontal: space.xl, paddingTop: space.lg },
  close: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  code: {
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.indigoBorder,
    backgroundColor: colors.indigoTint,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
  },
  cta: {
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});
