import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Chip } from '@/shared/ui/Chip';

import { POEM_LANGUAGES, type PoemLanguage } from '../languages';

interface LanguagePickerProps {
  value: PoemLanguage;
  onChange: (language: PoemLanguage) => void;
}

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const selected = POEM_LANGUAGES.find((language) => language.id === value);

  return (
    <View style={styles.container}>
      <AppText variant="label">Language</AppText>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {POEM_LANGUAGES.map((language) => (
          <Chip
            key={language.id}
            label={language.label}
            selected={language.id === value}
            onPress={() => onChange(language.id)}
          />
        ))}
      </View>
      {selected ? (
        <AppText variant="caption" tone="muted">
          {selected.caption}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
