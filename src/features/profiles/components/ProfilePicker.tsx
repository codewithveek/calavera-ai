import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';

import { useProfiles } from '../hooks';

interface ProfilePickerProps {
  label: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ProfilePicker({ label, selectedId, onSelect }: ProfilePickerProps) {
  const router = useRouter();
  const { data: profiles = [], isPending } = useProfiles();

  return (
    <View style={styles.container}>
      <AppText variant="label">{label}</AppText>
      {!isPending && profiles.length === 0 ? (
        <Button
          label="Add a loved one to the archive first"
          icon="🌼"
          variant="secondary"
          onPress={() => router.push('/archive')}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          accessibilityRole="radiogroup"
        >
          {profiles.map((profile) => (
            <Chip
              key={profile.id}
              label={profile.name}
              selected={profile.id === selectedId}
              onPress={() => onSelect(profile.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  chips: { gap: spacing.sm },
});
