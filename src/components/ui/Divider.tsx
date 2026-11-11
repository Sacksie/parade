import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/tokens';

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.d, style]} />;
}

const styles = StyleSheet.create({
  d: { height: 1, backgroundColor: colors.divider },
});
