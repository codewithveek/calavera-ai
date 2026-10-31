import { useEffect, useState } from 'react';

import { ProfilePicker } from '@/features/profiles/components/ProfilePicker';
import { useResolvedProfileId } from '@/features/profiles/hooks';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';

import { DEFAULT_POEM_LANGUAGE, type PoemLanguage } from '../languages';
import { DEFAULT_TONE_LEVEL, type DeathFigureId } from '../tones';
import { useCalaveritaGenerator } from '../useCalaveritaGenerator';
import { verseActions } from '../verseStore';
import { FigurePicker } from './FigurePicker';
import { LanguagePicker } from './LanguagePicker';
import { StreamingPoem } from './StreamingPoem';
import { ToneSlider } from './ToneSlider';

/** Screen 5: choose a loved one and a tone; RAG + on-device LLM write the calaverita. */
export function VerseEngineScreen({ initialProfileId }: { initialProfileId: number | null }) {
  const [chosenProfileId, setProfileId] = useState<number | null>(initialProfileId);
  const profileId = useResolvedProfileId(chosenProfileId);
  const [toneLevel, setToneLevel] = useState(DEFAULT_TONE_LEVEL);
  const [figureId, setFigureId] = useState<DeathFigureId>('catrina');
  const [focus, setFocus] = useState('');
  const [language, setLanguage] = useState<PoemLanguage>(DEFAULT_POEM_LANGUAGE);
  const { generate, stop, isGenerating } = useCalaveritaGenerator();

  // A fresh visit should not show the previous session's error.
  useEffect(() => verseActions.resetIfIdle(), []);

  const footer = isGenerating ? (
    <Button label="Stop" icon="✋" variant="secondary" onPress={() => stop()} fullWidth />
  ) : (
    <Button
      label="Write the calaverita"
      icon="💀"
      disabled={profileId === null}
      onPress={() => profileId !== null && generate({ profileId, toneLevel, figureId, focus, language })}
      fullWidth
    />
  );

  return (
    <Screen footer={footer} followContent={isGenerating}>
      <AppText tone="muted">
        A calaverita literaria is a playful Day of the Dead poem in which Death comes for someone we love. Yours is
        written here, offline, from the memories in your archive.
      </AppText>
      <ProfilePicker label="Who is it for?" selectedId={profileId} onSelect={setProfileId} />
      <LanguagePicker value={language} onChange={setLanguage} />
      <ToneSlider level={toneLevel} onChange={setToneLevel} disabled={isGenerating} />
      <FigurePicker value={figureId} onChange={setFigureId} />
      <TextField
        label="Anything to include? (optional)"
        value={focus}
        onChangeText={setFocus}
        editable={!isGenerating}
        placeholder="Her famous mole, his lucky domino"
      />
      <StreamingPoem />
    </Screen>
  );
}
