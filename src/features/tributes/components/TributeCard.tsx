import { StyleSheet, View, type TextStyle } from 'react-native';

import { toStanzas } from '@/features/verse/parser';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';

import type { CardRef } from '../cardExport';
import type { Tribute } from '../types';

interface TributeCardProps {
  tribute: Tribute;
  cardRef: CardRef;
}

function Stanzas({ text, lineStyle }: { text: string; lineStyle: TextStyle }) {
  return toStanzas(text).map((stanza, index) => (
    <View key={index} style={styles.stanza}>
      {stanza.map((line, lineIndex) => (
        <AppText key={lineIndex} style={lineStyle} center>
          {line}
        </AppText>
      ))}
    </View>
  ));
}

/** Screen 6's digital parchment. This exact view is rasterised for sharing. */
export function TributeCard({ tribute, cardRef }: TributeCardProps) {
  const subtitle = [tribute.profileRelation, tribute.profileLifeSpan].filter(Boolean).join(' · ');

  return (
    <View ref={cardRef} collapsable={false} style={styles.card}>
      <View style={styles.border}>
        <AppText style={styles.ornament} center>
          🌼 💀 🌼
        </AppText>
        <AppText style={styles.kicker} center>
          Calaverita para
        </AppText>
        <AppText style={styles.kickerEnglish} center>
          a calaverita for
        </AppText>
        <AppText style={styles.name} center>
          {tribute.profileName}
        </AppText>
        {subtitle ? (
          <AppText style={styles.subtitle} center>
            {subtitle}
          </AppText>
        ) : null}

        <View style={styles.poem}>
          <Stanzas text={tribute.poem} lineStyle={styles.line} />
        </View>

        {tribute.translation ? (
          <View style={styles.poem}>
            <AppText style={styles.kickerEnglish} center>
              in English
            </AppText>
            <Stanzas text={tribute.translation} lineStyle={styles.translatedLine} />
          </View>
        ) : null}

        <AppText style={styles.signature} center>
          Escrita sin nube, en este teléfono · Written offline, on this phone
        </AppText>
        <AppText style={styles.signature} center>
          Calavera AI
        </AppText>
      </View>
    </View>
  );
}

const ink = { color: colors.parchmentInk, fontFamily: fonts.serif } as const;

const styles = StyleSheet.create({
  card: { backgroundColor: colors.parchment, borderRadius: radii.md, padding: spacing.sm },
  border: {
    borderWidth: 2,
    borderColor: colors.parchmentEdge,
    borderRadius: radii.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  ornament: { fontSize: 22, lineHeight: 30 },
  kicker: { ...ink, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.75 },
  kickerEnglish: { ...ink, fontSize: 12, fontStyle: 'italic', opacity: 0.6 },
  name: { ...ink, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  subtitle: { ...ink, fontSize: 14, fontStyle: 'italic', opacity: 0.8 },
  poem: { gap: spacing.lg, marginVertical: spacing.lg },
  stanza: { gap: spacing.xxs },
  line: { ...ink, fontSize: 17, lineHeight: 26 },
  translatedLine: { ...ink, fontSize: 15, lineHeight: 23, fontStyle: 'italic', opacity: 0.8 },
  signature: { ...ink, fontSize: 11, opacity: 0.6 },
});
