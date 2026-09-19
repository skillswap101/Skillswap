
#!/usr/bin/env python3
"""
SkillSwap 5.0 — Phase 0 + Phase 1 repair script

Phase 0: security/safety baseline
Phase 1: Firebase Auth becomes the authoritative application identity

Run from the SkillSwap project root:
    python3 fix_skillswap_phase0_phase1.py --dry-run
    python3 fix_skillswap_phase0_phase1.py

The script creates a timestamped backup before applying changes.
It does NOT run npm/node, rotate cloud credentials, overwrite Firestore rules,
or modify payment/escrow logic.
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import shutil
from pathlib import Path

ROOT = Path.cwd()
STAMP = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
BACKUP = ROOT.parent / f"{ROOT.name}.backup-phase0-phase1-{STAMP}"
REPORT = ROOT / "PHASE0_PHASE1_REPORT.md"
SKIP = {"node_modules", ".git", "dist", "build"}
CHANGES: list[str] = []
WARNINGS: list[str] = []


def read(p: Path) -> str | None:
    try:
        return p.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def write(p: Path, text: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def ok(msg: str) -> None:
    print("OK:", msg)
    CHANGES.append(msg)


def warn(msg: str) -> None:
    print("WARNING:", msg)
    WARNINGS.append(msg)


def backup_project() -> None:
    if BACKUP.exists():
        raise SystemExit(f"Backup already exists: {BACKUP}")
    shutil.copytree(ROOT, BACKUP, ignore=shutil.ignore_patterns(*SKIP))
    ok(f"Created backup: {BACKUP}")


def harden_gitignore() -> None:
    p = ROOT / ".gitignore"
    text = read(p) or ""
    required = [
        ".env",
        ".env.*",
        "!.env.example",
        "serviceaccountkey.json",
        "*.pem",
        "*.key",
        "*.p12",
        "*.crt",
    ]
    missing = [x for x in required if x not in text.splitlines()]
    if missing:
        if text and not text.endswith("\n"):
            text += "\n"
        text += "\n# SkillSwap Phase 0 security exclusions\n"
        text += "\n".join(missing) + "\n"
        write(p, text)
        ok("Hardened .gitignore for credentials and environment files.")
    else:
        ok(".gitignore already contains the required Phase 0 exclusions.")


def create_env_example() -> None:
    p = ROOT / ".env.example"
    if p.exists():
        ok(".env.example already exists; left unchanged.")
        return
    write(p, """# SkillSwap environment template — NEVER put real secrets here
