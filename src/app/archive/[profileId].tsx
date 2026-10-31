import { useLocalSearchParams } from 'expo-router';

import { ProfileArchiveScreen } from '@/features/archive/ProfileArchiveScreen';

export default function ProfileArchiveRoute() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <ProfileArchiveScreen key={profileId} profileId={Number(profileId)} />;
}
