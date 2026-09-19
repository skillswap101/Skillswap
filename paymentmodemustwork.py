import os
import sys
import subprocess

print("==================================================")
print("   SkillSwap 5.0 Payment Fix & Push Script       ")
print("==================================================")

# 1. Ensure we are in a git directory
if not os.path.exists(".git"):
    print("[+] Initializing git repository...")
    subprocess.run(["git", "init"], check=True)
    subprocess.run(["git", "branch", "-M", "main"], check=True)

# 2. Check if a downloaded zip from AI Studio exists in /sdcard/Download
download_dirs = [
    "/sdcard/Download",
    os.path.expanduser("~/storage/downloads"),
    os.path.expanduser("~/downloads")
]

zip_found = None
for d in download_dirs:
    if os.path.exists(d):
        for f in os.listdir(d):
            if f.startswith("skillswap") and f.endswith(".zip"):
                zip_found = os.path.join(d, f)
                break
    if zip_found:
        break

if zip_found:
    print(f"[+] Found downloaded SkillSwap bundle: {zip_found}")
    print("[+] Extracting latest files with all payment fixes...")
    import zipfile
    with zipfile.ZipFile(zip_found, 'r') as zf:
        zf.extractall(".")
    print("[+] Extraction complete!")
else:
    print("[!] No skillswap*.zip found in your phone's Download folder.")
    print("[i] Quick fix: Open your app preview in your phone browser:")
    print("    https://ais-dev-qr7batgxjouwqbqu6h3ju6-278776302419.europe-west2.run.app")
    print("    Click the green 'Download ZIP' button in the top bar, then run this script again.")
    print("--------------------------------------------------")
    ans = input("Do you want to stage and push whatever is currently here anyway? (y/n): ")
    if ans.lower() != 'y':
        sys.exit(0)

# 3. Stage all payment changes
print("[+] Staging all payment routers, UI components, and backend fixes...")
subprocess.run(["git", "add", "-A"], check=True)

# 4. Commit changes
commit_msg = "feat: fix and unify payment gateways (M-Pesa, Stripe, PayPal) with wallet balance sync"
print(f"[+] Committing: {commit_msg}")
res = subprocess.run(["git", "commit", "-m", commit_msg])

# 5. Push to GitHub
print("[+] Pushing to GitHub main branch...")
push_res = subprocess.run(["git", "push", "origin", "main"])

if push_res.returncode == 0:
    print("\n==================================================")
    print("   SUCCESS! All payment modes are now on GitHub! ")
    print("==================================================")
else:
    print("\n[!] Push failed. Make sure your GitHub remote and Personal Access Token (PAT) are set.")
