import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useGoBack } from '@/shared/hooks/useGoBack';
import { toErrorMessage } from '@/shared/lib/errors';
import { haptics } from '@/shared/lib/haptics';
import { spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/States';

import { saveCardToGallery, shareCard } from '../cardExport';
import { useDeleteTribute, useTribute } from '../hooks';
import type { Tribute } from '../types';
import { useRecitation } from '../useRecitation';
import { MeterAnalysis } from './MeterAnalysis';
import { TributeCard } from './TributeCard';

/** Screen 6: the finished tribute, with recitation and local card export. */
export function TributeScreen({ tributeId }: { tributeId: number }) {
  const tribute = useTribute(tributeId);

  if (tribute.isPending) return <LoadingState />;
  if (tribute.isError) return <ErrorState message={toErrorMessage(tribute.error)} onRetry={tribute.refetch} />;
  if (!tribute.data) return <EmptyState glyph="🕯️" title="Not found" body="This tribute no longer exists." />;
  return <TributeView tribute={tribute.data} />;
}

function TributeView({ tribute }: { tribute: Tribute }) {
  const router = useRouter();
  const goBack = useGoBack();
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const recitation = useRecitation(tribute.poem);
  const share = useMutation({ mutationFn: () => shareCard(cardRef, tribute.profileName) });
  const save = useMutation({ mutationFn: () => saveCardToGallery(cardRef, tribute.profileName), onSuccess: haptics.success });
  const remove = useDeleteTribute();
  const exportError = share.error ?? save.error;

  const confirmDelete = () =>
    Alert.alert('Delete this calaverita?', 'The poem will be removed from this phone.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(tribute.id, { onSuccess: goBack }) },
    ]);

  return (
    <Screen>
      <TributeCard tribute={tribute} cardRef={cardRef} />

      <AppText variant="caption" tone="muted" center>
        Written by {tribute.modelLabel} on this phone
        {tribute.tokensPerSecond ? ` · ${tribute.tokensPerSecond.toFixed(1)} tokens/s` : ''} · Death as {tribute.figure}
      </AppText>

      <View style={styles.actions}>
        <Button
          label={recitation.speaking ? 'Stop' : 'Recite'}
          icon={recitation.speaking ? '⏹️' : '🔊'}
          variant="secondary"
          onPress={recitation.toggle}
        />
        <Button label="Share" icon="📤" variant="secondary" loading={share.isPending} onPress={() => share.mutate()} />
        <Button
          label={save.isSuccess ? 'Saved' : 'Save'}
          icon="🖼️"
          variant="secondary"
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </View>
      {exportError ? <AppText tone="danger">{toErrorMessage(exportError)}</AppText> : null}

      <Button
        label="Write another version"
        icon="💀"
        onPress={() => router.push({ pathname: '/verse', params: { profileId: String(tribute.profileId) } })}
      />

      <MeterAnalysis poem={tribute.poem} />

      <Button label="Delete this calaverita" variant="ghost" onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.sm },
});
