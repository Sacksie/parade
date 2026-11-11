import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Sheet } from '@/components/Sheet';
import { Button, Mono } from '@/components/ui';
import { colors, type } from '@/theme/tokens';

import { inviteLink } from './share';

/** Big QR for printing or holding up at the shul door. */
export function QrSheet({ open, onClose, code }: { open: boolean; onClose: () => void; code: string }) {
  return (
    <Sheet open={open} onClose={onClose} title="Scan to join" footer={<Button title="Done" variant="secondary" onPress={onClose} />}>
      <View style={styles.body}>
        <View style={styles.qr} accessible accessibilityRole="image" accessibilityLabel={`QR code for parade code ${code}`}>
          <QRCode value={inviteLink(code)} size={220} color={colors.text} backgroundColor="transparent" />
        </View>
        <Text style={type.caption}>Or open Parade and enter the code</Text>
        <Mono size="large" style={styles.code}>
          {code}
        </Mono>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: 12 },
  qr: { padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  code: { fontSize: 36, lineHeight: 40, letterSpacing: 6 },
});
