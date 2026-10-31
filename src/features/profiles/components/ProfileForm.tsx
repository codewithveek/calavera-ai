import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { toErrorMessage } from '@/shared/lib/errors';
import { spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { TextField } from '@/shared/ui/TextField';

import { useCreateProfile } from '../hooks';
import type { ProfileDraft } from '../types';

const EMPTY: ProfileDraft = { name: '', relation: '', lifeSpan: '', essence: '' };

interface ProfileFormProps {
  onCreated: (id: number) => void;
  onCancel?: () => void;
}

export function ProfileForm({ onCreated, onCancel }: ProfileFormProps) {
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY);
  const create = useCreateProfile();
  const update = (field: keyof ProfileDraft) => (value: string) => setDraft((current) => ({ ...current, [field]: value }));

  const submit = () =>
    create.mutate(draft, {
      onSuccess: (id) => {
        setDraft(EMPTY);
        onCreated(id);
      },
    });

  return (
    <Card>
      <AppText variant="heading">Remember someone</AppText>
      <TextField label="Name" value={draft.name} onChangeText={update('name')} placeholder="Abuelo Chuy" />
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField label="Relation" value={draft.relation} onChangeText={update('relation')} placeholder="Grandfather" />
        </View>
        <View style={styles.flex}>
          <TextField label="Years" value={draft.lifeSpan} onChangeText={update('lifeSpan')} placeholder="1938 – 2019" />
        </View>
      </View>
      <TextField
        label="Who were they?"
        value={draft.essence}
        onChangeText={update('essence')}
        placeholder="Radio repairman, sang boleros, terrible at dominoes"
        hint="Trades, habits and catchphrases make the best calaveritas."
      />
      {create.isError ? <AppText tone="danger">{toErrorMessage(create.error)}</AppText> : null}
      <View style={styles.row}>
        {onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} /> : null}
        <View style={styles.flex}>
          <Button label="Add to archive" disabled={!draft.name.trim()} loading={create.isPending} onPress={submit} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
