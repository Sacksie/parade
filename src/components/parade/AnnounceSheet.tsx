import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Sheet } from '@/components/Sheet';
import { Button, TextField, showToast } from '@/components/ui';
import { announce } from '@/store/actions';
import { type } from '@/theme/tokens';

const PRESETS = ['Please park in rows facing the exit', 'We set off in 5 minutes', 'Turn your car speakers up'];

/** Same action the console uses: text read aloud on every phone. */
export function AnnounceSheet({ open, onClose, paradeId }: { open: boolean; onClose: () => void; paradeId: string }) {
  const [text, setText] = useState('');
  const send = () => {
    const t = text.trim();
    if (!t) return;
    announce(paradeId, t);
    setText('');
    onClose();
    showToast('Announced to every car');
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Announce to everyone"
      footer={<Button title="Read it out in every car" icon="megaphone" variant="indigo" disabled={!text.trim()} onPress={send} />}>
      <TextField value={text} onChangeText={setText} placeholder="Type what everyone should hear" multiline rows={3} maxLength={200} accessibilityLabel="Announcement" />
      <Text style={[type.caption, styles.presetsLabel]}>Quick ones</Text>
      {PRESETS.map((p) => (
        <Button key={p} title={p} size="pill" variant="secondary" onPress={() => setText(p)} style={styles.preset} />
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  presetsLabel: { marginTop: 14, marginBottom: 8 },
  preset: { alignSelf: 'flex-start', marginBottom: 8 },
});
