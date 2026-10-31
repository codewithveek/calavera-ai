import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Altar } from '@/features/ofrenda/components/Altar';
import { PapelPicado } from '@/features/ofrenda/components/PapelPicado';
import { useProfiles } from '@/features/profiles/hooks';
import { pluralize } from '@/shared/lib/format';
import { colors, MIN_TOUCH, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';

import { ModuleDock } from './ModuleDock';

/** Screen 2: El Altar Digital. */
export function HubScreen() {
  const router = useRouter();
  const { data: profiles = [] } = useProfiles();
  const memoryCount = profiles.reduce((total, profile) => total + profile.memoryCount, 0);

  return (
    <Screen edges={['top', 'bottom']}>
      <PapelPicado />
      <View style={styles.header}>
        <View style={styles.titles}>
          <AppText variant="title">El Altar Digital</AppText>
          <AppText tone="muted">
            {profiles.length === 0
              ? 'Begin by adding a loved one to the archive.'
              : `${pluralize(profiles.length, 'soul')} remembered · ${pluralize(memoryCount, 'memory', 'memories')}`}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Offline AI settings"
          onPress={() => router.push('/models')}
          style={styles.engineButton}
        >
          <AppText style={styles.engineGlyph}>⚙️</AppText>
        </Pressable>
      </View>

      <Altar />
      <ModuleDock />

      <View style={styles.offlineBadge}>
        <AppText variant="caption" tone="muted" center>
          🔒 Works offline · stays on this phone · no account
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titles: { flex: 1, gap: spacing.xxs },
  engineButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.nightRaised,
  },
  engineGlyph: { fontSize: 20 },
  offlineBadge: { paddingVertical: spacing.sm },
});
