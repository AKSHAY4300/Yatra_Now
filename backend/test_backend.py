"""
Yatra Now - Backend Verification & Integration Test Suite
Verifies AES-256-GCM encryption/decryption, 2FA OTP flow, and database operations
"""

import sys
import json
from crypto_utils import encrypt_payload, decrypt_payload
from auth_controller import auth_controller
from bus_controller import bus_controller
from db import init_db

def run_tests():
    print("▶ Initializing Database...")
    init_db()
    print("✓ Database Initialized and Seeded")

    print("\n▶ Testing AES-256-GCM Cryptographic Engine...")
    test_data = {
        "user_id": "usr_test_99",
        "action": "GPS_TELEMETRY_PING",
        "coords": [12.9716, 77.5946],
        "speed": 48.5,
        "token": "secret_session_jwt_2026"
    }

    encrypted = encrypt_payload(test_data)
    assert "iv" in encrypted and len(encrypted["iv"]) == 24, "Invalid 96-bit IV"
    assert "ciphertext" in encrypted, "Missing ciphertext"
    print(f"  • Encrypted IV (Hex): {encrypted['iv']}")
    print(f"  • Ciphertext + Tag (Hex): {encrypted['ciphertext'][:36]}...")

    decrypted = decrypt_payload(encrypted)
    assert decrypted == test_data, "Decrypted data does not match original plaintext!"
    print("✓ AES-256-GCM Round-trip Encryption & Decryption Successful!")

    print("\n▶ Testing Two-Step Verification (2FA) Flow...")
    login_creds = {
        "email": "driver.ramesh@yatranow.com",
        "role": "crew",
        "name": "Ramesh Kumar"
    }
    enc_creds = encrypt_payload(login_creds)
    challenge_res = auth_controller.initiate_2fa(enc_creds)
    dec_challenge = decrypt_payload(challenge_res)
    
    assert dec_challenge["success"] is True
    temp_token = dec_challenge["temp_token"]
    demo_otp = dec_challenge["demo_otp"]
    print(f"  • 2FA Challenge Token: {temp_token}")
    print(f"  • Dispatched OTP: {demo_otp}")

    # Verify with correct OTP
    verify_payload = encrypt_payload({
        "temp_token": temp_token,
        "otp": demo_otp
    })
    verify_res = auth_controller.verify_2fa(verify_payload)
    dec_verify = decrypt_payload(verify_res)
    assert dec_verify["success"] is True
    assert dec_verify["user"]["twoFactorVerified"] is True
    print(f"✓ 2FA Verified Successfully for Role: {dec_verify['user']['role'].upper()}")

    print("\n▶ Testing Bus Controller & Incident Reporting...")
    buses_res = bus_controller.get_all_buses()
    dec_buses = decrypt_payload(buses_res)
    assert len(dec_buses["buses"]) >= 4, "Buses count should be at least 4"
    print(f"✓ Retrieved {len(dec_buses['buses'])} buses with sequential stops")

    incident_payload = encrypt_payload({
        "bus_id": "bus_101",
        "issue_type": "Tire Puncture",
        "description": "Rear right tire pressure dropping rapidly.",
        "reported_by": "Ramesh Kumar (Driver)",
        "timestamp": 1727280000000
    })
    inc_res = bus_controller.report_incident(incident_payload)
    dec_inc = decrypt_payload(inc_res)
    assert dec_inc["success"] is True
    print("✓ Driver incident reported and bus delay flag set successfully")

    print("\n=======================================================")
    print("🎉 ALL BACKEND SECURITY, 2FA, AND DATA TESTS PASSED!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
