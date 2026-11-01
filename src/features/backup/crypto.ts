import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, getRandomBytes } from 'expo-crypto';

import { PassphraseKey } from '@modules/passphrase-key';

import { UserFacingError } from '@/shared/lib/errors';

import { decodeBackup, encodeBackup, encodePrefix, fromHex, toHex, type BackupHeader } from './format';

/** OWASP's recommendation for PBKDF2-HMAC-SHA256 (about a second natively on a budget phone). */
const ITERATIONS = 600_000;
const SALT_BYTES = 16;

async function deriveKey(passphrase: string, header: BackupHeader): Promise<AESEncryptionKey> {
  if (!PassphraseKey) throw new Error('Passphrase key derivation is unavailable');
  const bytes = await PassphraseKey.derive(passphrase, fromHex(header.salt), header.iterations);
  return (await AESEncryptionKey.import(bytes)) as AESEncryptionKey;
}

/** AES-256-GCM under a passphrase-derived key; the header is authenticated too. */
export async function encryptBackup(plaintext: Uint8Array, passphrase: string): Promise<Uint8Array> {
  const header: BackupHeader = {
    format: 1,
    kdf: 'pbkdf2-sha256',
    iterations: ITERATIONS,
    salt: toHex(getRandomBytes(SALT_BYTES)),
  };
  const prefix = encodePrefix(header);
  const key = await deriveKey(passphrase, header);
  const sealed = await aesEncryptAsync(plaintext, key, { additionalData: prefix });
  return encodeBackup(prefix, await sealed.combined());
}

export async function decryptBackup(file: Uint8Array, passphrase: string): Promise<Uint8Array> {
  const { header, authenticated, sealed } = decodeBackup(file);
  const key = await deriveKey(passphrase, header);
  try {
    // Copies: the native side receives plain buffers rather than views into the file.
    return await aesDecryptAsync(AESSealedData.fromCombined(sealed.slice()), key, {
      additionalData: authenticated.slice(),
    });
  } catch {
    // GCM authentication fails for a wrong passphrase and for a tampered file alike.
    throw new UserFacingError("That passphrase doesn't open this backup.");
  }
}
