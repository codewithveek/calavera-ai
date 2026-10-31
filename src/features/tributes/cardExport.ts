import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { UserFacingError } from '@/shared/lib/errors';

export type CardRef = RefObject<ComponentRef<typeof View> | null>;

/** Renders the parchment card to a PNG locally: no server, no upload. */
async function renderCard(card: CardRef): Promise<string> {
  if (!card.current) throw new UserFacingError('The card is not ready yet.');
  return captureRef(card, { format: 'png', quality: 1, result: 'tmpfile' });
}

export async function shareCard(card: CardRef, title: string): Promise<void> {
  const uri = await renderCard(card);
  if (!(await Sharing.isAvailableAsync())) throw new UserFacingError('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title });
}

export async function saveCardToGallery(card: CardRef): Promise<void> {
  const { status } = await requestPermissionsAsync(true, ['photo']);
  if (status !== 'granted') throw new UserFacingError('Allow photo access to save the card to your gallery.');
  await Asset.create(await renderCard(card));
}
