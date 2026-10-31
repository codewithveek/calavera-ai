import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/shared/theme/tokens';

interface ProgressBarProps {
  /** 0..1 */
  progress: number;
  color?: string;
  accessibilityLabel?: string;
}

/**
 * Animates via `scaleX` rather than width, so progress updates never trigger
 * a layout pass.
 */
export function ProgressBar({ progress, color = colors.marigold, accessibilityLabel }: ProgressBarProps) {
  const value = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <View style={[styles.fill, { backgroundColor: color, transform: [{ scaleX: value }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: radii.pill, backgroundColor: colors.nightSunken, overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFill, transformOrigin: 'left' },
});
