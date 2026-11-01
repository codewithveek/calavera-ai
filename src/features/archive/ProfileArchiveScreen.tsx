import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { MemoryComposer } from '@/features/memories/components/MemoryComposer';
import { MemoryRow } from '@/features/memories/components/MemoryRow';
import { useDeleteMemory, useMemories } from '@/features/memories/hooks';
import { useDeleteProfile, useProfile } from '@/features/profiles/hooks';
import { TributeList } from '@/features/tributes/components/TributeList';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { toErrorMessage } from '@/shared/lib/errors';
import { colors, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/States';

/** Screen 4 (detail): one loved one's memories, tributes and the composer that feeds the vector store. */
export function ProfileArchiveScreen({ profileId }: { profileId: number }) {
  const router = useRouter();
  const goBack = useGoBack('/archive');
  const profile = useProfile(profileId);
  const memories = useMemories(profileId);
  const deleteMemory = useDeleteMemory();
  const deleteProfile = useDeleteProfile();

  if (profile.isPending || memories.isPending) return <LoadingState />;
  if (profile.isError || memories.isError) {
    return <ErrorState message={toErrorMessage(profile.error ?? memories.error)} />;
  }
  if (!profile.data) return <EmptyState glyph="🕯️" title="Not found" body="This loved one is no longer in the archive." />;

  const person = profile.data;
  const confirmDelete = () =>
    Alert.alert(`Remove ${person.name}?`, 'Their memories, ofrenda items and calaveritas will be deleted.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteProfile.mutate(person.id, { onSuccess: goBack }),
      },
    ]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: person.name }} />
      <FlashList
        data={memories.data}
        keyExtractor={(memory) => String(memory.id)}
        renderItem={({ item }) => <MemoryRow memory={item} onDelete={deleteMemory.mutate} />}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.identity}>
              {person.relation || person.lifeSpan ? (
                <AppText tone="accent">{[person.relation, person.lifeSpan].filter(Boolean).join(' · ')}</AppText>
              ) : null}
              {person.essence ? <AppText tone="muted">{person.essence}</AppText> : null}
            </View>
            <Button
              label={`Write ${person.name}'s calaverita`}
              icon="💀"
              onPress={() => router.push({ pathname: '/verse', params: { profileId: String(person.id) } })}
            />
            <Button
              label={`Share ${person.name} with family`}
              icon="🔐"
              variant="secondary"
              onPress={() => router.push({ pathname: '/backup', params: { profileId: String(person.id) } })}
            />
            <TributeList profileId={person.id} />
            <MemoryComposer profileId={person.id} name={person.name} />
            <AppText variant="label" tone="muted">
              MEMORIES · press and hold one to forget it
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <AppText tone="muted" center>
            No memories yet. Every story you save makes their calaverita more personal.
          </AppText>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button label={`Remove ${person.name}`} variant="danger" onPress={confirmDelete} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.lg },
  header: { gap: spacing.lg, marginBottom: spacing.md },
  identity: { gap: spacing.xs },
  footer: { marginTop: spacing.xl },
});
