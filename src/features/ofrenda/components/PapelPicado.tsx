import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/theme/tokens';

const FLAG_COLORS = [colors.rosa, colors.marigold, colors.purple, colors.turquoise, colors.candle] as const;
const FLAG_COUNT = 9;

/** Static papel picado garland: plain views, no images or animation cost. */
export function PapelPicado() {
  return (
    <View style={styles.garland} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.string} />
      <View style={styles.flags}>
        {Array.from({ length: FLAG_COUNT }, (_, index) => (
          <View key={index} style={[styles.flag, { backgroundColor: FLAG_COLORS[index % FLAG_COLORS.length] }]}>
            <View style={styles.cutout} />
            <View style={[styles.cutout, styles.cutoutSmall]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  garland: { height: 44, marginHorizontal: -spacing.lg },
  string: { position: 'absolute', top: 4, left: 0, right: 0, height: 1, backgroundColor: colors.boneMuted },
  flags: { flexDirection: 'row', justifyContent: 'space-evenly' },
  flag: {
    width: 30,
    height: 38,
    marginTop: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    opacity: 0.9,
  },
  cutout: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.night },
  cutoutSmall: { width: 6, height: 6, borderRadius: 3 },
});
