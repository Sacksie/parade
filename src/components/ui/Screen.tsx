import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@/theme/tokens';

type Props = {
  children: React.ReactNode;
  /** Horizontal 20 padding. Default true. */
  padded?: boolean;
  /** Content scrolls; the footer stays put. */
  scroll?: boolean;
  /** Sticky area under the content, e.g. the main button. Gets the bottom inset. */
  footer?: React.ReactNode;
  /** Lift content and footer above the keyboard. */
  keyboard?: boolean;
  /** Skip the top inset (screens that draw their own header over a map). */
  noTopInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Onyx root that respects the safe area. */
export function Screen({ children, padded = true, scroll, footer, keyboard, noTopInset, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const px = padded ? space.xl : 0;
  const top = noTopInset ? 0 : Math.max(insets.top, space.sm) + space.sm;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[{ paddingHorizontal: px, paddingTop: top, paddingBottom: footer ? space.lg : insets.bottom + space.xl, gap: 14 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingHorizontal: px, paddingTop: top, paddingBottom: footer ? 0 : insets.bottom + space.lg }, contentStyle]}>
      {children}
    </View>
  );

  const content = (
    <>
      {body}
      {footer ? (
        <View style={[styles.footer, { paddingHorizontal: px, paddingBottom: Math.max(insets.bottom, space.lg) + 4 }]}>{footer}</View>
      ) : null}
    </>
  );

  return (
    <View style={styles.root}>
      {keyboard ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onyx },
  flex: { flex: 1 },
  footer: { paddingTop: space.md, gap: 10 },
});
