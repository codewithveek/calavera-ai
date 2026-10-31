import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { formatDate } from '@/shared/lib/format';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';

import type { Memory } from '../types';

interface MemoryRowProps {
  memory: Memory;
  onDelete: (memoryId: number) => void;
}

export function MemoryRow({ memory, onDelete }: MemoryRowProps) {
  const confirmDelete = () =>
    Alert.alert('Forget this memory?', 'It will be removed from the archive and its vectors deleted.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Forget', style: 'destructive', onPress: () => onDelete(memory.id) },
    ]);

  return (
    <Pressable
      onLongPress={confirmDelete}
      accessibilityHint="Long press to forget this memory"
      style={styles.row}
    >
      <View style={styles.meta}>
        <AppText variant="caption" tone="accent">
          {memory.source === 'heirloom' ? '📷 Heirloom' : '📜 Story'}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatDate(memory.createdAt)}
        </AppText>
      </View>
      <AppText>{memory.body}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.nightRaised,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
});
