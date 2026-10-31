import { StyleSheet, View } from 'react-native';

import { ModelLoadingNotice } from '@/features/engine/ModelLoadingNotice';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';

import { cleanTranslation, parseVerseOutput } from '../parser';
import { useVerseSession } from '../verseStore';

/**
 * The only component subscribed to streamed tokens, so the form above it
 * never re-renders during generation.
 */
export function StreamingPoem() {
  const phase = useVerseSession((state) => state.phase);
  const raw = useVerseSession((state) => state.raw);
  const translation = useVerseSession((state) => state.translation);
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
        : phase === 'translating'
          ? 'Translating into English…'
          : planning
          ? 'Finding rhymes…'
          : poem
            ? 'Writing on this phone…'
            : `Reading ${memoriesUsed} ${memoriesUsed === 1 ? 'memory' : 'memories'}…`;

  return (
    <View style={styles.panel}>
      <AppText variant="caption" tone="accent" accessibilityLiveRegion="polite">
        {status}
      </AppText>
      <ModelLoadingNotice />
      {planning && notes ? (
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          Rhymes (rimas): {notes}
        </AppText>
      ) : null}
      {poem ? (
        <AppText serif style={styles.poem}>
          {poem}
          {phase === 'writing' ? <AppText tone="accent">▍</AppText> : null}
        </AppText>
      ) : null}
      {phase === 'translating' || translation ? (
        <View style={styles.translation}>
          <AppText variant="label" tone="muted">
            In English
          </AppText>
          <AppText serif style={[styles.poem, styles.translated]}>
            {cleanTranslation(translation)}
            {phase === 'translating' ? <AppText tone="accent">▍</AppText> : null}
          </AppText>
        </View>
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
  translation: { gap: spacing.xs, marginTop: spacing.sm },
  translated: { fontStyle: 'italic', color: colors.boneMuted },
});
