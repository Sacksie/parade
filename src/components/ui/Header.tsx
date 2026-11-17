import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { goBackOr } from '@/components/ui/nav';
import { colors, type } from '@/theme/tokens';

type Props = {
  left?: 'back' | 'close' | React.ReactNode;
  /** Defaults to going back (or home if there is nothing to go back to). */
  onLeft?: () => void;
  title?: string;
  subtitle?: React.ReactNode;
  /** Content for the right of the top row: a caption, a text button. */
  right?: React.ReactNode;
  /** Shown above the title, e.g. <StepLabel/>. */
  eyebrow?: React.ReactNode;
};

/** Top row (44×44 left button, optional right content) then the screen title. */
export function Header({ left, onLeft, title, subtitle, right, eyebrow }: Props) {
  const hasTop = left != null || right != null;
  return (
    <View style={styles.wrap}>
      {hasTop ? (
        <View style={styles.row}>
          {left === 'back' || left === 'close' ? (
            <PressableScale
              pressedScale={0.9}
              onPress={onLeft ?? (() => goBackOr('/'))}
              accessibilityRole="button"
              accessibilityLabel={left === 'back' ? 'Back' : 'Close'}
              style={styles.leftBtn}>
              <Icon name={left === 'back' ? 'back' : 'close'} size={22} />
            </PressableScale>
          ) : (
            left ?? <View />
          )}
          {right}
        </View>
      ) : null}
      {eyebrow || title || subtitle ? (
        <View style={styles.titles}>
          {eyebrow}
          {title ? (
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
          ) : null}
          {typeof subtitle === 'string' ? <Text style={styles.subtitle}>{subtitle}</Text> : subtitle}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: -8, minHeight: 44 },
  leftBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  titles: { gap: 4 },
  title: { ...type.h1, fontSize: 28, lineHeight: 33, letterSpacing: -0.7 },
  subtitle: { ...type.label, fontSize: 15, lineHeight: 21, color: colors.textMuted },
});
