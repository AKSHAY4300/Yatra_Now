"""
Yatra Now - Native Android APK Packager & Signer
Packages the frontend into an installable Android APK with JDK 17 jarsigner
"""

import os
import shutil
import zipfile
import subprocess

SOURCE_APK = r"D:\Projects\MG\android\app\build\outputs\apk\debug\app-debug.apk"
OUTPUT_APK_ROOT = r"d:\Projects\Yatra_Now\YatraNow.apk"
OUTPUT_APK_FRONTEND = r"d:\Projects\Yatra_Now\frontend\YatraNow.apk"
FRONTEND_DIR = r"d:\Projects\Yatra_Now\frontend"
TEMP_DIR = r"d:\Projects\Yatra_Now\apk_temp"
KEYSTORE_PATH = r"d:\Projects\Yatra_Now\yatranow.keystore"

def build_apk():
    print("▶ Step 1: Preparing build directories...")
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR)

    print("▶ Step 2: Unpacking Android APK template...")
    with zipfile.ZipFile(SOURCE_APK, 'r') as zip_ref:
        zip_ref.extractall(TEMP_DIR)

    print("▶ Step 3: Injecting Yatra Now web application assets into assets/public/...")
    public_assets_dir = os.path.join(TEMP_DIR, "assets", "public")
    if os.path.exists(public_assets_dir):
        shutil.rmtree(public_assets_dir)
    os.makedirs(public_assets_dir)

    # Copy HTML, manifest, SW
    for f in ["index.html", "manifest.json", "sw.js"]:
        src = os.path.join(FRONTEND_DIR, f)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(public_assets_dir, f))

    # Copy subdirectories
    for d in ["assets", "css", "js"]:
        src_dir = os.path.join(FRONTEND_DIR, d)
        dest_dir = os.path.join(public_assets_dir, d)
        if os.path.exists(src_dir):
            shutil.copytree(src_dir, dest_dir)

    # Update capacitor.config.json
    cap_config_path = os.path.join(TEMP_DIR, "assets", "capacitor.config.json")
    with open(cap_config_path, "w", encoding="utf-8") as f:
        f.write('''{
  "appId": "com.yatranow.app",
  "appName": "Yatra Now",
  "webDir": "public",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "allowMixedContent": true,
    "backgroundColor": "#ffeee0"
  }
}''')

    # Remove previous signing signatures (META-INF/*.RSA, *.SF, *.MF)
    meta_inf = os.path.join(TEMP_DIR, "META-INF")
    if os.path.exists(meta_inf):
        for item in os.listdir(meta_inf):
            if item.endswith(".RSA") or item.endswith(".SF") or item.endswith(".MF") or "CERT" in item:
                os.remove(os.path.join(meta_inf, item))

    print("▶ Step 4: Compressing unsigned APK archive...")
    unsigned_apk = os.path.join(TEMP_DIR, "yatranow-unsigned.apk")
    with zipfile.ZipFile(unsigned_apk, 'w', zipfile.ZIP_DEFLATED) as zip_out:
        for root, dirs, files in os.walk(TEMP_DIR):
            for file in files:
                if file == "yatranow-unsigned.apk":
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, TEMP_DIR)
                zip_out.write(full_path, rel_path)

    print("▶ Step 5: Generating Android Release Keypair & Keystore...")
    keytool = r"C:\Program Files\Java\jdk-17\bin\keytool.exe"
    jarsigner = r"C:\Program Files\Java\jdk-17\bin\jarsigner.exe"

    if not os.path.exists(KEYSTORE_PATH):
        subprocess.run([
            keytool, "-genkeypair", "-v",
            "-keystore", KEYSTORE_PATH,
            "-alias", "yatranow",
            "-keyalg", "RSA",
            "-keysize", "2048",
            "-validity", "10000",
            "-storepass", "yatranow123",
            "-keypass", "yatranow123",
            "-dname", "CN=YatraNow, OU=Transit, O=YatraNow, L=Bangalore, ST=Karnataka, C=IN"
        ], check=True)

    print("▶ Step 6: Signing APK with jarsigner...")
    shutil.copy2(unsigned_apk, OUTPUT_APK_ROOT)
    subprocess.run([
        jarsigner, "-verbose",
        "-sigalg", "SHA256withRSA",
        "-digestalg", "SHA-256",
        "-keystore", KEYSTORE_PATH,
        "-storepass", "yatranow123",
        "-keypass", "yatranow123",
        OUTPUT_APK_ROOT,
        "yatranow"
    ], check=True)

    # Copy to frontend folder so users can download it directly from the website
    shutil.copy2(OUTPUT_APK_ROOT, OUTPUT_APK_FRONTEND)

    # Clean up temp
    shutil.rmtree(TEMP_DIR)

    size_mb = os.path.getsize(OUTPUT_APK_ROOT) / (1024 * 1024)
    print(f"\n=======================================================")
    print(f"🎉 ANDROID APK GENERATED & SIGNED SUCCESSFULLY!")
    print(f"  • Root APK: {OUTPUT_APK_ROOT} ({size_mb:.2f} MB)")
    print(f"  • Web Download APK: {OUTPUT_APK_FRONTEND}")
    print(f"=======================================================")

if __name__ == "__main__":
    build_apk()
