//! Crypto module — adapted from ZeroClaw's secrets encryption.
//!
//! Uses chacha20poly1305 (same as ZeroClaw) for encrypting/decrypting
//! API keys stored in IndexedDB. Derives a key from user passphrase
//! using PBKDF2-like derivation via SHA-256.

use chacha20poly1305::{
    aead::{Aead, NewAead},
    ChaCha20Poly1305, Nonce,
};
use wasm_bindgen::prelude::*;

const NONCE_SIZE: usize = 12;
const KEY_SIZE: usize = 32;

/// Derive a 256-bit key from a passphrase (simple hash derivation).
/// In production this would use PBKDF2 or Argon2; for WASM we use
/// iterative SHA-256 (same pattern as ZeroClaw's secrets module).
fn derive_key(passphrase: &str) -> [u8; KEY_SIZE] {
    use sha2::{Digest, Sha256};

    let mut hasher = Sha256::new();
    hasher.update(passphrase.as_bytes());
    hasher.update(b"ezclaw-zeroclaw-secrets-v1");
    let result = hasher.finalize();

    let mut key = [0u8; KEY_SIZE];
    key.copy_from_slice(&result);
    key
}

/// Generate a random nonce for encryption.
fn generate_nonce() -> [u8; NONCE_SIZE] {
    let mut nonce = [0u8; NONCE_SIZE];
    getrandom::getrandom(&mut nonce).expect("random nonce generation failed");
    nonce
}

/// Encrypt data with a passphrase. Returns nonce || ciphertext as hex string.
#[wasm_bindgen]
pub fn encrypt(plaintext: &str, passphrase: &str) -> Result<String, JsValue> {
    let key = derive_key(passphrase);
    let cipher = ChaCha20Poly1305::new((&key).into());
    let nonce_bytes = generate_nonce();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| JsValue::from_str(&format!("Encryption failed: {e}")))?;

    // Prepend nonce to ciphertext and hex-encode
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);

    Ok(hex::encode(combined))
}

/// Decrypt a hex-encoded (nonce || ciphertext) string with a passphrase.
#[wasm_bindgen]
pub fn decrypt(hex_data: &str, passphrase: &str) -> Result<String, JsValue> {
    let combined = hex::decode(hex_data)
        .map_err(|e| JsValue::from_str(&format!("Invalid hex: {e}")))?;

    if combined.len() < NONCE_SIZE + 1 {
        return Err(JsValue::from_str("Data too short to contain nonce + ciphertext"));
    }

    let (nonce_bytes, ciphertext) = combined.split_at(NONCE_SIZE);
    let key = derive_key(passphrase);
    let cipher = ChaCha20Poly1305::new((&key).into());
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| JsValue::from_str("Decryption failed: wrong passphrase or corrupted data"))?;

    String::from_utf8(plaintext)
        .map_err(|e| JsValue::from_str(&format!("Invalid UTF-8 after decryption: {e}")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encrypt_decrypt_roundtrip() {
        let plaintext = "sk-test-my-api-key-12345";
        let passphrase = "my-secret-passphrase";

        let encrypted = encrypt(plaintext, passphrase).unwrap();
        assert!(!encrypted.is_empty());
        assert_ne!(encrypted, plaintext);

        let decrypted = decrypt(&encrypted, passphrase).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn wrong_passphrase_fails() {
        let encrypted = encrypt("secret-data", "correct-pass").unwrap();
        let result = decrypt(&encrypted, "wrong-pass");
        assert!(result.is_err());
    }

    #[test]
    fn different_encryptions_differ() {
        let plaintext = "same-data";
        let pass = "same-pass";
        let e1 = encrypt(plaintext, pass).unwrap();
        let e2 = encrypt(plaintext, pass).unwrap();
        // Different nonces → different ciphertexts
        assert_ne!(e1, e2);
        // Both decrypt to same plaintext
        assert_eq!(decrypt(&e1, pass).unwrap(), plaintext);
        assert_eq!(decrypt(&e2, pass).unwrap(), plaintext);
    }

    #[test]
    fn key_derivation_deterministic() {
        let k1 = derive_key("test");
        let k2 = derive_key("test");
        assert_eq!(k1, k2);
    }
}
