#!/usr/bin/env python3

from pathlib import Path
from datetime import datetime
import shutil
import re
import sys

ROOT = Path.cwd()

BRIDGE = ROOT / "src/hooks/useCloudStateBridge.ts"
APP = ROOT / "src/App.tsx"
UTIL_BRIDGE = ROOT / "src/utils/cloudStateBridge.ts"

STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")
BACKUP = ROOT.parent / f"{ROOT.name}.backup-phase1-2-{STAMP}"
REPORT = ROOT / "PHASE1_2_REPORT.md"

changes = []
warnings = []


def fail(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)


def backup_file(src: Path):
    if not src.exists():
        return

    dest = BACKUP / src.relative_to(ROOT)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)


def replace_once(path: Path, old: str, new: str, description: str):
    text = path.read_text(encoding="utf-8")

    if old not in text:
        warnings.append(f"Pattern not found; skipped: {description}")
        return False

    count = text.count(old)

    if count != 1:
        warnings.append(
            f"Expected one occurrence but found {count}; skipped: {description}"
        )
        return False

    path.write_text(text.replace(old, new), encoding="utf-8")
    changes.append(description)
    return True


print("SkillSwap 5.0 — Phase 1.2 identity/cloud safety fixer")
print()
print(f"Root: {ROOT}")
print("Mode: APPLY")
print()

if not ROOT.exists():
    fail(f"Project root does not exist: {ROOT}")

if not BRIDGE.exists():
    fail(f"Expected bridge file not found: {BRIDGE}")

if not APP.exists():
    fail(f"Expected App.tsx not found: {APP}")

# ------------------------------------------------------------
# Backup
# ------------------------------------------------------------

for path in [BRIDGE, APP]:
    backup_file(path)

BACKUP.mkdir(parents=True, exist_ok=True)

changes.append(f"Created backup: {BACKUP}")

# ------------------------------------------------------------
# 1. Remove obsolete CURRENT_USER import
# ------------------------------------------------------------

text = BRIDGE.read_text(encoding="utf-8")

old_import = """import {
  CURRENT_USER,
  INITIAL_SKILLS,
  INITIAL_PROPOSALS,
  INITIAL_SESSIONS,
  INITIAL_MESSAGES,
  INITIAL_REVIEWS,
} from '../data/mockData';
"""

new_import = """import {
  INITIAL_SKILLS,
  INITIAL_PROPOSALS,
  INITIAL_SESSIONS,
  INITIAL_MESSAGES,
  INITIAL_REVIEWS,
} from '../data/mockData';
"""

if old_import in text:
    text = text.replace(old_import, new_import)
    changes.append("Removed CURRENT_USER from Cloud Bridge imports.")
else:
    # Fallback: remove only the CURRENT_USER line.
    if "  CURRENT_USER,\n" in text:
        text = text.replace("  CURRENT_USER,\n", "")
        changes.append("Removed CURRENT_USER from Cloud Bridge imports.")
    else:
        warnings.append("CURRENT_USER import was not found in expected form.")

# ------------------------------------------------------------
# 2. Remove unused auth import from Cloud Bridge
# ------------------------------------------------------------

old = "import { db, auth, isFirebaseConfigured } from '../firebase';"
new = "import { db, isFirebaseConfigured } from '../firebase';"

if old in text:
    text = text.replace(old, new)
    changes.append("Removed unused direct Firebase Auth import from Cloud Bridge.")

# ------------------------------------------------------------
# 3. Replace unsafe {} currentUser initialization
# ------------------------------------------------------------

old_state = """  const [currentUser, setCurrentUserState] = useState<User>(() =>
    (userProfile || {}) as User
  );
"""

new_state = """  // Identity is supplied by AuthContext/Firestore only.
  // An empty structural object is used only while Firebase Auth/Firestore
  // is resolving. It is never treated as authenticated identity.
  const [currentUser, setCurrentUserState] = useState<User | null>(() =>
    userProfile ? (userProfile as User) : null
  );
"""

