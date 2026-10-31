import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontSizes, MIN_TOUCH, radii, spacing } from '@/shared/theme/tokens';

import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, multiline, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...rest}
        accessibilityLabel={label}
        accessibilityHint={hint}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.marigold}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multiline, style]}
      />
      {hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    minHeight: MIN_TOUCH,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.nightSunken,
    color: colors.bone,
    fontSize: fontSizes.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: { minHeight: 140 },
});
