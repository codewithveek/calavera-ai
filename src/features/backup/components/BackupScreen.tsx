import { Stack } from 'expo-router';

import { useProfile } from '@/features/profiles/hooks';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { LoadingState } from '@/shared/ui/States';

import { CreateBackupCard } from './CreateBackupCard';
import { RestoreBackupCard } from './RestoreBackupCard';

/** Encrypted backups: everyone, or one loved one to share with family. */
export function BackupScreen({ profileId }: { profileId: number | null }) {
  if (profileId !== null) return <SharePersonScreen profileId={profileId} />;

  return (
    <Screen>
      <AppText tone="muted">
        Your archive lives only on this phone. A backup is one encrypted file that you keep or send wherever you
        like. It is locked with a passphrase that never leaves this phone.
      </AppText>
      <CreateBackupCard />
      <RestoreBackupCard />
    </Screen>
  );
}

function SharePersonScreen({ profileId }: { profileId: number }) {
  const profile = useProfile(profileId);
  if (profile.isPending) return <LoadingState />;
  const name = profile.data?.name;

  return (
    <Screen>
      <Stack.Screen options={{ title: name ? `Share ${name}` : 'Share' }} />
      <CreateBackupCard profileId={profileId} personName={name} />
    </Screen>
  );
}
