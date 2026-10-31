import type { ErrorBoundaryProps } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { toErrorMessage } from '@/shared/lib/errors';
import { colors } from '@/shared/theme/tokens';

import { ErrorState } from './States';

/** Exported as `ErrorBoundary` from route files: a crash in one screen never blanks the app. */
export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.root}>
      <ErrorState message={toErrorMessage(error, 'This screen hit a problem.')} onRetry={retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
});
