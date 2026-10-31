import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { TIERS } from '@/features/ofrenda/tiers';
import { formatDuration } from '@/shared/lib/format';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Card } from '@/shared/ui/Card';

import type { HeirloomAnalysis } from '../analyzer';

export function AnalysisCard({ analysis }: { analysis: HeirloomAnalysis }) {
  const tier = TIERS[analysis.tier];

  return (
    <Card highlighted>
      <View style={styles.row}>
        <Image source={{ uri: analysis.imageUri }} style={styles.image} contentFit="cover" />
        <View style={styles.identity}>
          <AppText variant="heading">{analysis.objectName}</AppText>
          <AppText tone="accent" serif>
            {analysis.spanishName}
          </AppText>
          <AppText variant="caption" tone="muted">
            Recognised on this phone in{' '}
            {analysis.seconds < 60 ? `${analysis.seconds.toFixed(1)}s` : formatDuration(analysis.seconds)}
          </AppText>
        </View>
      </View>
      {analysis.description ? <AppText tone="muted">{analysis.description}</AppText> : null}
      <View style={styles.tier}>
        <AppText variant="label">
          Place it on the {tier.name} tier ({tier.english})
        </AppText>
        <AppText>{analysis.meaning}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  image: { width: 88, height: 88, borderRadius: radii.md, backgroundColor: colors.nightSunken },
  identity: { flex: 1, gap: spacing.xxs },
  tier: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.nightSunken,
    borderLeftWidth: 3,
    borderLeftColor: colors.marigold,
  },
});
