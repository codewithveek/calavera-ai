import { StyleSheet, View } from 'react-native';

import { formatBytes } from '@/shared/lib/format';
import { colors, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Card } from '@/shared/ui/Card';
import { ProgressBar } from '@/shared/ui/ProgressBar';

import type { FileStatus } from '../status';
import { useDownloadProgress } from '../useDownloadProgress';

interface DownloadFileListProps {
  files: FileStatus[];
  totalBytes: number;
}

/** Per-file breakdown. Isolated subscriber: only this card and the footer summary re-render on progress ticks. */
export function DownloadFileList({ files, totalBytes }: DownloadFileListProps) {
  const { rows } = useDownloadProgress(files, totalBytes);

  return (
    <Card>
      <AppText variant="label" tone="muted">
        IN THIS PACK
      </AppText>
      <View style={styles.files}>
        {rows.map((row) => (
          <View key={row.file.id} style={styles.file}>
            <AppText variant="label" style={row.active ? styles.activeLabel : undefined}>
              {row.installed ? '✓ ' : row.active ? '↓ ' : '· '}
              {row.file.label}
            </AppText>
            <AppText variant="caption" tone="muted">
              {row.installed ? 'Verified' : `${formatBytes(row.bytes)} / ${formatBytes(row.file.sizeBytes)}`}
            </AppText>
            {row.active ? (
              <ProgressBar progress={row.bytes / row.file.sizeBytes} color={colors.rosa} />
            ) : null}
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  files: { gap: spacing.md },
  file: { gap: spacing.xxs },
  activeLabel: { color: colors.marigold },
});
