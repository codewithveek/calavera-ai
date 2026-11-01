import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { File } from 'expo-file-system';
import { useState } from 'react';

import { useActivePack } from '@/features/models/hooks';
import { toErrorMessage } from '@/shared/lib/errors';
import { haptics } from '@/shared/lib/haptics';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { TextField } from '@/shared/ui/TextField';

import { restoreArchive } from '../archive';
import { describeSummary, summarize, type BackupPayload } from '../payload';
import { openBackup, pickBackupFile } from '../service';

export function RestoreBackupCard() {
  const pack = useActivePack();
  const client = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [payload, setPayload] = useState<BackupPayload | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const pick = useMutation({
    mutationFn: pickBackupFile,
    onSuccess: (picked) => {
      if (!picked) return;
      setFile(picked);
      setPayload(null);
      restore.reset();
    },
  });
  const open = useMutation({
    mutationFn: (backup: File) => openBackup(backup, passphrase),
    onSuccess: setPayload,
  });
  const restore = useMutation({
    mutationFn: (backup: BackupPayload) =>
      restoreArchive(pack, backup, (done, total) => setProgress({ done, total })),
    onSuccess: () => {
      haptics.success();
      setPassphrase('');
      return client.invalidateQueries();
    },
  });

  const error = pick.error ?? open.error ?? restore.error;

  return (
    <Card>
      <AppText variant="heading">Restore</AppText>
      <AppText tone="muted">
        Open a backup made on any phone, yours or a relative&apos;s. Loved ones already here are not duplicated.
      </AppText>

      <Button
        label={file ? `📄 ${file.name}` : 'Choose a backup file'}
        variant="secondary"
        loading={pick.isPending}
        onPress={() => pick.mutate()}
      />

      {file && !payload ? (
        <>
          <TextField
            label="Passphrase"
            value={passphrase}
            onChangeText={setPassphrase}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label={open.isPending ? 'Unlocking on this phone…' : 'Unlock'}
            icon="🔓"
            disabled={passphrase.length === 0}
            loading={open.isPending}
            onPress={() => open.mutate(file)}
          />
        </>
      ) : null}

      {payload && !restore.data ? (
        <>
          <AppText tone="accent">{describeSummary(summarize(payload))}</AppText>
          {restore.isPending ? (
            <>
              <ProgressBar
                progress={progress.total ? progress.done / progress.total : 0}
                accessibilityLabel="Restore progress"
              />
              <AppText variant="caption" tone="muted">
                Re-reading memories on this phone… {progress.done} of {progress.total}
              </AppText>
            </>
          ) : (
            <Button label="Add to this phone" icon="🕯️" onPress={() => restore.mutate(payload)} />
          )}
        </>
      ) : null}

      {restore.data ? (
        <AppText tone="accent">
          {restore.data.added.length > 0 ? `Added ${restore.data.added.join(', ')}.` : 'Nobody new to add.'}
          {restore.data.skipped.length > 0 ? ` Already here: ${restore.data.skipped.join(', ')}.` : ''}
        </AppText>
      ) : null}

      {error ? <AppText tone="danger">{toErrorMessage(error)}</AppText> : null}
    </Card>
  );
}
