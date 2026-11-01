import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { UserFacingError } from '@/shared/lib/errors';
import { slugify } from '@/shared/lib/format';

import { collectArchive } from './archive';
import { decryptBackup, encryptBackup } from './crypto';
import { parsePayload, type BackupPayload } from './payload';

const MIME_TYPE = 'application/octet-stream';
export const MIN_PASSPHRASE_LENGTH = 8;

/**
 * UTF-8 text ↔ bytes through a short-lived file in app-private cache
 * (Hermes does not guarantee TextDecoder). Deleted straight after.
 */
async function withScratchFile<T>(task: (file: File) => Promise<T>): Promise<T> {
  const file = new File(Paths.cache, `backup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.tmp`);
  file.create();
  try {
    return await task(file);
  } finally {
    if (file.exists) file.delete();
  }
}

const textToBytes = (text: string) =>
  withScratchFile(async (file) => {
    await file.write(text);
    return file.bytes();
  });

const bytesToText = (bytes: Uint8Array) =>
  withScratchFile(async (file) => {
    await file.write(bytes);
    return file.text();
  });

function backupFileName(payload: BackupPayload, profileId: number | undefined): string {
  const date = new Date().toISOString().slice(0, 10);
  const person = payload.people[0];
  const subject = profileId !== undefined && person ? slugify(person.name) || 'loved-one' : 'archive';
  return `Calavera-${subject}-${date}.calavera`;
}

export interface BackupBundle {
  name: string;
  bytes: Uint8Array;
}

/** Encrypts everyone (or one loved one). Kept in memory and written only when sent or saved. */
export async function createBackup(passphrase: string, profileId?: number): Promise<BackupBundle> {
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new UserFacingError(`Use a passphrase of at least ${MIN_PASSPHRASE_LENGTH} characters.`);
  }
  const payload = await collectArchive(profileId);
  if (payload.people.length === 0) throw new UserFacingError('There is nothing to back up yet.');

  const bytes = await encryptBackup(await textToBytes(JSON.stringify(payload)), passphrase);
  return { name: backupFileName(payload, profileId), bytes };
}

/** Android's share sheet: Drive, a chat with yourself or family, email, Bluetooth… */
export async function shareBackup(bundle: BackupBundle): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new UserFacingError('Sharing is not available on this device.');
  // Written fresh each time: the share sheet needs a file, and the cache may be cleared meanwhile.
  const file = new File(Paths.cache, bundle.name);
  if (file.exists) file.delete();
  file.create();
  await file.write(bundle.bytes);
  await Sharing.shareAsync(file.uri, { mimeType: MIME_TYPE, dialogTitle: 'Send or save your encrypted backup' });
}

/** Saves the backup into a folder the person picks (phone storage, SD card, USB). Resolves false if cancelled. */
export async function saveBackupToFolder(bundle: BackupBundle): Promise<boolean> {
  let folder: Directory;
  try {
    folder = await Directory.pickDirectoryAsync();
  } catch {
    return false; // the picker was closed
  }
  const target = folder.createFile(bundle.name, MIME_TYPE);
  await target.write(bundle.bytes);
  return true;
}

export async function pickBackupFile(): Promise<File | null> {
  const picked = await File.pickFileAsync({ mimeTypes: '*/*' });
  return picked.canceled ? null : picked.result;
}

/** Decrypts and validates a backup. Nothing is written until the person confirms the restore. */
export async function openBackup(file: File, passphrase: string): Promise<BackupPayload> {
  const plaintext = await decryptBackup(await file.bytes(), passphrase);
  return parsePayload(await bytesToText(plaintext));
}
