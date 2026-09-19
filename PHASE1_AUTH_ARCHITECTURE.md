# SkillSwap Phase 1 — Authentication Architecture

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