NODE_ENV=development
CORS_ORIGIN=

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
""")
    ok("Created .env.example.")


def scan_secrets() -> None:
    for name in (".env", "serviceaccountkey.json"):
        if (ROOT / name).exists():
            warn(f"Sensitive file exists: {name}. Do not commit/share it. Rotate credentials if exposed.")

    patterns = [
        r"-----BEGIN PRIVATE KEY-----",
        r"-----BEGIN RSA PRIVATE KEY-----",
        r"sk_live_[A-Za-z0-9]+",
    ]
    hits = []
    for p in ROOT.rglob("*"):
        if not p.is_file() or any(part in SKIP for part in p.parts):
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        if any(re.search(x, text) for x in patterns):
            hits.append(str(p.relative_to(ROOT)))
    if hits:
        warn("Possible private-key/secret material found: " + ", ".join(sorted(set(hits))))


def remove_firebase_fallback() -> None:
    p = ROOT / "src/firebase.ts"
    text = read(p)
    if text is None:
        warn("src/firebase.ts not found.")
        return

    old = text
    # Remove the known fake key from the primary config.
    text = text.replace('apiKey: isFirebaseConfigured ? rawApiKey : "AIzaSyFakeKeyForLocalFallbackMode0000",',
                        'apiKey: rawApiKey,')

    # Replace the entire fallback initialization block with fail-fast behavior.
    fallback = re.compile(
        r"try \{\n\s*app = getApps\(\)\.length \? getApps\(\)\[0\] : initializeApp\(firebaseConfig\);\n\s*authInstance = getAuth\(app\);\n\s*dbInstance = getFirestore\(app\);\n\s*storageInstance = getStorage\(app\);\n\s*\} catch \(err\) \{.*?\n\}\n\nexport const auth = authInstance!;\nexport const db = dbInstance!;\nexport const storage = storageInstance!;\nexport default app!;",
        re.S,
    )
    replacement = '''if (!isFirebaseConfigured) {
  throw new Error(
    "Firebase is not configured. Set the required VITE_FIREBASE_* environment variables."
  );
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const authInstance = getAuth(app);
const dbInstance = getFirestore(app);
const storageInstance = getStorage(app);

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export default app;'''
    text, n = fallback.subn(replacement, text, count=1)
    # Remove the old TypeScript declarations that precede the fallback block.
    text = re.sub(r"let app: FirebaseApp;\nlet authInstance: Auth;\nlet dbInstance: Firestore;\nlet storageInstance: FirebaseStorage;\n\n", "", text, count=1)

    # Remove the old default/fallback values for the remaining Firebase fields.
    text = re.sub(r'authDomain: import\.meta\.env\.VITE_FIREBASE_AUTH_DOMAIN \|\| `\$\{projectId\}\.firebaseapp\.com`,',
                  'authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,', text)
    text = re.sub(r'storageBucket: import\.meta\.env\.VITE_FIREBASE_STORAGE_BUCKET \|\| `\$\{projectId\}\.appspot\.com`,',
                  'storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,', text)
    text = re.sub(r'messagingSenderId: import\.meta\.env\.VITE_FIREBASE_MESSAGING_SENDER_ID \|\| "105713208031",',
                  'messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,', text)
    text = re.sub(r'appId: import\.meta\.env\.VITE_FIREBASE_APP_ID \|\| "1:105713208031:web:skillswap50app",',
                  'appId: import.meta.env.VITE_FIREBASE_APP_ID,', text)

    if text != old:
        write(p, text)
        ok("Removed Firebase client fallback/fake configuration and changed it to fail closed.")
    else:
        ok("Firebase fallback changes were already applied or were not needed.")


def remove_local_auth_fallbacks() -> None:
    p = ROOT / "src/context/AuthContext.tsx"
    text = read(p)
    if text is None:
        warn("AuthContext.tsx not found.")
        return

    original = text

    # Remove local profile loader as an identity source.
    text = re.sub(
        r'\nfunction getSavedLocalProfile\(\): UserProfile \{.*?\n\}\n',
        '\n', text, count=1, flags=re.S
    )


    # Replace the profile initializer with null: Firebase is authoritative.
    text = re.sub(
        r'useState<UserProfile \| null>\(\(\) => getSavedLocalProfile\(\)\)',
        'useState<UserProfile | null>(null)', text, count=1
    )

    # Firestore sync: remove localStorage writes and replace catch fallback with throw.
    text = text.replace('        localStorage.setItem("skillswap_user", JSON.stringify(profile));\n', '')
    text = text.replace('      localStorage.setItem("skillswap_user", JSON.stringify(newProfile));\n', '')
    text = re.sub(
        r'\s*\} catch \(err\) \{\n\s*console\.warn\("\[AuthContext\] Firestore sync fallback to local:", err\);\n\s*const fallbackProfile: UserProfile = \{.*?\n\s*return fallbackProfile;\n\s*\}',
        '''    } catch (err) {
      console.error("[AuthContext] Firestore profile sync failed:", err);
      throw err;
    }''', text, count=1, flags=re.S
    )

    # When no Firebase config exists, fail closed instead of loading a local identity.
    text = re.sub(
        r'if \(!auth \|\| !isFirebaseConfigured\) \{\n\s*setUserProfile\(getSavedLocalProfile\(\)\);\n\s*setLoading\(false\);\n\s*return;\n\s*\}',
        '''if (!auth || !isFirebaseConfigured) {
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
      setError("Firebase Authentication is not configured.");
      return;
    }''', text, count=1
    )

    # Observer: signed-out state must be null, not local profile.
    text = text.replace('          } else {\n            setUserProfile(getSavedLocalProfile());\n          }',
                        '          } else {\n            setUserProfile(null);\n          }')
    text = text.replace('          console.warn("[AuthContext] Auth observer warning, using local profile:", authErr);\n          setUserProfile(getSavedLocalProfile());',
                        '          console.error("[AuthContext] Auth observer error:", authErr);\n          setCurrentUser(null);\n          setUserProfile(null);\n          setError(authErr.message || "Authentication observer failed.");')
    text = text.replace('      setUserProfile(getSavedLocalProfile());\n      setLoading(false);',
                        '      setCurrentUser(null);\n      setUserProfile(null);\n      setLoading(false);')

    # Replace login's non-Firebase demo branch.
    text = re.sub(
        r'\s*\} else \{\n\s*const demoUser: UserProfile = \{.*?\n\s*localStorage\.setItem\("skillswap_user", JSON\.stringify\(demoUser\)\);\n\s*\}',
        '''    } else {
        throw new Error("Firebase Authentication is not configured.");
      }''', text, count=1, flags=re.S
    )

    # Remove invalid-api-key local-login catch block.
    text = re.sub(
        r'\n\s*if \(err\?\.code === "auth/invalid-api-key" \|\| err\?\.message\?\.includes\("invalid-api-key"\)\) \{.*?\n\s*return;\n\s*\}',
        '\n      // Never fall back to a local identity when Firebase authentication fails.\n      ', text, count=1, flags=re.S
    )

    # Replace signup's non-Firebase demo branch.
    text = re.sub(
        r'\s*\} else \{\n\s*const newDemoProfile: UserProfile = \{.*?\n\s*localStorage\.setItem\("skillswap_user", JSON\.stringify\(newDemoProfile\)\);\n\s*\}',
        '''    } else {
        throw new Error("Firebase Authentication is not configured.");
      }''', text, count=1, flags=re.S
    )

    # Remove second invalid-api-key local-signup block if still present.
    text = re.sub(
        r'\n\s*if \(err\?\.code === "auth/invalid-api-key" \|\| err\?\.message\?\.includes\("invalid-api-key"\)\) \{.*?\n\s*return;\n\s*\}',
        '\n      // Do not create a local/demo identity when Firebase rejects configuration.\n      ', text, count=1, flags=re.S
    )

    # Remove localStorage from profile updates and make failures fail closed.
    text = text.replace('          localStorage.setItem("skillswap_user", JSON.stringify(updated));\n', '')
    text = re.sub(
        r'\s*\} catch \(err: any\) \{\n\s*console\.warn\("Updated profile locally:", err\);\n\s*setUserProfile\(\(prev\) => \{.*?\n\s*\}\);\n\s*\}',
        '''    } catch (err: any) {
      console.error("[AuthContext] Profile update failed:", err);
      throw err;
    }''', text, count=1, flags=re.S
    )

    # AuthContext should not persist authoritative identity in localStorage.
    if text != original:
        write(p, text)
        ok("Removed local/demo authentication identity fallbacks from AuthContext.")
    else:
        warn("AuthContext did not match expected fallback patterns; inspect manually.")


def harden_profile_update() -> None:
    p = ROOT / "src/context/AuthContext.tsx"
    text = read(p)
    if text is None:
        warn("AuthContext.tsx not found.")
        return

    block_re = re.compile(r"const updateUserProfile = async \(data: Partial<UserProfile>\) => \{.*?\n  \};", re.S)
    replacement = """const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser || !isFirebaseConfigured || !db) {
      throw new Error("Authenticated Firebase user required for profile updates.");
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        ...data,
        id: currentUser.uid,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, ...data, id: currentUser.uid } : null));
    } catch (err: any) {
      console.error("[AuthContext] Profile update failed:", err);
      throw err;
    }
  };"""
    text2, n = block_re.subn(replacement, text, count=1)
    if n:
        write(p, text2)
        ok("Made profile updates fail closed when no Firebase user is authenticated.")
    else:
        warn("Could not locate updateUserProfile block; inspect manually.")

def migrate_bridge_identity() -> None:
    p = ROOT / "src/hooks/useCloudStateBridge.ts"
    text = read(p)
    if text is None:
        warn("useCloudStateBridge.ts not found.")
        return

    original = text
    # The bridge no longer owns an auth listener; AuthContext does.
    text = text.replace("import { onAuthStateChanged } from 'firebase/auth';\n", "")
    if "../context/AuthContext" not in text:
        anchor = "import { db, auth, isFirebaseConfigured } from '../firebase';\n"
        if anchor in text:
            text = text.replace(anchor, anchor + "import { useAuth } from '../context/AuthContext';\n", 1)
        else:
            warn("Could not safely add useAuth import to cloud bridge.")
            return

    # Replace localStorage-backed currentUser initializer.
    old_init = """  const [currentUser, setCurrentUserState] = useState<User>(() =>
    loadFromOfflineCache('skillswap_user', CURRENT_USER)
  );"""
    new_init = """  const { currentUser: firebaseUser, userProfile, loading: authLoading, updateUserProfile } = useAuth();

  // Firebase Auth + Firestore profile are the authoritative identity source.
  // localStorage is intentionally NOT used to initialize currentUser.
  const [currentUser, setCurrentUserState] = useState<User>(() =>
    (userProfile || CURRENT_USER) as User
  );"""
    if old_init in text:
        text = text.replace(old_init, new_init, 1)
        ok("Cloud bridge currentUser no longer initializes from skillswap_user localStorage.")
    else:
        warn("Cloud bridge currentUser initializer did not match expected code.")

    # Remove currentUser from localStorage synchronization effect.
    text = text.replace("      localStorage.setItem('skillswap_user', JSON.stringify(currentUser));\n", "")
    text = text.replace("  }, [currentUser, skills, proposals, sessions, messages, reviews]);", "  }, [skills, proposals, sessions, messages, reviews]);", 1)

    # Insert synchronization from AuthContext profile.
    marker = "  // Direct Firestore mutation methods\n"
    sync_effect = """  useEffect(() => {
    if (userProfile) {
      setCurrentUserState(userProfile as User);
    } else if (!firebaseUser && !authLoading) {
      // No authenticated identity: do not restore an old local user.
      setCurrentUserState(CURRENT_USER as User);
    }
  }, [userProfile, firebaseUser, authLoading]);

