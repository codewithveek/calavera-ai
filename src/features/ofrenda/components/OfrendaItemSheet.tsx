import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';

import { useRemoveOfrendaItem } from '../hooks';
import { TIERS } from '../tiers';
import type { OfrendaItem } from '../types';

interface OfrendaItemSheetProps {
  item: OfrendaItem | null;
  onClose: () => void;
}

export function OfrendaItemSheet({ item, onClose }: OfrendaItemSheetProps) {
  const insets = useSafeAreaInsets();
  const removal = useRemoveOfrendaItem();

  return (
    <Modal visible={item !== null} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close details" />
      {item ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Image source={{ uri: item.imageUri }} style={styles.image} contentFit="cover" />
          <AppText variant="title">{item.name}</AppText>
          <AppText tone="accent">
            {TIERS[item.tier].name} · {TIERS[item.tier].english} · for {item.profileName}
          </AppText>
          <AppText tone="muted">{item.description}</AppText>
          <AppText>{item.meaning}</AppText>
          <View style={styles.actions}>
            <Button
              label="Remove from altar"
              variant="danger"
              loading={removal.isPending}
              onPress={() => removal.mutate(item, { onSuccess: onClose })}
            />
            <Button label="Close" variant="secondary" onPress={onClose} />
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.nightRaised,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: radii.md, backgroundColor: colors.nightSunken },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.sm },
});
