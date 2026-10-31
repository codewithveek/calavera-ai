import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ModelLoadingNotice } from '@/features/engine/ModelLoadingNotice';
import { useSaveHeirloom } from '@/features/ofrenda/hooks';
import { ProfilePicker } from '@/features/profiles/components/ProfilePicker';
import { useResolvedProfileId } from '@/features/profiles/hooks';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { toErrorMessage } from '@/shared/lib/errors';
import { haptics } from '@/shared/lib/haptics';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { LoadingState } from '@/shared/ui/States';
import { TextField } from '@/shared/ui/TextField';

import type { HeirloomAnalysis } from '../analyzer';
import { useHeirloomAnalysis } from '../hooks';
import type { PreparedImage } from '../imagePrep';
import { AnalysisCard } from './AnalysisCard';
import { CameraCapture } from './CameraCapture';

/** Screen 3: capture → on-device vision → cultural placement → save to the ofrenda. */
export function SoulMirrorScreen() {
  const analysis = useHeirloomAnalysis();
  const [photo, setPhoto] = useState<PreparedImage | null>(null);

  const capture = (captured: PreparedImage) => {
    setPhoto(captured);
    analysis.mutate(captured);
  };
  const retake = () => {
    analysis.reset();
    setPhoto(null);
  };

  if (!photo) {
    return (
      <Screen scroll={false}>
        <CameraCapture onCaptured={capture} />
      </Screen>
    );
  }

  if (analysis.data) return <PlacementForm analysis={analysis.data} onRetake={retake} />;

  return (
    <Screen>
      <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="cover" />
      {analysis.isError ? (
        <>
          <AppText tone="danger">{toErrorMessage(analysis.error)}</AppText>
          <Button label="Try another photo" variant="secondary" onPress={retake} />
        </>
      ) : (
        <>
          <ModelLoadingNotice />
          <LoadingState label="The mirror is looking… (all on this phone)" />
        </>
      )}
    </Screen>
  );
}

function PlacementForm({ analysis, onRetake }: { analysis: HeirloomAnalysis; onRetake: () => void }) {
  const goBack = useGoBack();
  const save = useSaveHeirloom();
  const [chosenProfileId, setProfileId] = useState<number | null>(null);
  const profileId = useResolvedProfileId(chosenProfileId);
  const [note, setNote] = useState('');

  const submit = () => {
    if (profileId === null) return;
    save.mutate(
      { profileId, analysis, note },
      {
        onSuccess: () => {
          haptics.success();
          goBack();
        },
      },
    );
  };

  return (
    <Screen
      footer={
        <View style={styles.actions}>
          <Button label="Retake" variant="secondary" onPress={onRetake} />
          <View style={styles.flex}>
            <Button
              label={save.isPending ? 'Placing on the altar…' : 'Place on the ofrenda'}
              icon="🕯️"
              disabled={profileId === null}
              loading={save.isPending}
              onPress={submit}
            />
          </View>
        </View>
      }
    >
      <AnalysisCard analysis={analysis} />
      <ProfilePicker label="Whose ofrenda is this for?" selectedId={profileId} onSelect={setProfileId} />
      <TextField
        label="Why does it matter? (optional)"
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="They wore this hat to every family wedding…"
        hint="Saved with their memories to inspire their calaverita."
      />
      {save.isError ? <AppText tone="danger">{toErrorMessage(save.error)}</AppText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', aspectRatio: 1, borderRadius: radii.lg, backgroundColor: colors.nightSunken },
  actions: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
