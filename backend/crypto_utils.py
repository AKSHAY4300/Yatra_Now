"""
Yatra Now - Backend Cryptographic Utilities
Implements AES-256-GCM authenticated payload encryption & decryption
Compatible with browser Web Crypto API (SubtleCrypto)
"""

import json
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

MASTER_SECRET = b'YATRA_NOW_SECURE_PAYLOAD_KEY_2026_PROD'
SALT = b'YATRA_NOW_SALT_PROTECTED_9981'

def derive_aes_key():
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=SALT,
        iterations=100000,
    )
    return kdf.derive(MASTER_SECRET)

DERIVED_KEY = derive_aes_key()
aesgcm = AESGCM(DERIVED_KEY)

def encrypt_payload(data: dict) -> dict:
    """
    Encrypts a Python dict into an AES-256-GCM payload.
    Returns: { "iv": hex, "ciphertext": hex, "algorithm": "AES-256-GCM", "timestamp": int }
    """
    nonce = os.urandom(12) # 96-bit IV
    encoded_json = json.dumps(data).encode('utf-8')
    ciphertext_with_tag = aesgcm.encrypt(nonce, encoded_json, None)
    
    return {
        "iv": nonce.hex(),
        "ciphertext": ciphertext_with_tag.hex(),
        "algorithm": "AES-256-GCM"
    }

def decrypt_payload(payload: dict) -> dict:
    """
    Decrypts an incoming AES-256-GCM encrypted payload from frontend.
    """
    try:
        nonce = bytes.fromhex(payload["iv"])
        ciphertext_with_tag = bytes.fromhex(payload["ciphertext"])
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext_with_tag, None)
        return json.loads(decrypted_bytes.decode('utf-8'))
    except Exception as e:
        raise ValueError(f"AES-256-GCM Decryption failed: {str(e)}")
