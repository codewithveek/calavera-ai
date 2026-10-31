import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';

import { TIERS, type OfrendaTier } from '../tiers';
import type { OfrendaItem } from '../types';
import { OfrendaItemThumb, THUMB_SIZE } from './OfrendaItemThumb';

const MAX_VISIBLE = 4;

const CLOTH: Record<OfrendaTier, string> = {
  cielo: colors.purple,
  tierra: colors.rosa,
  inframundo: colors.marigoldDeep,
};

const WIDTH: Record<OfrendaTier, `${number}%`> = { cielo: '72%', tierra: '86%', inframundo: '100%' };

interface AltarTierProps {
  tier: OfrendaTier;
  items: OfrendaItem[];
  onItemPress: (item: OfrendaItem) => void;
  onEmptyPress: () => void;
}

export function AltarTier({ tier, items, onItemPress, onEmptyPress }: AltarTierProps) {
  const visible = items.slice(0, MAX_VISIBLE);
  const hidden = items.length - visible.length;
  const info = TIERS[tier];

  return (
    <View style={[styles.tier, { width: WIDTH[tier] }]}>
      <View style={styles.shelf}>
        {visible.map((item) => (
          <OfrendaItemThumb key={item.id} item={item} onPress={onItemPress} />
        ))}
        {hidden > 0 ? (
          <View style={styles.more}>
            <AppText variant="label">+{hidden}</AppText>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add an heirloom to the ${info.name} tier`}
          onPress={onEmptyPress}
          style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
        >
          <AppText style={styles.plus}>+</AppText>
        </Pressable>
      </View>
      <View style={[styles.cloth, { backgroundColor: CLOTH[tier] }]}>
        <AppText variant="label" style={styles.clothLabel}>
          {info.name}
        </AppText>
        <AppText variant="caption" style={styles.clothCaption}>
          {info.english}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tier: { alignSelf: 'center' },
  shelf: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: THUMB_SIZE + spacing.sm,
    paddingBottom: spacing.xs,
  },
  cloth: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  clothLabel: { color: colors.bone, fontFamily: fonts.serif },
  clothCaption: { color: colors.bone, opacity: 0.8 },
  slot: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.boneMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { fontSize: 24, color: colors.boneMuted },
  more: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.sm,
    backgroundColor: colors.nightRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
