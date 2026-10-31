import { Pressable, StyleSheet, View } from 'react-native';

import { formatBytes } from '@/shared/lib/format';
import { haptics } from '@/shared/lib/haptics';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';

import { packSizeBytes, type ModelPack } from '../registry';

interface PackOptionProps {
  pack: ModelPack;
  selected: boolean;
  recommended: boolean;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
}

export function PackOption({ pack, selected, recommended, active, disabled, onSelect }: PackOptionProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${pack.name}, ${formatBytes(packSizeBytes(pack))}`}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onSelect();
      }}
      style={[styles.option, selected && styles.selected, disabled && !selected && styles.dimmed]}
    >
      <View style={styles.header}>
        <AppText variant="heading" style={styles.name}>
          {pack.name}
        </AppText>
        {active ? <Badge label="In use" color={colors.success} /> : null}
        {recommended && !active ? <Badge label="Recommended" color={colors.marigold} /> : null}
      </View>
      <AppText tone="muted">{pack.tagline}</AppText>
      <AppText variant="label">
        {formatBytes(packSizeBytes(pack))} · writer {pack.textModelLabel} · eyes {pack.visionModelLabel}
      </AppText>
    </Pressable>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.nightRaised,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  selected: { borderColor: colors.marigold },
  dimmed: { opacity: 0.5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { flexShrink: 1 },
  badge: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },
});
