import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Header, Screen, TextField, goReplace } from '@/components/ui';
import { findParadeByCode } from '@/store/selectors';
import { getState } from '@/store/store';
import { colors, type } from '@/theme/tokens';

const CODE_LENGTH = 6;

/** Enter the code a host shared. */
export default function JoinParade() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const ready = code.trim().length === CODE_LENGTH;

  const submit = () => {
    if (!ready) return;
    const parade = findParadeByCode(getState(), code);
    if (!parade) {
      setError('No parade with that code. Check it with the host.');
      return;
    }
    goReplace('/invite/[code]', { code: parade.code });
  };

  return (
    <Screen
      keyboard
      footer={<Button title="Find parade" onPress={submit} disabled={!ready} />}>
      <Header left="close" title="Join a parade" subtitle="Enter the code from the host, or open the link they sent you." />

      <View style={styles.field}>
        <TextField
          label="Parade code"
          mono
          value={code}
          onChangeText={(t) => {
            setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''));
            setError(undefined);
          }}
          placeholder="HEND26"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          autoFocus
          maxLength={CODE_LENGTH}
          returnKeyType="go"
          onSubmitEditing={submit}
          error={error}
          style={styles.code}
        />
      </View>

      <Text style={styles.already}>Already joined? It&apos;s on your My parades list.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 18 },
  code: { fontSize: 24, letterSpacing: 6, textAlign: 'center' },
  already: { ...type.caption, color: colors.textFaint, marginTop: 14, textAlign: 'center' },
});
