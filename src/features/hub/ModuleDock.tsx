import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/shared/lib/haptics';
import { colors, MIN_TOUCH, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';

interface Module {
  href: Href;
  glyph: string;
  title: string;
  caption: string;
}

const MODULES: readonly Module[] = [
  { href: '/mirror', glyph: '📷', title: 'Soul Mirror', caption: 'Scan an heirloom' },
  { href: '/archive', glyph: '📜', title: 'Archive', caption: 'Keep their stories' },
  { href: '/verse', glyph: '💀', title: 'Calaveritas', caption: 'Write their verse' },
];

/** The three core modules of the pipeline: Input → Storage → Output. */
export function ModuleDock() {
  const router = useRouter();

  return (
    <View style={styles.dock}>
      {MODULES.map((module) => (
        <Pressable
          key={module.title}
          accessibilityRole="button"
          accessibilityLabel={`${module.title}: ${module.caption}`}
          onPress={() => {
            haptics.tap();
            router.push(module.href);
          }}
          style={({ pressed }) => [styles.module, pressed && styles.pressed]}
        >
          <AppText style={styles.glyph}>{module.glyph}</AppText>
          <AppText variant="label" center>
            {module.title}
          </AppText>
          <AppText variant="caption" tone="muted" center>
            {module.caption}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { flexDirection: 'row', gap: spacing.sm },
  module: {
    flex: 1,
    minHeight: MIN_TOUCH * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.nightRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { borderColor: colors.marigold, transform: [{ scale: 0.97 }] },
  glyph: { fontSize: 28, lineHeight: 34 },
});
