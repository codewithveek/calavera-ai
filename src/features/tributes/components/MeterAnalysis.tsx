import { StyleSheet, View } from 'react-native';

import type { VerseLanguage } from '@/features/verse/languages';
import { countSyllables, meterVerdict, OCTOSYLLABLE } from '@/features/verse/meter';
import { toStanzas } from '@/features/verse/parser';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Card } from '@/shared/ui/Card';

const VERDICT_COLOR = { exact: colors.success, close: colors.candle, off: colors.danger } as const;

/** Deterministic métrica check of the model's verse: counts poetic syllables per line. */
export function MeterAnalysis({ poem, language }: { poem: string; language: VerseLanguage }) {
  const lines = toStanzas(poem)
    .flat()
    .map((line) => {
      const syllables = countSyllables(line, language);
      return { line, syllables, verdict: meterVerdict(syllables) };
    });
  const onMeter = lines.filter((line) => line.verdict !== 'off').length;

  return (
    <Card>
      <AppText variant="heading">Métrica · Rhythm check</AppText>
      <AppText tone="muted">
        {onMeter} of {lines.length} lines have the classic {OCTOSYLLABLE}-syllable beat of a calaverita, give or take
        one.
      </AppText>
      <View style={styles.lines}>
        {lines.map(({ line, syllables, verdict }, index) => (
          <View key={index} style={styles.row}>
            <View style={[styles.badge, { borderColor: VERDICT_COLOR[verdict] }]}>
              <AppText variant="caption" style={{ color: VERDICT_COLOR[verdict] }}>
                {syllables}
              </AppText>
            </View>
            <AppText variant="caption" style={styles.text} numberOfLines={1}>
              {line}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  lines: { gap: spacing.xs, marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    minWidth: 28,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  text: { flex: 1 },
});
