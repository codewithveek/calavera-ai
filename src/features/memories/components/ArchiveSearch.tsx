import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { toErrorMessage } from '@/shared/lib/errors';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { TextField } from '@/shared/ui/TextField';

import { useMemorySearch } from '../hooks';

interface ArchiveSearchProps {
  onOpenProfile: (profileId: number) => void;
}

/** Semantic search: the query is embedded on-device and matched in sqlite-vec. */
export function ArchiveSearch({ onOpenProfile }: ArchiveSearchProps) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 400);
  const search = useMemorySearch(debounced);

  return (
    <View style={styles.container}>
      <TextField
        label="Ask the archive"
        value={query}
        onChangeText={setQuery}
        placeholder="Who loved to dance?"
        returnKeyType="search"
        hint="Finds stories by what they mean, not just the exact words. Works offline."
      />
      {search.isFetching ? <ActivityIndicator color={colors.marigold} /> : null}
      {search.isError ? <AppText tone="danger">{toErrorMessage(search.error)}</AppText> : null}
      {debounced.trim().length >= 3 && search.data?.length === 0 ? (
        <AppText tone="muted">No memories match that yet.</AppText>
      ) : null}
      {search.data?.map((match) => (
        <Pressable
          key={match.chunkId}
          accessibilityRole="button"
          onPress={() => onOpenProfile(match.profileId)}
          style={({ pressed }) => [styles.result, pressed && styles.pressed]}
        >
          <View style={styles.resultHeader}>
            <AppText variant="label" tone="accent">
              {match.profileName}
            </AppText>
            <AppText variant="caption" tone="muted">
              {Math.round(match.similarity * 100)}% match
            </AppText>
          </View>
          <AppText numberOfLines={3}>{match.content}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  result: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.nightSunken,
    borderLeftWidth: 3,
    borderLeftColor: colors.turquoise,
    gap: spacing.xs,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  pressed: { opacity: 0.85 },
});
