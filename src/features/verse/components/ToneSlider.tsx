import Slider from '@react-native-community/slider';
import { StyleSheet, View } from 'react-native';

import { haptics } from '@/shared/lib/haptics';
import { colors, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';

import { TONES, toneAt } from '../tones';

interface ToneSliderProps {
  level: number;
  onChange: (level: number) => void;
  disabled?: boolean;
}

export function ToneSlider({ level, onChange, disabled }: ToneSliderProps) {
  const tone = toneAt(level);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="label">Tone</AppText>
        <AppText variant="label" tone="accent">
          {tone.label} · {tone.english}
        </AppText>
      </View>
      <Slider
        accessibilityLabel="Tone"
        accessibilityValue={{ text: `${tone.label}, ${tone.english}` }}
        value={level}
        minimumValue={0}
        maximumValue={TONES.length - 1}
        step={1}
        disabled={disabled}
        onValueChange={(value) => {
          if (value !== level) haptics.tap();
          onChange(value);
        }}
        minimumTrackTintColor={colors.rosa}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.marigold}
        style={styles.slider}
      />
      <View style={styles.ends}>
        <AppText variant="caption" tone="muted">
          Tender homage
        </AppText>
        <AppText variant="caption" tone="muted">
          Biting satire
        </AppText>
      </View>
      <AppText variant="caption" tone="muted">
        {tone.directive}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  slider: { height: 40 },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
});