if old_state in text:
    text = text.replace(old_state, new_state)
    changes.append("Changed Cloud Bridge currentUser initialization to nullable.")
else:
    warnings.append("Unsafe currentUser initialization pattern was not found.")

# ------------------------------------------------------------
# 4. Update result interface
# ------------------------------------------------------------

old_interface = """  currentUser: User;
"""

new_interface = """  currentUser: User | null;
"""

if old_interface in text:
    text = text.replace(old_interface, new_interface, 1)
    changes.append("Made CloudStateBridge currentUser nullable during auth resolution.")

# ------------------------------------------------------------
# 5. Make identity synchronization explicit
# ------------------------------------------------------------

old_sync = """  useEffect(() => {
    if (userProfile) {
      setCurrentUserState(userProfile as User);
      uidRef.current = firebaseUser?.uid ?? userProfile.id ?? null;
      setAuthenticated(Boolean(firebaseUser));
      return;
    }
    uidRef.current = firebaseUser?.uid ?? null;
    setAuthenticated(Boolean(firebaseUser));
    if (!firebaseUser && !authLoading) setError("Authentication required.");
  }, [userProfile, firebaseUser, authLoading]);
"""

new_sync = """  useEffect(() => {
    // Firebase Auth is authoritative.
    if (firebaseUser) {
      uidRef.current = firebaseUser.uid;
      setAuthenticated(true);

      if (userProfile) {
        // Never allow a Firestore/client supplied ID to replace Firebase UID.
        setCurrentUserState({
          ...(userProfile as User),
          id: firebaseUser.uid,
        });
      }

      setError(null);
      return;
    }

    // No Firebase identity exists.
    uidRef.current = null;
    setAuthenticated(false);

    // Do not restore CURRENT_USER or skillswap_user.
    if (!authLoading) {
      setCurrentUserState(null);
      setError("Authentication required.");
    }
  }, [userProfile, firebaseUser, authLoading]);
"""

if old_sync in text:
    text = text.replace(old_sync, new_sync)
    changes.append("Hardened Cloud Bridge identity synchronization around Firebase UID.")
else:
    warnings.append("Expected identity synchronization block was not found.")

# ------------------------------------------------------------
# 6. Add authentication guard helper
# ------------------------------------------------------------

anchor = """  const uidRef = useRef<string | null>(null);
"""

guard = """  const uidRef = useRef<string | null>(null);

  const requireAuthenticatedUser = useCallback(() => {
    if (!isFirebaseConfigured || !firebaseUser) {
      throw new Error("Authenticated Firebase user required.");
    }

    return firebaseUser.uid;
  }, [firebaseUser]);
"""

if anchor in text and guard not in text:
    text = text.replace(anchor, guard, 1)
    changes.append("Added centralized authenticated-user guard for cloud mutations.")

# ------------------------------------------------------------
# 7. Protect addSkillToCloud
# ------------------------------------------------------------

old = """  const addSkillToCloud = useCallback(async (skill: Skill) => {
    try {
      const skillRef = doc(db, 'skills', skill.id);
"""

new = """  const addSkillToCloud = useCallback(async (skill: Skill) => {
    const uid = requireAuthenticatedUser();

    try {
      const skillRef = doc(db, 'skills', skill.id);
"""

if old in text:
    text = text.replace(old, new, 1)
    changes.append("Added Firebase authentication guard to addSkillToCloud.")

# Remove optimistic fallback for this method.
old = """    } catch (err: any) {
      console.error('[CloudBridge] Error writing skill to Firestore:', err);
      setSkillsState((prev) => [skill, ...prev.filter((s) => s.id !== skill.id)]);
    }
  }, []);
"""

new = """    } catch (err: any) {
      console.error('[CloudBridge] Error writing skill to Firestore:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);
"""

if old in text:
    text = text.replace(old, new, 1)
    changes.append("Stopped addSkillToCloud from reporting local success after Firestore failure.")

# Ensure uid is actually used so static tooling doesn't consider it accidental.
text = text.replace(
    """          ...skill,
          createdAt:""",
    """          ...skill,
          userId: skill.userId || uid,
          createdAt:""",
    1
)