"""
    if marker in text and "No authenticated identity: do not restore" not in text:
        text = text.replace(marker, sync_effect + marker, 1)

    # Remove duplicate auth listener and use AuthContext identity instead.
    listener_start = "  // Main real-time Firestore listeners\n"
    start = text.find(listener_start)
    set_user_start = text.find("  const setCurrentUser = useCallback", start if start >= 0 else 0)
    if start >= 0 and set_user_start > start:
        old_block = text[start:set_user_start]
        new_block = """  // Main real-time Firestore listeners\n  useEffect(() => {
    let disposed = false;
    const unsubscribers: Unsubscribe[] = [];

    const stop = () => {
      unsubscribers.forEach((unsub) => {
        try { unsub(); } catch {}
      });
      unsubscribers.length = 0;
    };

    if (!isFirebaseConfigured || !firebaseUser) {
      uidRef.current = null;
      setAuthenticated(false);
      setLoading(false);
      return () => stop();
    }

    const uid = firebaseUser.uid;
    uidRef.current = uid;
    setAuthenticated(true);
    setLoading(true);

    const setup = async () => {
      try {
        // Profile identity is owned by AuthContext.
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && !disposed) {
          setCurrentUserState({ id: uid, ...userSnap.data() } as User);
        }

        const skillsQuery = query(collection(db, 'skills'));
        unsubscribers.push(onSnapshot(skillsQuery, (snapshot) => {
          if (!disposed && !snapshot.empty) setSkillsState(snapshot.docs.map((d) => cleanData<Skill>(d)));
        }, (err) => console.warn('[CloudBridge] skills sync warning:', err)));

        const proposalsQuery = query(collection(db, 'proposals'));
        unsubscribers.push(onSnapshot(proposalsQuery, (snapshot) => {
          if (!disposed && !snapshot.empty) setProposalsState(snapshot.docs.map((d) => cleanData<SwapProposal>(d)));
        }, (err) => console.warn('[CloudBridge] proposals sync warning:', err)));

        const sessionsQuery = query(collection(db, 'sessions'));
        unsubscribers.push(onSnapshot(sessionsQuery, (snapshot) => {
          if (!disposed && !snapshot.empty) setSessionsState(snapshot.docs.map((d) => cleanData<Session>(d)));
        }, (err) => console.warn('[CloudBridge] sessions sync warning:', err)));

        const messagesQuery = query(collection(db, 'messages'));
        unsubscribers.push(onSnapshot(messagesQuery, (snapshot) => {
          if (!disposed && !snapshot.empty) setMessagesState(snapshot.docs.map((d) => cleanData<ChatMessage>(d)));
        }, (err) => console.warn('[CloudBridge] messages sync warning:', err)));

        const reviewsQuery = query(collection(db, 'reviews'));
        unsubscribers.push(onSnapshot(reviewsQuery, (snapshot) => {
          if (!disposed && !snapshot.empty) setReviewsState(snapshot.docs.map((d) => cleanData<Review>(d)));
        }, (err) => console.warn('[CloudBridge] reviews sync warning:', err)));

        if (!disposed) setLoading(false);
      } catch (err: any) {
        console.error('[CloudBridge] listener setup failed:', err);
        if (!disposed) {
          setError(err?.message || 'Cloud synchronization failed');
          setLoading(false);
        }
      }
    };

    setup();
    return () => {
      disposed = true;
      stop();
    };
  }, [firebaseUser, authLoading]);

