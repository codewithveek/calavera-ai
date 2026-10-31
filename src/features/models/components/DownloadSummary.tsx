import { StyleSheet, View } from 'react-native';

import { formatBytes, formatDuration, formatPercent } from '@/shared/lib/format';
import { spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { ProgressBar } from '@/shared/ui/ProgressBar';

import { useDownloadStore, type DownloadWait } from '../downloadStore';
import type { FileStatus } from '../status';
import { useDownloadProgress } from '../useDownloadProgress';

const WAIT_MESSAGES: Record<DownloadWait, string> = {
  network: 'Waiting for an internet connection…',
  wifi: 'Waiting for Wi-Fi…',
  retry: 'The connection dropped. Trying again…',
};

interface DownloadSummaryProps {
  files: FileStatus[];
  totalBytes: number;
}

/** Overall progress, pinned in the setup footer so it stays visible while the pack streams. */
export function DownloadSummary({ files, totalBytes }: DownloadSummaryProps) {
  const { doneBytes, remainingBytes, fraction } = useDownloadProgress(files, totalBytes);
  const bytesPerSecond = useDownloadStore((state) => state.bytesPerSecond);
  const phase = useDownloadStore((state) => state.phase);
  const waitingFor = useDownloadStore((state) => state.waitingFor);
  const showRate = phase === 'downloading' && !waitingFor && bytesPerSecond > 0;

  return (
    <View style={styles.root}>
      <View style={styles.summary}>
        <AppText variant="heading">{formatPercent(fraction)}</AppText>
        <AppText tone="muted">
          {formatBytes(doneBytes)} of {formatBytes(totalBytes)}
        </AppText>
      </View>
      <ProgressBar progress={fraction} accessibilityLabel="Total download progress" />
      {showRate ? (
        <AppText variant="caption" tone="muted">
          About {formatDuration(remainingBytes / bytesPerSecond)} left
        </AppText>
      ) : null}
      {phase === 'downloading' && waitingFor ? (
        <AppText variant="caption" tone="accent">
          {WAIT_MESSAGES[waitingFor]}
        </AppText>
      ) : null}
      {phase === 'verifying' ? (
        <AppText variant="caption" tone="accent">
          Making sure the download is complete…
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs, paddingBottom: spacing.xs },
  summary: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