# ------------------------------------------------------------
# 8. Protect updateSkillInCloud
# ------------------------------------------------------------

old = """  const updateSkillInCloud = useCallback(async (skillId: string, data: Partial<Skill>) => {
    try {
"""

new = """  const updateSkillInCloud = useCallback(async (skillId: string, data: Partial<Skill>) => {
    requireAuthenticatedUser();

    try {
"""

if old in text:
    text = text.replace(old, new, 1)
    changes.append("Added Firebase authentication guard to updateSkillInCloud.")

old = """    } catch (err: any) {
      console.error('[CloudBridge] Error updating skill in Firestore:', err);
      setSkillsState((prev) => prev.map((s) => (s.id === skillId ? { ...s, ...data } : s)));
    }
  }, []);
"""

new = """    } catch (err: any) {
      console.error('[CloudBridge] Error updating skill in Firestore:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);
"""

if old in text:
    text = text.replace(old, new, 1)
    changes.append("Stopped updateSkillInCloud from reporting local success after Firestore failure.")

# ------------------------------------------------------------
# 9. Protect deleteSkillFromCloud
# ------------------------------------------------------------

old = """  const deleteSkillFromCloud = useCallback(async (skillId: string) => {
    try {
"""

new = """  const deleteSkillFromCloud = useCallback(async (skillId: string) => {
    requireAuthenticatedUser();

    try {
"""

if old in text:
    text = text.replace(old, new, 1)
    changes.append("Added Firebase authentication guard to deleteSkillFromCloud.")

old = """    } catch (err: any) {
      console.error('[CloudBridge] Error deleting skill from Firestore:', err);
      setSkillsState((prev) => prev.filter((s) => s.id !== skillId));
    }
  }, []);
"""

new = """    } catch (err: any) {
      console.error('[CloudBridge] Error deleting skill from Firestore:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);
"""

if old in text:
    text = text.replace(old, new, 1)
    changes.append("Stopped deleteSkillFromCloud from reporting local success after Firestore failure.")

# ------------------------------------------------------------
# 10. Protect proposal/session/message/review writes
# ------------------------------------------------------------

replacements = [
    (
        """  const addProposalToCloud = useCallback(async (proposal: SwapProposal) => {
    try {
""",
        """  const addProposalToCloud = useCallback(async (proposal: SwapProposal) => {
    requireAuthenticatedUser();

    try {
""",
        "Added Firebase authentication guard to addProposalToCloud.",
    ),
    (
        """  const addSessionToCloud = useCallback(async (session: Session) => {
    try {
""",
        """  const addSessionToCloud = useCallback(async (session: Session) => {
    requireAuthenticatedUser();

    try {
""",
        "Added Firebase authentication guard to addSessionToCloud.",
    ),
    (
        """  const addMessageToCloud = useCallback(async (message: ChatMessage) => {
    try {
""",
        """  const addMessageToCloud = useCallback(async (message: ChatMessage) => {
    requireAuthenticatedUser();

    try {
""",
        "Added Firebase authentication guard to addMessageToCloud.",
    ),
    (
        """  const addReviewToCloud = useCallback(async (review: Review) => {
    try {
""",
        """  const addReviewToCloud = useCallback(async (review: Review) => {
    requireAuthenticatedUser();

    try {
""",
        "Added Firebase authentication guard to addReviewToCloud.",
    ),
]

for old, new, description in replacements:
    if old in text:
        text = text.replace(old, new, 1)
        changes.append(description)

# Update dependency arrays for the guarded methods.
text = re.sub(
    r"(const addProposalToCloud = useCallback\([\s\S]*?\
  \}, )\[\]",
    r"\1[requireAuthenticatedUser]",
    text,
    count=1
)

text = re.sub(
    r"(const addSessionToCloud = useCallback\([\s\S]*?\
  \}, )\[\]",
    r"\1[requireAuthenticatedUser]",
    text,
    count=1
)

