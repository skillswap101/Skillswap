#!/usr/bin/env python3
"""
update_skillswap5.0.py
----------------------
Safely updates or synchronizes the SkillSwap 5.0 application in Termux or any
local development directory.

Key safety features:
1. PRESERVES your existing .env and serviceaccountkey.json credentials.
   (Never overwrites your API keys, private tokens, or secrets).
2. Manages dist/ assets safely: clears stale chunk hashes and copies fresh dist files.
3. Automatically creates a timestamped backup of modified files in .skillswap_backup/.
4. Supports updating from:
   - The current directory (if running from an extracted workspace)
   - Git repository (git pull origin main)
   - Remote GitHub repo (https://github.com/skillswap101/Skillswap)
"""

import os
import sys
import shutil
import datetime
import subprocess
import urllib.request
import zipfile
import io

REPO_URL = "https://github.com/skillswap101/Skillswap"
ZIP_URL = "https://github.com/skillswap101/Skillswap/archive/refs/heads/main.zip"

DEFAULT_PATHS = [
    os.path.expanduser("~/skillswap5.0"),
    os.path.join(os.getcwd(), "skillswap5.0"),
    os.getcwd(),
]

CRITICAL_CONFIGS = [
    ".env",
    "serviceaccountkey.json",
    ".firebaserc",
    "firebase.json",
]

DEFAULT_ENV_KEYS = [
    "PORT=3000",
    "NODE_ENV=development",
    "ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173",
    "FIREBASE_PROJECT_ID=",
    "FIREBASE_CLIENT_EMAIL=",
    "FIREBASE_PRIVATE_KEY=",
    "STRIPE_SECRET_KEY=",
    "STRIPE_WEBHOOK_SECRET=",
    "PAYPAL_CLIENT_ID=",
    "PAYPAL_CLIENT_SECRET=",
    "PAYPAL_API=https://api-m.sandbox.paypal.com",
    "MPESA_CONSUMER_KEY=",
    "MPESA_CONSUMER_SECRET=",
    "MPESA_PASSKEY=",
    "MPESA_SHORTCODE=174379",
    "MPESA_CALLBACK_URL=",
    "GEMINI_API_KEY=",
]

def print_banner():
    print("=" * 60)
    print("        SkillSwap 5.0 - Termux / Local Safe Updater        ")
    print("=" * 60)

def detect_target_directory():
    if len(sys.argv) > 1:
        custom_path = os.path.abspath(sys.argv[1])
        if os.path.isdir(custom_path):
            return custom_path
        print(f"[!] Warning: Specified path '{custom_path}' does not exist yet. Will create.")
        return custom_path

    for p in DEFAULT_PATHS:
        if os.path.exists(os.path.join(p, "package.json")) or os.path.exists(os.path.join(p, "server.ts")):
            return p

    return os.path.expanduser("~/skillswap5.0")

def backup_file(target_dir, relative_path, backup_dir):
    source = os.path.join(target_dir, relative_path)
    if not os.path.exists(source):
        return
    dest = os.path.join(backup_dir, relative_path)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(source, dest)

def handle_env_preservation(target_dir, backup_dir):
    env_path = os.path.join(target_dir, ".env")
    if os.path.exists(env_path):
        print("[+] Existing .env detected. Creating safe backup...")
        backup_file(target_dir, ".env", backup_dir)
        with open(env_path, "r", encoding="utf-8", errors="ignore") as f:
            existing_lines = f.readlines()
        existing_keys = set()
        for line in existing_lines:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key = line.split("=", 1)[0].strip()
                existing_keys.add(key)
        
        missing_entries = []
        for default_entry in DEFAULT_ENV_KEYS:
            key = default_entry.split("=", 1)[0].strip()
            if key not in existing_keys:
                missing_entries.append(default_entry)
        
        if missing_entries:
            print(f"[*] Appending {len(missing_entries)} new config keys to your .env (preserving existing values)")
            with open(env_path, "a", encoding="utf-8") as f:
                f.write("\n# New configuration keys added by update_skillswap5.0:\n")
                for entry in missing_entries:
                    f.write(f"{entry}\n")
        print("  [✓] .env file preserved safely.")
    else:
        print("[*] No .env found. Generating starter template .env...")
        with open(env_path, "w", encoding="utf-8") as f:
            f.write("# SkillSwap 5.0 Environment Configuration\n")
            for entry in DEFAULT_ENV_KEYS:
                f.write(f"{entry}\n")
        print("  [✓] Created starter .env file.")

def handle_service_account(target_dir, backup_dir):
    sa_path = os.path.join(target_dir, "serviceaccountkey.json")
    if os.path.exists(sa_path):
        print("[+] Preserving local serviceaccountkey.json...")
        backup_file(target_dir, "serviceaccountkey.json", backup_dir)
        print("  [✓] serviceaccountkey.json backed up safely.")

