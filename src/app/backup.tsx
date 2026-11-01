import { useLocalSearchParams } from 'expo-router';

import { BackupScreen } from '@/features/backup/components/BackupScreen';

export default function BackupRoute() {
  const { profileId } = useLocalSearchParams<{ profileId?: string }>();
  return <BackupScreen profileId={profileId ? Number(profileId) : null} />;
}
