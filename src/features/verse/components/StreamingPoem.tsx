import { StyleSheet, View } from 'react-native';

import { ModelLoadingNotice } from '@/features/engine/ModelLoadingNotice';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';

import { parseVerseOutput } from '../parser';
import { useVerseSession } from '../verseStore';

/**
 * The only component subscribed to streamed tokens, so the form above it
 * never re-renders during generation.
 */
export function StreamingPoem() {
  const phase = useVerseSession((state) => state.phase);
  const raw = useVerseSession((state) => state.raw);
  const memoriesUsed = useVerseSession((state) => state.memoriesUsed);
  const error = useVerseSession((state) => state.error);

  if (phase === 'idle') return null;
  if (phase === 'error') {
    return (
      <AppText tone="danger" accessibilityLiveRegion="assertive">
        {error}
      </AppText>
    );
  }

  const { planning, notes, poem } = parseVerseOutput(raw);
  const status =
    phase === 'retrieving'
      ? 'Consulting the memory archive…'
      : phase === 'saving'
        ? 'Inscribing the tribute…'
        : planning
          ? 'Choosing rhymes in a hidden scratchpad…'
          : poem
            ? 'Writing on this phone…'
            : `Reading ${memoriesUsed} ${memoriesUsed === 1 ? 'memory' : 'memories'} into the prompt…`;

  return (
    <View style={styles.panel}>
      <AppText variant="caption" tone="accent" accessibilityLiveRegion="polite">
        {status}
      </AppText>
      <ModelLoadingNotice />
      {planning && notes ? (
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          Rimas: {notes}
        </AppText>
      ) : null}
      {poem ? (
        <AppText serif style={styles.poem}>
          {poem}
          {phase === 'writing' ? <AppText tone="accent">▍</AppText> : null}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.nightSunken,
    borderWidth: 1,
    borderColor: colors.border,
  },
  poem: { fontSize: 18, lineHeight: 28 },
});
