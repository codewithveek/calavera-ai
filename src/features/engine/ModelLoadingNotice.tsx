import { StyleSheet, View } from 'react-native';

import { formatPercent } from '@/shared/lib/format';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { ProgressBar } from '@/shared/ui/ProgressBar';

import { useEngineStore } from './engineStore';

/** Shows while a model is being mapped into memory; renders nothing otherwise. */
export function ModelLoadingNotice() {
  const loading = useEngineStore((state) => state.loading);
  if (!loading) return null;

  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      {/* llama.cpp maps the whole file before reporting tensor progress, so 0% would look stuck. */}
      <AppText variant="label">
        Waking {loading.label}…{loading.progress > 0 ? ` ${formatPercent(loading.progress)}` : ''}
      </AppText>
      <ProgressBar progress={loading.progress} color={colors.turquoise} accessibilityLabel="Model loading" />
      <AppText variant="caption" tone="muted">
        Loading weights from your phone&apos;s storage. Nothing is sent anywhere.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.nightSunken,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
