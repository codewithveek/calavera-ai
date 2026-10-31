import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/shared/theme/tokens';

interface CardProps {
  children: ReactNode;
  highlighted?: boolean;
  style?: ViewStyle;
}

export function Card({ children, highlighted = false, style }: CardProps) {
  return <View style={[styles.card, highlighted && styles.highlighted, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.nightRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  highlighted: { borderColor: colors.marigold },
});
