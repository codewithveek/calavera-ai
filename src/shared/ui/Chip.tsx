import { Pressable, StyleSheet } from 'react-native';

import { haptics } from '@/shared/lib/haptics';
import { colors, MIN_TOUCH, radii, spacing } from '@/shared/theme/tokens';

import { AppText } from './AppText';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <AppText variant="label" style={selected ? styles.selectedLabel : undefined}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH - 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.nightRaised,
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.rosa, borderColor: colors.rosa },
  selectedLabel: { color: colors.bone },
  pressed: { opacity: 0.8 },
});
