/**
 * Yatra Now - Cryptographic Engine
 * Provides End-to-End AES-256-GCM Data Encryption & Decryption
 * Powered by Web Crypto API (SubtleCrypto) - Native Hardware Acceleration
 */

class CryptoService {
  constructor() {
    this.masterSecret = 'YATRA_NOW_SECURE_PAYLOAD_KEY_2026_PROD';
    this.salt = new TextEncoder().encode('YATRA_NOW_SALT_PROTECTED_9981');
    this.cryptoKey = null;
    this.recentEncryptions = [];
    this.init();
  }

  async init() {
    try {
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(this.masterSecret),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      this.cryptoKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: this.salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      console.log('[CryptoService] AES-256-GCM Key derived successfully');
    } catch (err) {
      console.error('[CryptoService] Failed to derive AES key:', err);
    }
  }

  /**
   * Encrypts any JSON-serializable payload using AES-256-GCM
   * Returns { iv: string, ciphertext: string, timestamp: number }
   */
  async encrypt(data) {
    if (!this.cryptoKey) await this.init();

    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
      const encodedData = new TextEncoder().encode(JSON.stringify(data));

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.cryptoKey,
        encodedData
      );

      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
      const ciphertextHex = Array.from(new Uint8Array(encryptedBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const result = {
        iv: ivHex,
        ciphertext: ciphertextHex,
        algorithm: 'AES-256-GCM',
        timestamp: Date.now()
      };

      // Store in telemetry log for security inspector
      this.recentEncryptions.unshift({
        type: 'ENCRYPT',
        time: new Date().toLocaleTimeString(),
        payloadSnippet: JSON.stringify(data).substring(0, 32) + '...',
        cipherSnippet: ciphertextHex.substring(0, 48) + '...'
      });
      if (this.recentEncryptions.length > 20) this.recentEncryptions.pop();

      return result;
    } catch (err) {
      console.error('[CryptoService] Encryption error:', err);
      throw err;
    }
  }

  /**
   * Decrypts an AES-256-GCM encrypted payload back to JavaScript object
   */
  async decrypt(encryptedObj) {
    if (!this.cryptoKey) await this.init();

    try {
      const ivBytes = new Uint8Array(
        encryptedObj.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );
      const cipherBytes = new Uint8Array(
        encryptedObj.ciphertext.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes
        },
        this.cryptoKey,
        cipherBytes
      );

      const decodedText = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decodedText);
    } catch (err) {
      console.error('[CryptoService] Decryption error:', err);
      throw err;
    }
  }
}

export const cryptoService = new CryptoService();
