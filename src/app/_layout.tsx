import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useEngineLifecycle } from '@/features/engine/useEngineLifecycle';
import { useModelsReady } from '@/features/models/hooks';
import { AppProviders } from '@/shared/providers/AppProviders';
import { colors, fonts } from '@/shared/theme/tokens';

export { RouteErrorBoundary as ErrorBoundary } from '@/shared/ui/RouteErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const SCREEN_OPTIONS = {
  headerStyle: { backgroundColor: colors.night },
  headerTintColor: colors.bone,
  headerTitleStyle: { fontFamily: fonts.serif, fontWeight: '700' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.night },
  animation: 'fade_from_bottom' as const,
};

function RootNavigator() {
  const { ready, isPending } = useModelsReady();
  useEngineLifecycle();

  useEffect(() => {
    if (!isPending) SplashScreen.hideAsync().catch(() => undefined);
  }, [isPending]);

  if (isPending) return null;

  return (
    <Stack screenOptions={SCREEN_OPTIONS} activityEnabled>
      {/* Every feature needs on-device weights: until they are verified, all routes lead to setup. */}
      <Stack.Protected guard={ready} redirectTo="/models">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="mirror" options={{ title: 'Soul Mirror' }} />
        <Stack.Screen name="archive/index" options={{ title: 'Memory Archive' }} />
        <Stack.Screen name="archive/[profileId]" options={{ title: '' }} />
        <Stack.Screen name="verse" options={{ title: 'Calaveritas' }} />
        <Stack.Screen name="tribute/[tributeId]" options={{ title: 'Tribute' }} />
      </Stack.Protected>
      <Stack.Screen name="models" options={{ title: 'Offline AI', headerShown: ready }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <RootNavigator />
    </AppProviders>
  );
}
