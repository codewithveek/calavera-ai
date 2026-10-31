import { useLocalSearchParams } from 'expo-router';

import { VerseEngineScreen } from '@/features/verse/components/VerseEngineScreen';

export default function VerseRoute() {
  const { profileId } = useLocalSearchParams<{ profileId?: string }>();
  return <VerseEngineScreen initialProfileId={profileId ? Number(profileId) : null} />;
}
