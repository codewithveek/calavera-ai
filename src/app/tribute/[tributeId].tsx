import { useLocalSearchParams } from 'expo-router';

import { TributeScreen } from '@/features/tributes/components/TributeScreen';

export default function TributeRoute() {
  const { tributeId } = useLocalSearchParams<{ tributeId: string }>();
  return <TributeScreen key={tributeId} tributeId={Number(tributeId)} />;
}