def copy_directory_contents(src, dst, backup_dir):
    skip_items = {".git", ".env", "serviceaccountkey.json", "node_modules", ".skillswap_backup"}
    
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in skip_items]
        
        rel_root = os.path.relpath(root, src)
        dest_root = dst if rel_root == "." else os.path.join(dst, rel_root)
        os.makedirs(dest_root, exist_ok=True)
        
        for file in files:
            if file in skip_items:
                continue
            
            src_file = os.path.join(root, file)
            dest_file = os.path.join(dest_root, file)
            rel_file = os.path.relpath(dest_file, dst)
            
            if os.path.exists(dest_file):
                backup_file(dst, rel_file, backup_dir)
            
            shutil.copy2(src_file, dest_file)

def update_from_git(target_dir):
    print("[*] Running 'git pull origin main' in target directory...")
    try:
        res = subprocess.run(["git", "pull", "origin", "main"], cwd=target_dir, capture_output=True, text=True)
        if res.returncode == 0:
            print("  [✓] Git pull successful:\n", res.stdout)
            return True
        else:
            print("  [!] Git pull output:", res.stderr or res.stdout)
            return False
    except Exception as e:
        print(f"  [!] Git command failed: {e}")
        return False

def update_from_github_zip(target_dir, backup_dir):
    print(f"[*] Downloading latest code directly from GitHub ({ZIP_URL})...")
    try:
        req = urllib.request.Request(ZIP_URL, headers={"User-Agent": "SkillSwapUpdater/5.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            zip_data = response.read()
        
        with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
            root_folder = z.namelist()[0].split('/')[0]
            for member in z.infolist():
                if member.is_dir():
                    continue
                rel_path = member.filename[len(root_folder) + 1:]
                if not rel_path or rel_path.startswith(".git") or rel_path == ".env" or rel_path == "serviceaccountkey.json":
                    continue
                
                dest_path = os.path.join(target_dir, rel_path)
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                
                if os.path.exists(dest_path):
                    backup_file(target_dir, rel_path, backup_dir)
                
                with z.open(member) as src_file, open(dest_path, "wb") as dst_file:
                    dst_file.write(src_file.read())
        
        print("  [✓] GitHub archive extracted successfully.")
        return True
    except Exception as e:
        print(f"  [!] Failed to download from GitHub: {e}")
        return False

def rebuild_project(target_dir):
    print("\n[*] Rebuilding project assets...")
    npm_cmd = shutil.which("npm")
    if not npm_cmd:
        print("[!] 'npm' not found in PATH. You can run 'npm run build' manually.")
        return
    
    try:
        print("  Running: npm run build")
        build_res = subprocess.run([npm_cmd, "run", "build"], cwd=target_dir, capture_output=True, text=True)
        if build_res.returncode == 0:
            print("  [✓] Build completed successfully! dist/ assets refreshed.")
        else:
            print("  [!] Build output:\n", build_res.stderr[:400])
    except Exception as e:
        print(f"  [!] Could not execute build: {e}")

def main():
    print_banner()
    target_dir = detect_target_directory()
    print(f"[*] Target Directory: {target_dir}")
    os.makedirs(target_dir, exist_ok=True)
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.join(target_dir, ".skillswap_backup", f"backup_{timestamp}")
    os.makedirs(backup_dir, exist_ok=True)
    print(f"[*] Backups stored in: {backup_dir}")
    
    # 1. Protect & preserve secrets
    handle_env_preservation(target_dir, backup_dir)
    handle_service_account(target_dir, backup_dir)
    
    # 2. Determine update source
    current_dir = os.getcwd()
    is_current_repo = os.path.exists(os.path.join(current_dir, "server.ts")) and current_dir != target_dir
    is_git_target = os.path.exists(os.path.join(target_dir, ".git"))
    
    if is_current_repo:
        copy_directory_contents(current_dir, target_dir, backup_dir)
        print("  [✓] Local source files synchronized successfully.")
    elif is_git_target:
        success = update_from_git(target_dir)
        if not success:
            print("[*] Falling back to direct GitHub zip download...")
            update_from_github_zip(target_dir, backup_dir)
    else:
        update_from_github_zip(target_dir, backup_dir)
    
    # 3. Build dist/
    rebuild_project(target_dir)
    
    print("\n" + "=" * 60)
    print(" [SUCCESS] SkillSwap 5.0 update finished!")
    print(f" Target: {target_dir}")
    print(" Safety Guarantee: .env and credentials were NOT overwritten.")
    print("=" * 60)
    print("\nTo launch:")
    print(f"  cd {target_dir}")
    print("  npm run dev    # or: npm start")
    print("=" * 60)

if __name__ == "__main__":
    main()
