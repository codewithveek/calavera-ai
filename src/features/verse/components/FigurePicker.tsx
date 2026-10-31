import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Chip } from '@/shared/ui/Chip';

import { DEATH_FIGURES, type DeathFigureId } from '../tones';

interface FigurePickerProps {
  value: DeathFigureId;
  onChange: (id: DeathFigureId) => void;
}

export function FigurePicker({ value, onChange }: FigurePickerProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label">Death arrives as</AppText>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {DEATH_FIGURES.map((figure) => (
          <Chip key={figure.id} label={figure.name} selected={figure.id === value} onPress={() => onChange(figure.id)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
