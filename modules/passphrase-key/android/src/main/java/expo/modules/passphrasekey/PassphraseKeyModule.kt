package expo.modules.passphrasekey

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/**
 * Turns a passphrase into a 256-bit AES key with PBKDF2-HMAC-SHA256.
 * expo-crypto encrypts but cannot derive keys from passwords, and a pure
 * JavaScript PBKDF2 at 600k iterations would take far too long on a cheap phone.
 */
class PassphraseKeyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PassphraseKey")

    AsyncFunction("derive") { passphrase: String, salt: ByteArray, iterations: Int ->
      val spec = PBEKeySpec(passphrase.toCharArray(), salt, iterations, 256)
      try {
        SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
      } finally {
        spec.clearPassword()
      }
    }
  }
}
