import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';

export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.marigold} size="large" />
      {label ? (
        <AppText tone="muted" center>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

interface EmptyStateProps {
  glyph: string;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ glyph, title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <AppText style={styles.glyph}>{glyph}</AppText>
      <AppText variant="heading" center>
        {title}
      </AppText>
      <AppText tone="muted" center>
        {body}
      </AppText>
      {action}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="assertive">
      <AppText style={styles.glyph}>🕯️</AppText>
      <AppText tone="danger" center>
        {message}
      </AppText>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  glyph: { fontSize: 48, lineHeight: 56 },
});
