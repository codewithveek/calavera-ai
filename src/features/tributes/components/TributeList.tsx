import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDate } from '@/shared/lib/format';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';

import { useProfileTributes } from '../hooks';

/** A person's past calaveritas; a profile rarely has more than a handful, so no virtualisation. */
export function TributeList({ profileId }: { profileId: number }) {
  const router = useRouter();
  const { data: tributes = [] } = useProfileTributes(profileId);
  if (tributes.length === 0) return null;

  return (
    <View style={styles.list}>
      <AppText variant="label" tone="muted">
        CALAVERITAS
      </AppText>
      {tributes.map((tribute) => (
        <Pressable
          key={tribute.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/tribute/[tributeId]', params: { tributeId: String(tribute.id) } })}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <AppText serif numberOfLines={1} style={styles.firstLine}>
            {tribute.poem.split('\n')[0]}
          </AppText>
          <AppText variant="caption" tone="muted">
            {formatDate(tribute.createdAt)} · {tribute.figure}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.nightRaised,
    borderLeftWidth: 3,
    borderLeftColor: colors.rosa,
    gap: spacing.xxs,
  },
  firstLine: { fontStyle: 'italic' },
  pressed: { opacity: 0.85 },
});
