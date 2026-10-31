import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ArchiveSearch } from '@/features/memories/components/ArchiveSearch';
import { useProfiles } from '@/features/profiles/hooks';
import { ProfileForm } from '@/features/profiles/components/ProfileForm';
import { ProfileRow } from '@/features/profiles/components/ProfileRow';
import { toErrorMessage } from '@/shared/lib/errors';
import { colors, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/States';

/** Screen 4 (index): the people being remembered, plus semantic search across all of them. */
export function ArchiveScreen() {
  const router = useRouter();
  const profiles = useProfiles();
  const [formOpen, setFormOpen] = useState(false);

  const openProfile = (id: number) =>
    router.push({ pathname: '/archive/[profileId]', params: { profileId: String(id) } });

  if (profiles.isPending) return <LoadingState />;
  if (profiles.isError) return <ErrorState message={toErrorMessage(profiles.error)} onRetry={profiles.refetch} />;

  const showForm = formOpen || profiles.data.length === 0;

  return (
    <View style={styles.root}>
      <FlashList
        data={profiles.data}
        keyExtractor={(profile) => String(profile.id)}
        renderItem={({ item }) => <ProfileRow profile={item} onPress={openProfile} />}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            {profiles.data.length > 0 ? <ArchiveSearch onOpenProfile={openProfile} /> : null}
            {showForm ? (
              <ProfileForm
                onCreated={(id) => {
                  setFormOpen(false);
                  openProfile(id);
                }}
                onCancel={profiles.data.length > 0 ? () => setFormOpen(false) : undefined}
              />
            ) : (
              <Button label="Remember someone new" icon="🌼" variant="secondary" onPress={() => setFormOpen(true)} />
            )}
            {profiles.data.length > 0 ? (
              <AppText variant="label" tone="muted">
                YOUR LOVED ONES
              </AppText>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            glyph="🌼"
            title="The archive is waiting"
            body="Add someone you miss. Their stories stay on this phone, ready to inspire their calaverita."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.lg },
  header: { gap: spacing.lg, marginBottom: spacing.md },
});
