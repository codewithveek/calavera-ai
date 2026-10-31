import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { UserFacingError } from '@/shared/lib/errors';
import { slugify } from '@/shared/lib/format';

export type CardRef = RefObject<ComponentRef<typeof View> | null>;

/**
 * Renders the parchment card to a PNG locally: no server, no upload. The file
 * is named after the loved one (Android appends a unique suffix), so it reads
 * well in the gallery and share sheet.
 */
async function renderCard(card: CardRef, profileName: string): Promise<string> {
  if (!card.current) throw new UserFacingError('The card is not ready yet.');
  const fileName = `calaverita-${slugify(profileName) || 'tribute'}-`;
  return captureRef(card, { format: 'png', quality: 1, result: 'tmpfile', fileName });
}

export async function shareCard(card: CardRef, profileName: string): Promise<void> {
  const uri = await renderCard(card, profileName);
  if (!(await Sharing.isAvailableAsync())) throw new UserFacingError('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Calaverita para ${profileName}` });
}

export async function saveCardToGallery(card: CardRef, profileName: string): Promise<void> {
  const { status } = await requestPermissionsAsync(true, ['photo']);
  if (status !== 'granted') throw new UserFacingError('Allow photo access to save the card to your gallery.');
  await Asset.create(await renderCard(card, profileName));
}
