#!/usr/init/env python3
import os
import sys
from pathlib import Path
from datetime import datetime
import shutil
import re
import subprocess

ROOT = Path.cwd()
APP = ROOT / "src/App.tsx"
BRIDGE = ROOT / "src/utils/cloudStateBridge.ts"
REPO = ROOT / "src/utils/firestoreRepository.ts"
MOCK = ROOT / "src/data/mockData.ts"
AUTH = ROOT / "src/context/AuthContext.tsx"

STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")
BACKUP = ROOT / ".skillswap-backups" / f"app-cloud-bridge-{STAMP}"

def fail(message):
    print()
    print("=" * 78)
    print("ABORTED — NO UNSAFE PATCH WAS APPLIED")
    print("=" * 78)
    print(message)
    sys.exit(1)

def backup_file(path):
    if not path.exists():
        return
    destination = BACKUP / path.relative_to(ROOT)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, destination)
    print("[BACKUP]", path)

def write_file(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    print("[WRITE]", path)

def run(command, label):
    print()
    print("=" * 78)
    print(label)
    print("=" * 78)
    print("$", " ".join(command))
    
    result = subprocess.run(command, cwd=ROOT, text=True)
    if result.returncode != 0:
        print("[FAIL]", label)
        return False
    print("[PASS]", label)
    return True

def main():
    print("=" * 78)
    print("SkillSwap 5.0 — App → Firestore Primary State Bridge (Flexible Match)")
    print("=" * 78)

    required = [APP, BRIDGE, REPO, MOCK, AUTH]
    for path in required:
        if not path.exists():
            fail(f"Required file is missing: {path}")

    app_text = APP.read_text()
    for path in [APP, BRIDGE, REPO]:
        backup_file(path)

    # 1. Remove mockData import for state if present
    mock_import_pattern = re.compile(
        r"import\s*\{[^}]*CURRENT_USER[^}]*\}\s*from\s*['\"]\.\/data\/mockData['\"];\s*",
        re.MULTILINE | re.DOTALL
    )
    app_text = mock_import_pattern.sub("", app_text)

    # 2. Add useCloudStateBridge import if not present
    if "useCloudStateBridge" not in app_text:
        imports = re.findall(r"^import .*?;$", app_text, flags=re.MULTILINE)
        if imports:
            last_import = imports[-1]
            app_text = app_text.replace(
                last_import,
                last_import + '\nimport { useCloudStateBridge } from "./utils/cloudStateBridge";',
                1,
            )
        else:
            app_text = 'import { useCloudStateBridge } from "./utils/cloudStateBridge";\n' + app_text

    # 3. Locate currentUser start and reviews end dynamically
    start_marker = "const [currentUser, setCurrentUser]"
    end_marker = "const [reviews, setReviews]"

    start_idx = app_text.find(start_marker)
    if start_idx == -1:
        fail("Could not find currentUser state declaration in App.tsx.")

    # Find the end of the reviews useState block (find the matching closing parenthesis/semicolon after reviews)
    reviews_idx = app_text.find(end_marker, start_idx)
    if reviews_idx == -1:
        fail("Could not find reviews state declaration in App.tsx.")

    # Find the end of the reviews useState statement (look for }); after reviews_idx)
    end_stmt_idx = app_text.find("});", reviews_idx)
    if end_stmt_idx == -1:
        fail("Could not find the end of reviews state initialization in App.tsx.")
    
    end_idx = end_stmt_idx + len("});")

    # Extract slice to replace
    old_block = app_text[start_idx:end_idx]
    print(f"[INFO] Successfully located state block from index {start_idx} to {end_idx}")

    replacement = """const {
    currentUser,
    setCurrentUser,
    skills,
    setSkills,
    proposals,
    setProposals,
    sessions,
    setSessions,
    messages,
    setMessages,
    reviews,
    setReviews,
    loading: cloudLoading,
    authenticated: cloudAuthenticated,
    error: cloudError,
  } = useCloudStateBridge();"""

    app_text = app_text[:start_idx] + replacement + app_text[end_idx:]
    print("[REPLACED] Local state hooks block with useCloudStateBridge()")

    # 4. Add loading/auth guard if not present
    marker = "  const pendingCount = proposals.filter("
    if marker in app_text and "cloudLoading" not in app_text:
        guard = r'''
  if (cloudLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-lg font-bold">Connecting to SkillSwap…</div>
          <div className="text-sm text-slate-400 mt-2">
            Synchronizing your account and workspace.
          </div>
        </div>
      </div>
    );
  }

  if (!cloudAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-lg font-bold">Authentication required</div>
          <div className="text-sm text-slate-400 mt-2">
            Sign in to load your SkillSwap workspace.
          </div>
        </div>
      </div>
    );
  }

  if (cloudError) {
    console.warn("[SkillSwap] Cloud synchronization warning:", cloudError);
  }
'''
        app_text = app_text.replace(marker, guard + marker, 1)
        print("[ADDED] Cloud loading/authentication boundary")

    write_file(APP, app_text)

    print()
    print("=" * 78)
    print("PATCH COMPLETE — RUNNING BUILD CHECK")
    print("=" * 78)

    ok_build = run(["npm", "run", "build"], "PRODUCTION BUILD")

    if ok_build:
        print()
        print("SUCCESS: SkillSwap successfully bridged to Firestore!")
        sys.exit(0)
    else:
        print()
        print("BUILD FAILED. Restoring backup...")
        shutil.copytree(BACKUP, ROOT, dirs_exist_ok=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