"""
        text = text.replace(old_block, new_block, 1)
        ok("Removed duplicate onAuthStateChanged listener from cloud bridge; it now consumes AuthContext identity.")
    else:
        warn("Could not locate cloud bridge auth listener block; inspect manually.")

    # setCurrentUser must not allow an arbitrary ID to replace Firebase UID.
    setter_old = """  const setCurrentUser = useCallback((action: User | ((prev: User) => User)) => {
    setCurrentUserState((prev) => {
      const nextUser = typeof action === 'function' ? action(prev) : action;
      const uid = uidRef.current || nextUser.id;
      if (uid) {
        const userRef = doc(db, 'users', uid);
        setDoc(userRef, { ...nextUser, id: uid, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
      return nextUser;
    });
  }, []);"""
    setter_new = """  const setCurrentUser = useCallback((action: User | ((prev: User) => User)) => {
    setCurrentUserState((prev) => {
      const nextUser = typeof action === 'function' ? action(prev) : action;
      const uid = firebaseUser?.uid;
      if (!uid) {
        console.warn('[CloudBridge] Ignoring currentUser mutation without Firebase authentication.');
        return prev;
      }
      if (nextUser.id && nextUser.id !== uid) {
        console.warn('[CloudBridge] Ignoring attempted identity change from Firebase UID.');
        return prev;
      }
      const safeUser = { ...nextUser, id: uid };
      updateUserProfile(safeUser).catch((err) => {
        console.error('[CloudBridge] Profile update failed:', err);
      });
      return safeUser;
    });
  }, [firebaseUser, updateUserProfile]);"""
    if setter_old in text:
        text = text.replace(setter_old, setter_new, 1)
        ok("Bound setCurrentUser to the verified Firebase UID.")
    else:
        warn("Cloud bridge setCurrentUser did not match expected code; inspect manually.")

    # Fix participant IDs while we are touching the bridge, without changing Phase 2 query behavior.
    text = text.replace(
        "const participantIds = [session.mentorName, session.learnerName].filter(Boolean);",
        "const participantIds = [session.mentorId, session.learnerId].filter(Boolean);",
    )

    if text != original:
        write(p, text)


def remove_app_user_local_persistence() -> None:
    p = ROOT / "src/App.tsx"
    text = read(p)
    if text is None:
        warn("src/App.tsx not found.")
        return
    original = text
    # Do not delete all localStorage use; bookmarks/searches/UI cache can remain.
    text = text.replace(
        "  // Sync state to localStorage\n  useEffect(() => {\n    localStorage.setItem('skillswap_user', JSON.stringify(currentUser));\n  }, [currentUser]);\n\n",
        "  // Persistent user identity is owned by Firebase Auth/Firestore.\n  // Do not store skillswap_user as an authoritative identity cache.\n\n",
    )
    if text != original:
        write(p, text)
        ok("Removed App.tsx persistence of skillswap_user as an identity cache.")
    else:
        warn("App.tsx user localStorage block not found; verify manually.")


def create_docs() -> None:
    write(ROOT / "PHASE1_AUTH_ARCHITECTURE.md", """# SkillSwap Phase 1 — Authentication Architecture

Firebase Authentication is the single source of user identity.

```text
Firebase Auth
    ↓
AuthContext
    ↓
Firebase User.uid
    ↓
Firestore users/{uid}
    ↓
Application state
```

## Rules

1. `localStorage.skillswap_user` is not an identity source.
2. The browser must not choose the UID used for authorization.
3. Protected server routes must verify the Firebase ID token.
4. The verified token UID is the caller identity.
5. Public profile data should eventually be separated from private account data.
6. Local/demo authentication must not be used in production.
7. Credits, escrow and payments remain server-authoritative and belong to later phases.

## Phase 1 completion test

- Login with Firebase.
- Refresh the page.
- Confirm the same Firebase UID/profile is restored.
- Logout and confirm `currentUser` becomes null.
- Attempt access while signed out and confirm it is denied.
- Confirm no old `skillswap_user` localStorage value can create an authenticated identity.
""")
    ok("Created PHASE1_AUTH_ARCHITECTURE.md.")


def report() -> None:
    lines = [
        "# SkillSwap Phase 0 + Phase 1 Report", "",
        f"Generated: {dt.datetime.now().isoformat(timespec='seconds')}", "",
        "## Automatic changes", "",
    ]
    lines += ["- " + x for x in CHANGES]
    lines += ["", "## Warnings / manual actions", ""]
    lines += ["- " + x for x in WARNINGS]
    lines += [
        "", "## Phase 0 checklist", "",
        "- [ ] Rotate Firebase service-account credentials if exposed.",
        "- [ ] Remove real `.env` and `serviceaccountkey.json` before sharing/deployment.",
        "- [ ] Check Git history for previously committed secrets.",
        "- [ ] Set production `CORS_ORIGIN` later in the server phase.",
        "- [ ] Confirm no demo authentication is enabled in production.",
        "", "## Phase 1 checklist", "",
        "- [ ] App identity comes from Firebase Auth/AuthContext.",
        "- [ ] `skillswap_user` is not an authoritative identity source.",
        "- [ ] Firebase UID cannot be replaced by a client-supplied ID.",
        "- [ ] AuthContext does not fall back to a fake/local user on Firebase failure.",
        "- [ ] Server token verification remains enabled.",
        "- [ ] Login/refresh/logout behavior tested manually.",
        "", "## Deliberately NOT changed", "",
        "- Firestore rules and broad collection queries (Phase 2).",
        "- Credits/escrow (Phase 4).",
        "- Payments (Phase 5).",
        "- WebRTC authorization (Phase 7).",
        "- AI/rate limiting (Phase 8).",
        "- API consolidation (Phase 3).",
    ]
    write(REPORT, "\n".join(lines) + "\n")
    print("Report:", REPORT)


def main() -> int:
    ap = argparse.ArgumentParser(description="SkillSwap Phase 0 + Phase 1 fixer")
    ap.add_argument("--dry-run", action="store_true", help="Inspect only; do not modify files")
    args = ap.parse_args()

    if not (ROOT / "package.json").exists():
        raise SystemExit("ERROR: package.json not found. Run this from the SkillSwap project root.")

    print("=" * 72)
    print("SkillSwap 5.0 — Phase 0 + Phase 1 fixer")
    print("=" * 72)
    print("Root:", ROOT)
    print("Mode:", "DRY RUN" if args.dry_run else "APPLY")
    print()

    if args.dry_run:
        scan_secrets()
        inspect_auth = read(ROOT / "src/context/AuthContext.tsx") or ""
        inspect_app = read(ROOT / "src/App.tsx") or ""
        inspect_bridge = read(ROOT / "src/hooks/useCloudStateBridge.ts") or ""
        inspect_fb = read(ROOT / "src/firebase.ts") or ""
        if "AIzaSyFakeKeyForLocalFallbackMode0000" in inspect_fb:
            warn("Known fake Firebase key is present.")
        if "Fallback local login" in inspect_auth or "demoUser" in inspect_auth:
            warn("Local/demo auth fallback is present in AuthContext.")
        if "skillswap_user" in inspect_app:
            warn("App.tsx still references skillswap_user.")
        if "loadFromOfflineCache('skillswap_user'" in inspect_bridge:
            warn("Cloud bridge still initializes identity from localStorage.")
        warn("Dry-run: no files modified.")
    else:
        backup_project()
        harden_gitignore()
        create_env_example()
        scan_secrets()
        remove_firebase_fallback()
        remove_local_auth_fallbacks()
        harden_profile_update()
        migrate_bridge_identity()
        remove_app_user_local_persistence()
        create_docs()

    report()
    print("Completed.")
    if not args.dry_run:
        print("Backup:", BACKUP)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
