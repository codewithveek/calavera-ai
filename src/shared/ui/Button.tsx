import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { haptics } from '@/shared/lib/haptics';
import { colors, MIN_TOUCH, radii, spacing } from '@/shared/theme/tokens';

import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  /** A leading glyph (emoji); keeps the bundle free of icon fonts. */
  icon?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      onPress={(event) => {
        haptics.tap();
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        inactive && styles.disabled,
      ]}
    >
      {/* The label stays laid out (just invisible) while loading, so the button never changes size. */}
      <View style={[styles.content, loading && styles.hidden]}>
        {icon ? <AppText style={styles.icon}>{icon}</AppText> : null}
        <AppText variant="label" style={variant === 'primary' ? styles.primaryLabel : undefined}>
          {label}
        </AppText>
      </View>
      {loading ? (
        <ActivityIndicator style={StyleSheet.absoluteFill} color={variant === 'primary' ? colors.night : colors.bone} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hidden: { opacity: 0 },
  icon: { fontSize: 18 },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  primaryLabel: { color: colors.night },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.marigold },
  secondary: { backgroundColor: colors.nightRaised, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
});
