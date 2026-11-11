import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { colors, font, radius, type } from '@/theme/tokens';

type Props = TextInputProps & {
  label?: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  /** Geist Mono, for codes, times and phone numbers. */
  mono?: boolean;
  /** Visible lines for a multiline field. */
  rows?: number;
  leftIcon?: IconName;
};

export function TextField({ label, optional, hint, error, mono, multiline, rows = 3, leftIcon, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.dangerSolid : focused ? colors.mint : colors.border;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {optional ? <Text style={styles.optional}> · optional</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          multiline ? { minHeight: rows * 22 + 28, alignItems: 'flex-start' } : { height: 54 },
          { borderColor },
        ]}>
        {leftIcon ? (
          <View style={[styles.icon, multiline && { marginTop: 14 }]}>
            <Icon name={leftIcon} size={20} color={colors.textFaint} />
          </View>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.mint}
          cursorColor={colors.mint}
          multiline={multiline}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            { fontFamily: mono ? font.mono : font.sansRegular },
            multiline && styles.multiline,
            // RN-web draws a default outline on focus; the border colour already says it.
            { outlineStyle: 'none' } as object,
            style,
          ]}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.hint, { color: colors.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { ...type.label, color: colors.textMuted },
  optional: { fontFamily: font.sansRegular, color: colors.textFaint },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: 16,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 17, color: colors.text, padding: 0 },
  multiline: { paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top', lineHeight: 22 },
  hint: { ...type.caption, color: colors.textFaint },
});
