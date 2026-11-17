import { StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/Sheet';
import { Button, type ButtonVariant } from '@/components/ui';
import { type } from '@/theme/tokens';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  cancelLabel?: string;
  onConfirm: () => void;
};

/** Small yes/no sheet (end parade, leave console). Works on web, unlike Alert.alert. */
export function ConfirmSheet({ open, onClose, title, body, confirmLabel, confirmVariant = 'white', cancelLabel = 'Cancel', onConfirm }: Props) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button title={cancelLabel} variant="secondary" size="md" full onPress={onClose} />
          <Button title={confirmLabel} variant={confirmVariant} size="md" full onPress={onConfirm} />
        </View>
      }>
      <View style={styles.text}>
        <Text style={type.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={[type.label, styles.body]}>{body}</Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  text: { gap: 6 },
  body: { fontSize: 15, lineHeight: 21 },
  footer: { flexDirection: 'row', gap: 10 },
});
