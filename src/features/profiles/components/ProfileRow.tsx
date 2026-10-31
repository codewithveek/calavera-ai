import { Pressable, StyleSheet, View } from 'react-native';

import { pluralize } from '@/shared/lib/format';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';

import type { ProfileSummary } from '../types';

interface ProfileRowProps {
  profile: ProfileSummary;
  onPress: (id: number) => void;
}

export function ProfileRow({ profile, onPress }: ProfileRowProps) {
  const subtitle = [profile.relation, profile.lifeSpan].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${profile.name}, ${pluralize(profile.memoryCount, 'memory', 'memories')}`}
      onPress={() => onPress(profile.id)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <AppText variant="heading">{profile.name.charAt(0).toUpperCase()}</AppText>
      </View>
      <View style={styles.text}>
        <AppText variant="heading" numberOfLines={1}>
          {profile.name}
        </AppText>
        {subtitle ? (
          <AppText tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
        <AppText variant="caption" tone="accent">
          {pluralize(profile.memoryCount, 'memory', 'memories')} · {pluralize(profile.tributeCount, 'calaverita')}
        </AppText>
      </View>
      <AppText tone="muted">›</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.nightRaised,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple,
  },
  text: { flex: 1, gap: spacing.xxs },
});
