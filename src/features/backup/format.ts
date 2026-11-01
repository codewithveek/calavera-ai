import { UserFacingError } from '@/shared/lib/errors';

/**
 * The `.calavera` file:
 *
 *   "CALAVERA" (8 bytes) · header length (2 bytes, big-endian) · header (ASCII JSON) · sealed data
 *
 * The header says how the key was derived. The sealed data is AES-256-GCM
 * (IV + ciphertext + tag) with the magic and header as additional
 * authenticated data, so neither can be altered without failing decryption.
 */

const MAGIC = 'CALAVERA';
const PREFIX_BYTES = MAGIC.length + 2;

export interface BackupHeader {
  format: 1;
  kdf: 'pbkdf2-sha256';
  iterations: number;
  /** Hex-encoded random salt. */
  salt: string;
}

export interface DecodedBackup {
  header: BackupHeader;
  /** Bytes the encryption is bound to (magic + header). */
  authenticated: Uint8Array;
  sealed: Uint8Array;
}

const NOT_A_BACKUP = 'This file is not a Calavera AI backup.';

function asciiBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 0x7f) throw new Error('Backup headers are ASCII only');
    bytes[i] = code;
  }
  return bytes;
}

const asciiText = (bytes: Uint8Array) => String.fromCharCode(...bytes);

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) throw new Error('Invalid hex');
  return Uint8Array.from({ length: hex.length / 2 }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16));
}

/** Magic + header: written first, and bound to the ciphertext as authenticated data. */
export function encodePrefix(header: BackupHeader): Uint8Array {
  const json = asciiBytes(JSON.stringify(header));
  const prefix = new Uint8Array(PREFIX_BYTES + json.length);
  prefix.set(asciiBytes(MAGIC), 0);
  prefix[MAGIC.length] = json.length >> 8;
  prefix[MAGIC.length + 1] = json.length & 0xff;
  prefix.set(json, PREFIX_BYTES);
  return prefix;
}

export function encodeBackup(prefix: Uint8Array, sealed: Uint8Array): Uint8Array {
  const file = new Uint8Array(prefix.length + sealed.length);
  file.set(prefix, 0);
  file.set(sealed, prefix.length);
  return file;
}

function isHeader(value: unknown): value is BackupHeader {
  const header = value as Partial<BackupHeader> | null;
  return (
    header?.format === 1 &&
    header.kdf === 'pbkdf2-sha256' &&
    typeof header.iterations === 'number' &&
    header.iterations >= 100_000 &&
    typeof header.salt === 'string'
  );
}

export function decodeBackup(file: Uint8Array): DecodedBackup {
  if (file.length < PREFIX_BYTES || asciiText(file.subarray(0, MAGIC.length)) !== MAGIC) {
    throw new UserFacingError(NOT_A_BACKUP);
  }
  const headerLength = (file[MAGIC.length]! << 8) | file[MAGIC.length + 1]!;
  const headerEnd = PREFIX_BYTES + headerLength;
  if (file.length <= headerEnd) throw new UserFacingError(NOT_A_BACKUP);

  let header: unknown;
  try {
    header = JSON.parse(asciiText(file.subarray(PREFIX_BYTES, headerEnd)));
  } catch {
    throw new UserFacingError(NOT_A_BACKUP);
  }
  if (!isHeader(header)) throw new UserFacingError('This backup was made by a newer version of Calavera AI.');

  return { header, authenticated: file.subarray(0, headerEnd), sealed: file.subarray(headerEnd) };
}
