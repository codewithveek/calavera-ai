import { requireOptionalNativeModule } from 'expo';

interface PassphraseKeyModule {
  /** PBKDF2-HMAC-SHA256 → 32-byte key. Runs off the JavaScript thread. */
  derive(passphrase: string, salt: Uint8Array, iterations: number): Promise<Uint8Array>;
}

/** Null where the native module is unavailable (tests, other platforms). */
export const PassphraseKey = requireOptionalNativeModule<PassphraseKeyModule>('PassphraseKey');
