import { Alert, StyleSheet, View } from 'react-native';

import { formatBytes } from '@/shared/lib/format';
import { spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { LoadingState } from '@/shared/ui/States';

import { MODEL_PACKS, PACK_ORDER } from '../registry';
import { useModelSetup } from '../useModelSetup';
import { DeviceSummary } from './DeviceSummary';
import { DownloadFileList } from './DownloadFileList';
import { DownloadSummary } from './DownloadSummary';
import { PackOption } from './PackOption';

/** Screen 1: validates local weights and streams any that are missing. */
export function ModelSetupScreen() {
  const setup = useModelSetup();
  if (!setup.device || !setup.status) return <LoadingState label="Checking your downloads…" />;

  return (
    <Screen edges={setup.isActive ? ['bottom'] : ['top', 'bottom']} footer={<SetupActions setup={setup} />}>
      {!setup.isActive ? (
        <View style={styles.hero}>
          <AppText style={styles.skull}>💀</AppText>
          <AppText variant="display" center>
            Calavera AI
          </AppText>
          <AppText tone="muted" center>
            An ofrenda that lives entirely on your phone. Download its AI once, then everything works with the
            internet off: your family&apos;s stories never leave this phone.
          </AppText>
        </View>
      ) : null}

      <DeviceSummary device={setup.device} />

      <View style={styles.packs} accessibilityRole="radiogroup">
        {PACK_ORDER.map((id) => (
          <PackOption
            key={id}
            pack={MODEL_PACKS[id]}
            selected={setup.pack.id === id}
            recommended={setup.device?.recommendedPackId === id}
            active={setup.isActive && setup.pack.id === id}
            disabled={setup.isBusy}
            onSelect={() => setup.viewPack(id)}
          />
        ))}
      </View>

      <DownloadFileList files={setup.status.files} totalBytes={setup.totalBytes} />

      {setup.error ? <AppText tone="danger">{setup.error}</AppText> : null}

      {setup.unusedFiles.length > 0 ? (
        <Button
          variant="secondary"
          icon="🧹"
          label={`Free up ${formatBytes(setup.unusedFiles.reduce((sum, file) => sum + file.sizeBytes, 0))} (other pack)`}
          loading={setup.isRemovingUnused}
          onPress={() => setup.removeUnused()}
        />
      ) : null}
    </Screen>
  );
}

function SetupActions({ setup }: { setup: ReturnType<typeof useModelSetup> }) {
  const summary =
    setup.showProgress && setup.status ? (
      <DownloadSummary files={setup.status.files} totalBytes={setup.totalBytes} />
    ) : null;

  if (setup.isReady) {
    return setup.isActive ? (
      <Button label="Enter the altar" icon="🕯️" onPress={setup.enterAltar} fullWidth />
    ) : (
      <Button
        label={`Use ${setup.pack.name}`}
        icon="🔁"
        loading={setup.isActivating}
        onPress={() => setup.activate()}
        fullWidth
      />
    );
  }

  if (setup.isBusy) {
    const stop = setup.stopCancels
      ? () =>
          Alert.alert('Cancel the download?', 'What has downloaded so far will be deleted.', [
            { text: 'Keep downloading', style: 'cancel' },
            { text: 'Cancel download', style: 'destructive', onPress: () => setup.stopDownload() },
          ])
      : () => setup.stopDownload();

    return (
      <>
        {summary}
        <Button
          label={setup.phase === 'verifying' ? 'Checking…' : setup.stopCancels ? 'Cancel download' : 'Pause download'}
          variant="secondary"
          disabled={setup.phase === 'verifying'}
          onPress={stop}
          fullWidth
        />
        {setup.stopCancels ? (
          <AppText variant="caption" tone="muted" center>
            You can leave the app: the download carries on in the background.
          </AppText>
        ) : null}
      </>
    );
  }

  const missing = setup.status?.missingBytes ?? setup.totalBytes;
  const label = setup.canResume
    ? 'Resume download'
    : setup.phase === 'error'
      ? 'Retry download'
      : `Download ${formatBytes(missing)}`;

  return (
    <>
      {summary}
      <Button label={label} icon="⬇️" onPress={() => setup.startDownload()} fullWidth />
      <AppText variant="caption" tone="muted" center>
        {setup.stopCancels
          ? 'Wi-Fi recommended. It keeps downloading even if you leave the app.'
          : 'Wi-Fi recommended. Downloads resume where they left off.'}
      </AppText>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xl },
  skull: { fontSize: 64, lineHeight: 76 },
  packs: { gap: spacing.md },
});
