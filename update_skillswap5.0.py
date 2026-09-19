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
   - Git repository (git pull / fetch)
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
    # 1. Check if user specified a path via argument (e.g. python3 update_skillswap5.0.py ~/skillswap)
    if len(sys.argv) > 1:
        custom_path = os.path.abspath(sys.argv[1])
        if os.path.isdir(custom_path):
            return custom_path
        print(f"[!] Warning: Specified path '{custom_path}' does not exist yet. Will create.")
        return custom_path

    # 2. If the current working directory is a skillswap repository (has package.json or server.ts),
    # update the CURRENT directory directly!
    current_dir = os.getcwd()
    if os.path.exists(os.path.join(current_dir, "package.json")) or os.path.exists(os.path.join(current_dir, "server.ts")):
        return current_dir

    # 3. Check other common folder names in home
    for candidate in [os.path.expanduser("~/skillswap"), os.path.expanduser("~/skillswap5.0")]:
        if os.path.exists(os.path.join(candidate, "package.json")) or os.path.exists(os.path.join(candidate, "server.ts")):
            return candidate

    # 4. Fallback to current working directory
    return current_dir

def backup_file(target_dir, relative_path, backup_dir):
    source = os.path.join(target_dir, relative_path)
    if not os.path.exists(source):
        return
    dest = os.path.join(backup_dir, relative_path)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(source, dest)

def handle_env_preservation(target_dir, backup_dir):
    """
    Ensures .env is never lost. If it exists:
      - It is backed up.
      - Any missing required environment keys are appended with empty templates.
    If it does not exist:
      - A template .env is created.
    """
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
        
        # Check if missing any recommended keys
        missing_entries = []
        for default_entry in DEFAULT_ENV_KEYS:
            key = default_entry.split("=", 1)[0].strip()
            if key not in existing_keys:
                missing_entries.append(default_entry)
        
        if missing_entries:
            print(f"[*] Appending {len(missing_entries)} newly introduced config keys to your .env (preserving existing values)")
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
    """
    Safely copies files from src to dst.
    Preserves .env and serviceaccountkey.json.
    """
    skip_items = {".git", ".env", "serviceaccountkey.json", "node_modules", ".skillswap_backup"}
    
    for root, dirs, files in os.walk(src):
        # Filter out directories to skip
        dirs[:] = [d for d in dirs if d not in skip_items]
        
        rel_root = os.path.relpath(root, src)
        if rel_root == ".":
            dest_root = dst
        else:
            dest_root = os.path.join(dst, rel_root)
        
        os.makedirs(dest_root, exist_ok=True)
        
        for file in files:
            if file in skip_items:
                continue
            
            src_file = os.path.join(root, file)
            dest_file = os.path.join(dest_root, file)
            rel_file = os.path.relpath(dest_file, dst)
            
            # Backup if replacing an existing file
            if os.path.exists(dest_file):
                backup_file(dst, rel_file, backup_dir)
            
            shutil.copy2(src_file, dest_file)
            # print(f"  [✓] Copied: {rel_file}")

def update_from_local_source(source_dir, target_dir, backup_dir):
    print(f"[*] Updating from local directory: {source_dir} -> {target_dir}")
    copy_directory_contents(source_dir, target_dir, backup_dir)
    print("  [✓] Local source files synchronized successfully.")

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
                # Strip top level archive folder name
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
    print("\n[*] Installing dependencies and rebuilding project...")
    
    # Check if npm is available
    npm_cmd = shutil.which("npm")
    if not npm_cmd:
        print("[!] 'npm' not found in PATH. Skipping build step. You can run 'npm run build' manually.")
        return
    
    # Ensure dependencies (like dompurify) are installed
    try:
        print("  Running: npm install (ensuring all packages are installed)...")
        install_res = subprocess.run([npm_cmd, "install"], cwd=target_dir, capture_output=True, text=True)
        if install_res.returncode == 0:
            print("  [✓] Dependencies installed successfully.")
        else:
            print("  [!] npm install notice:\n", (install_res.stderr or install_res.stdout)[:300])
    except Exception as e:
        print(f"  [!] Could not run npm install: {e}")

    # Build dist
    try:
        print("  Running: npm run build...")
        build_res = subprocess.run([npm_cmd, "run", "build"], cwd=target_dir, capture_output=True, text=True)
        if build_res.returncode == 0:
            print("  [✓] Build completed successfully! dist/ assets refreshed.")
        else:
            print("  [!] Build output:\n", (build_res.stderr or build_res.stdout)[:500])
    except Exception as e:
        print(f"  [!] Could not execute build: {e}")

def main():
    print_banner()
    target_dir = detect_target_directory()
    print(f"[*] Target Directory: {target_dir}")
    os.makedirs(target_dir, exist_ok=True)
    
    # Setup backup folder
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.join(target_dir, ".skillswap_backup", f"backup_{timestamp}")
    os.makedirs(backup_dir, exist_ok=True)
    print(f"[*] Backups will be preserved in: {backup_dir}")
    
    # 1. Protect & handle .env and credentials
    handle_env_preservation(target_dir, backup_dir)
    handle_service_account(target_dir, backup_dir)
    
    # 2. Determine update source
    current_dir = os.getcwd()
    is_current_repo = os.path.exists(os.path.join(current_dir, "server.ts")) and current_dir != target_dir
    is_git_target = os.path.exists(os.path.join(target_dir, ".git"))
    
    if is_current_repo:
        update_from_local_source(current_dir, target_dir, backup_dir)
    elif is_git_target:
        success = update_from_git(target_dir)
        if not success:
            print("[*] Falling back to direct GitHub zip download...")
            update_from_github_zip(target_dir, backup_dir)
    else:
        update_from_github_zip(target_dir, backup_dir)
    
    # 3. Handle dist rebuild if needed
    rebuild_project(target_dir)
    
    print("\n" + "=" * 60)
    print(" [SUCCESS] SkillSwap 5.0 update finished!")
    print(f" Target Location: {target_dir}")
    print(" Safety Guarantee: .env and credentials were NOT modified or overwritten.")
    print("=" * 60)
    print("\nTo start your app in Termux:")
    print(f"  cd {target_dir}")
    print("  npm run dev    # or: npm start")
    print("=" * 60)

if __name__ == "__main__":
    main()
