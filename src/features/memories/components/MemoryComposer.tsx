import { useState } from 'react';

import { ModelLoadingNotice } from '@/features/engine/ModelLoadingNotice';
import { toErrorMessage } from '@/shared/lib/errors';
import { haptics } from '@/shared/lib/haptics';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { TextField } from '@/shared/ui/TextField';

import { useAddMemory } from '../hooks';

export function MemoryComposer({ profileId, name }: { profileId: number; name: string }) {
  const [body, setBody] = useState('');
  const addMemory = useAddMemory();

  const save = () =>
    addMemory.mutate(
      { profileId, source: 'story', body },
      {
        onSuccess: () => {
          haptics.success();
          setBody('');
        },
      },
    );

  return (
    <Card>
      <TextField
        label={`A memory of ${name}`}
        value={body}
        onChangeText={setBody}
        multiline
        placeholder="Every Sunday they burned the tortillas and blamed the stove…"
        hint="Tip: use your keyboard's microphone to dictate a spoken recollection."
      />
      <ModelLoadingNotice />
      {addMemory.isError ? <AppText tone="danger">{toErrorMessage(addMemory.error)}</AppText> : null}
      <Button
        label={addMemory.isPending ? 'Saving on this phone…' : 'Save to the archive'}
        icon="📜"
        disabled={body.trim().length < 3}
        loading={addMemory.isPending}
        onPress={save}
      />
    </Card>
  );
}