text = re.sub(
    r"(const addMessageToCloud = useCallback\([\s\S]*?\
  \}, )\[\]",
    r"\1[requireAuthenticatedUser]",
    text,
    count=1
)

text = re.sub(
    r"(const addReviewToCloud = useCallback\([\s\S]*?\
  \}, )\[\]",
    r"\1[requireAuthenticatedUser]",
    text,
    count=1
)

# ------------------------------------------------------------
# 11. Convert write failure fallbacks to real failures
# ------------------------------------------------------------

patterns = [
    (
        """      console.error('[CloudBridge] Error writing proposal to Firestore:', err);
      setProposalsState((prev) => [proposal, ...prev.filter((p) => p.id !== proposal.id)]);
""",
        """      console.error('[CloudBridge] Error writing proposal to Firestore:', err);
      throw err;
""",
        "Made proposal Firestore failure fail closed.",
    ),
    (
        """        console.error('[CloudBridge] Error updating proposal status in Firestore:', err);
        setProposalsState((prev) => prev.map((p) => (p.id === proposalId ? { ...p, status } : p)));
""",
        """        console.error('[CloudBridge] Error updating proposal status in Firestore:', err);
        throw err;
""",
        "Made proposal status Firestore failure fail closed.",
    ),
    (
        """      console.error('[CloudBridge] Error writing session to Firestore:', err);
      setSessionsState((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
""",
        """      console.error('[CloudBridge] Error writing session to Firestore:', err);
      throw err;
""",
        "Made session Firestore failure fail closed.",
    ),
    (
        """      console.error('[CloudBridge] Error updating session in Firestore:', err);
      setSessionsState((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s)));
""",
        """      console.error('[CloudBridge] Error updating session in Firestore:', err);
      throw err;
""",
        "Made session update Firestore failure fail closed.",
    ),
    (
        """      console.error('[CloudBridge] Error writing message to Firestore:', err);
      setMessagesState((prev) => [...prev, message]);
""",
        """      console.error('[CloudBridge] Error writing message to Firestore:', err);
      throw err;
""",
        "Made message Firestore failure fail closed.",
    ),
    (
        """      console.error('[CloudBridge] Error writing review to Firestore:', err);
      setReviewsState((prev) => [review, ...prev.filter((r) => r.id !== review.id)]);
""",
        """      console.error('[CloudBridge] Error writing review to Firestore:', err);
      throw err;
""",
        "Made review Firestore failure fail closed.",
    ),
]

for old, new, description in patterns:
    if old in text:
        text = text.replace(old, new, 1)
        changes.append(description)

# ------------------------------------------------------------
# 12. Guard dispatcher-based writes
# ------------------------------------------------------------

for name, setter, collection_name, description in [
    (
        "setSkills",
        "setSkillsState",
        "skills",
        "Added authentication guard to setSkills cloud writes.",
    ),
    (
        "setProposals",
        "setProposalsState",
        "proposals",
        "Added authentication guard to setProposals cloud writes.",
    ),
    (
        "setSessions",
        "setSessionsState",
        "sessions",
        "Added authentication guard to setSessions cloud writes.",
    ),
    (
        "setMessages",
        "setMessagesState",
        "messages",
        "Added authentication guard to setMessages cloud writes.",
    ),
    (
        "setReviews",
        "setReviewsState",
        "reviews",
        "Added authentication guard to setReviews cloud writes.",
    ),
]:
    # Insert guard at the start of each callback if not already present.
    pattern = (
        rf"(const {name}: Dispatch<SetStateAction<[^>]+>> = useCallback\(\(action\) => \{{)"
    )

    replacement = r"\1\n    if (!firebaseUser) {\n      console.warn('[CloudBridge] Ignoring cloud mutation without Firebase authentication.');\n      return;\n    }"

    new_text, count = re.subn(pattern, replacement, text, count=1)

    if count:
        text = new_text
        changes.append(description)

# ------------------------------------------------------------
# 13. Make setCurrentUser identity immutable
# ------------------------------------------------------------

