import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { toErrorMessage } from '@/shared/lib/errors';
import { formatBytes } from '@/shared/lib/format';
import { haptics } from '@/shared/lib/haptics';
import { spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { TextField } from '@/shared/ui/TextField';

import { createBackup, MIN_PASSPHRASE_LENGTH, saveBackupToFolder, shareBackup, type BackupBundle } from '../service';

interface CreateBackupCardProps {
  /** One loved one ("share with family"), or everyone when undefined. */
  profileId?: number;
  personName?: string;
}

export function CreateBackupCard({ profileId, personName }: CreateBackupCardProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [backup, setBackup] = useState<BackupBundle | null>(null);

  const create = useMutation({
    mutationFn: () => createBackup(passphrase, profileId),
    onSuccess: (bundle) => {
      haptics.success();
      setBackup(bundle);
    },
  });
  const share = useMutation({ mutationFn: (bundle: BackupBundle) => shareBackup(bundle) });
  const save = useMutation({ mutationFn: (bundle: BackupBundle) => saveBackupToFolder(bundle) });

  const tooShort = passphrase.length < MIN_PASSPHRASE_LENGTH;
  const mismatch = confirmation.length > 0 && confirmation !== passphrase;
  const error = create.error ?? share.error ?? save.error;
  const subject = personName ? `${personName}'s memories` : 'your whole archive';

  return (
    <Card>
      <AppText variant="heading">{personName ? `Share ${personName}` : 'Back up'}</AppText>
      <AppText tone="muted">
        {personName
          ? `Makes one encrypted file with ${personName}'s profile, memories, heirloom photos and calaveritas. Send it to family: they add ${personName} to their own Calavera AI with the passphrase.`
          : 'Makes one encrypted file with your loved ones, memories, heirloom photos and calaveritas. Keep it on Drive, send it to yourself, or move it to a new phone. The offline AI is not included: a new phone downloads it again.'}
      </AppText>

      {backup ? (
        <View style={styles.ready}>
          <AppText tone="accent">
            🔐 {backup.name} · {formatBytes(backup.bytes.length)}
          </AppText>
          <View style={styles.actions}>
            <Button label="Send or save" icon="📤" loading={share.isPending} onPress={() => share.mutate(backup)} />
            <Button
              label={save.data ? 'Saved' : 'Save to a folder'}
              icon="📁"
              variant="secondary"
              loading={save.isPending}
              onPress={() => save.mutate(backup)}
            />
          </View>
        </View>
      ) : (
        <>
          <TextField
            label="Passphrase"
            value={passphrase}
            onChangeText={setPassphrase}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            hint={`At least ${MIN_PASSPHRASE_LENGTH} characters. Nobody can open the backup without it, not even us, so keep it somewhere safe.`}
          />
          <TextField
            label="Passphrase again"
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            hint={mismatch ? 'The passphrases do not match yet.' : undefined}
          />
          <Button
            label={create.isPending ? 'Encrypting on this phone…' : `Encrypt ${subject}`}
            icon="🔐"
            disabled={tooShort || confirmation !== passphrase}
            loading={create.isPending}
            onPress={() => create.mutate()}
          />
        </>
      )}

      {error ? <AppText tone="danger">{toErrorMessage(error)}</AppText> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  ready: { gap: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
