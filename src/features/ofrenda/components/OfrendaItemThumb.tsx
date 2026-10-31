import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radii } from '@/shared/theme/tokens';

import type { OfrendaItem } from '../types';

export const THUMB_SIZE = 52;

export function OfrendaItemThumb({ item, onPress }: { item: OfrendaItem; onPress: (item: OfrendaItem) => void }) {
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={`${item.name}, for ${item.profileName}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.thumb, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: item.imageUri }}
        style={styles.image}
        contentFit="cover"
        recyclingKey={String(item.id)}
        transition={120}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.candle,
    overflow: 'hidden',
    backgroundColor: colors.nightSunken,
  },
  image: { width: '100%', height: '100%' },
  pressed: { opacity: 0.8 },
});