old = """      const safeUser = { ...nextUser, id: uid };
      updateUserProfile(safeUser).catch((err) => {
"""

new = """      const safeUser = {
        ...nextUser,
        id: uid,
      };

      updateUserProfile(safeUser).catch((err) => {
"""

if old in text:
    text = text.replace(old, new, 1)

# ------------------------------------------------------------
# 14. Remove obsolete CURRENT_USER references
# ------------------------------------------------------------

if "CURRENT_USER" in text:
    warnings.append(
        "CURRENT_USER still appears in useCloudStateBridge.ts after automatic cleanup."
    )
else:
    changes.append("Verified Cloud Bridge contains no CURRENT_USER reference.")

# ------------------------------------------------------------
# 15. Save bridge
# ------------------------------------------------------------

BRIDGE.write_text(text, encoding="utf-8")

# ------------------------------------------------------------
# 16. Check App's bridge import and flag wrapper
# ------------------------------------------------------------

app_text = APP.read_text(encoding="utf-8")

if 'from "./utils/cloudStateBridge"' in app_text:
    warnings.append(
        "App.tsx imports useCloudStateBridge from src/utils/cloudStateBridge.ts. "
        "Verify that this wrapper points to the corrected hook."
    )

# ------------------------------------------------------------
# 17. Static safety checks
# ------------------------------------------------------------

final_text = BRIDGE.read_text(encoding="utf-8")

if "CURRENT_USER" in final_text:
    warnings.append("FAIL: CURRENT_USER remains in Cloud Bridge.")

if "skillswap_user" in final_text:
    warnings.append("FAIL: skillswap_user appears in Cloud Bridge.")

if "setCurrentUserState(() =>\n    (userProfile || {})" in final_text:
    warnings.append("FAIL: unsafe empty-object currentUser initialization remains.")

if "const [currentUser, setCurrentUserState] = useState<User | null>" not in final_text:
    warnings.append("WARNING: nullable currentUser declaration not detected.")

# ------------------------------------------------------------
# 18. Report
# ------------------------------------------------------------

report = []
report.append("# SkillSwap Phase 1.2 Correction Report")
report.append("")
report.append(f"- Generated: {datetime.now().isoformat(timespec='seconds')}")
report.append(f"- Backup: `{BACKUP}`")
report.append("")
report.append("## Changes applied")
report.append("")

if changes:
    for item in changes:
        report.append(f"- {item}")
else:
    report.append("- No automatic changes were applied.")

report.append("")
report.append("## Warnings / manual verification")
report.append("")

if warnings:
    for item in warnings:
        report.append(f"- {item}")
else:
    report.append("- None.")

report.append("")
report.append("## Phase 1.2 objectives")
report.append("")
report.append("- Firebase Auth remains the authoritative identity source.")
report.append("- Firebase UID cannot be replaced by a client-supplied ID.")
report.append("- Cloud Bridge does not use CURRENT_USER as authenticated identity.")
report.append("- Cloud mutations require Firebase authentication.")
report.append("- Firestore write failures are not converted into false local success.")
report.append("- Offline localStorage remains a data cache only.")
report.append("")
report.append("## Deliberately not changed")
report.append("")
report.append("- Firestore security rules.")
report.append("- Broad collection query architecture.")
report.append("- Credits/escrow.")
report.append("- Payments.")
report.append("- WebRTC authorization.")
report.append("- AI/rate limiting.")
report.append("- API consolidation.")
report.append("")
report.append("## Next step")
report.append("")
report.append("Run:")
report.append("")
report.append("```bash")
report.append("npm run build")
report.append("```")
report.append("")
report.append("If the build passes, test the browser and Firebase authentication before moving to Phase 2.")

REPORT.write_text("\n".join(report) + "\n", encoding="utf-8")

print()
print("Completed.")
print(f"Backup: {BACKUP}")
print(f"Report: {REPORT}")

if warnings:
    print()
    print("Warnings:")
    for item in warnings:
        print(f" - {item}")

print()
print("Next step: npm run build")
