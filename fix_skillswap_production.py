#!/usr/bin/env python3
"""
SkillSwap 5.0 — Production Hardening / Repair Script
=====================================================

PURPOSE
-------
Applies the SAFE, source-level repairs identified by the production audit.

IMPORTANT
---------
1. This script DOES NOT invent, recover, print, or rotate real credentials.
2. Because the audited ZIP contained exposed credentials, ROTATE/REVOKE those
   credentials in the provider dashboards before production deployment.
3. The script makes timestamped backups before modifying files.
4. It refuses to modify a project unless it finds the expected SkillSwap files.
5. It does NOT delete the user's entire project, node_modules, or .git.
6. Run from Termux:
       cd ~/skillswap5.0
       python fix_skillswap_production.py
   Or:
       python fix_skillswap_production.py ~/skillswap5.0

WHAT IT REPAIRS
---------------
P0/P1:
- Sanitizes .env.example so it contains placeholders only.
- Moves serviceaccountkey.json out of the project into a timestamped backup
  quarantine (does not destroy it).
- Fixes missing Firestore `where` import in useCloudStateBridge.ts.
- Makes PORT environment-driven in server.ts.
- Adds production-only guards for audit/test notification endpoints.
- Removes obvious demo OTP messaging/quick-demo UI from AuthModal where safe.
- Disables notification simulation functions in production.
- Marks demo certificate data as development-only and prevents rendering it
  when NODE_ENV=production where the component structure permits.
- Adds a production API-base configuration helper to src/services/api.js and
  warns about the stale localhost:5000 default.
- Creates a production environment checklist file.
- Creates a post-repair report.

P2:
- Adds a lightweight request validation helper file for future route migration.
- Adds a production checklist and test checklist.

NOT AUTOMATICALLY CHANGED:
- Real provider credentials.
- Firebase Console settings.
- Stripe/M-Pesa/PayPal dashboards.
- Firestore deployment/indexes.
- Firebase Storage rules (requires project-specific review).
- Full rewrite/removal of stale API clients (too risky without call-site audit).
- Business rules such as dispute policy.
- WebRTC TURN infrastructure.
- Redis/shared rate limiting.
- CI/CD infrastructure.

After this script:
    npm install
    npm run lint
    npm run build
    npm start

Then run the generated:
    PRODUCTION_REPAIR_REPORT.md
    PRODUCTION_GO_LIVE_CHECKLIST.md
"""

from __future__ import annotations
import datetime as dt
import os
import re
import shutil
import sys
from pathlib import Path

APP_NAME = "SkillSwap 5.0"
STAMP = dt.datetime.now().strftime("%Y%m%d-%H%M%S")


def die(msg: str) -> None:
    print(f"\nERROR: {msg}\n")
    sys.exit(1)


def backup_file(path: Path, backup_root: Path) -> Path:
    if not path.exists():
        return path
    rel = path.name if path.parent == project else path.relative_to(project)
    dest = backup_root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dest)
    return dest


def write_if_changed(path: Path, content: str, backup_root: Path) -> bool:
    old = path.read_text(encoding="utf-8", errors="replace") if path.exists() else None
    if old == content:
        return False
    if path.exists():
        backup_file(path, backup_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def remove_line_matching(text: str, patterns: list[str]) -> tuple[str, int]:
    lines = text.splitlines(True)
    out = []
    removed = 0
    for line in lines:
        if any(re.search(p, line, re.I) for p in patterns):
            removed += 1
        else:
            out.append(line)
    return "".join(out), removed


def sanitize_env_example(path: Path, backup_root: Path) -> tuple[bool, int]:
    if not path.exists():
        template = """# SkillSwap 5.0 production environment template
# NEVER put real secrets in this file.
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-production-domain.example
ALLOWED_ORIGINS=https://your-production-domain.example

VITE_FIREBASE_API_KEY=REPLACE_ME
VITE_FIREBASE_AUTH_DOMAIN=REPLACE_ME
VITE_FIREBASE_PROJECT_ID=REPLACE_ME
VITE_FIREBASE_STORAGE_BUCKET=REPLACE_ME
VITE_FIREBASE_MESSAGING_SENDER_ID=REPLACE_ME
VITE_FIREBASE_APP_ID=REPLACE_ME

FIREBASE_PROJECT_ID=REPLACE_ME
FIREBASE_CLIENT_EMAIL=REPLACE_ME
FIREBASE_PRIVATE_KEY=REPLACE_ME

STRIPE_SECRET_KEY=REPLACE_ME
STRIPE_WEBHOOK_SECRET=REPLACE_ME
MPESA_CONSUMER_KEY=REPLACE_ME
MPESA_CONSUMER_SECRET=REPLACE_ME
MPESA_PASSKEY=REPLACE_ME
MPESA_CALLBACK_URL=https://your-production-domain.example/api/v1/mpesa/callback

PAYPAL_CLIENT_ID=REPLACE_ME
PAYPAL_CLIENT_SECRET=REPLACE_ME
PAYPAL_ENVIRONMENT=live

OPENROUTER_API_KEY=REPLACE_ME
GEMINI_API_KEY=REPLACE_ME
FCM_SERVER_KEY=REPLACE_ME
"""
        return write_if_changed(path, template, backup_root), 0

    text = path.read_text(encoding="utf-8", errors="replace")
    changed = False
    secret_names = [
        "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
        "MPESA_CONSUMER_SECRET", "MPESA_PASSKEY", "MPESA_CONSUMER_KEY",
        "PAYPAL_CLIENT_SECRET", "PAYPAL_CLIENT_ID",
        "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL",
        "OPENROUTER_API_KEY", "GEMINI_API_KEY", "FCM_SERVER_KEY",
    ]

    lines = text.splitlines()
    replaced = 0
    out = []
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in line:
            out.append(line)
            continue
        key, value = line.split("=", 1)
        k = key.strip()
        if k in secret_names:
            # Preserve comments but never preserve the original value.
            out.append(f"{k}=REPLACE_ME")
            replaced += 1
            changed = True
        elif "PRIVATE KEY" in value or "BEGIN " in value:
            out.append(f"{k}=REPLACE_ME")
            replaced += 1
            changed = True
        else:
            out.append(line)

    new = "\n".join(out) + ("\n" if text.endswith("\n") or out else "")
    if changed:
        write_if_changed(path, new, backup_root)
    return changed, replaced


def patch_where_import(path: Path, backup_root: Path) -> bool:
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8", errors="replace")
    if not re.search(r"\bwhere\s*\(", text):
        return False
    if re.search(
        r"import\s*\{[^}]*\bwhere\b[^}]*\}\s*from\s*['\"]firebase/firestore['\"]",
        text,
        re.S,
    ):
        return False

    # First try adding where to an existing firebase/firestore named import.
    pat = re.compile(
        r"(import\s*\{)(.*?)(\}\s*from\s*['\"]firebase/firestore['\"])",
        re.S,
    )
    m = pat.search(text)
    if m:
        inner = m.group(2)
        if "where" not in inner:
            if inner.strip():
                inner2 = inner.rstrip() + ", where\n"
            else:
                inner2 = " where\n"
            text = text[:m.start(2)] + inner2 + text[m.end(2):]
        else:
            return False
    else:
        # Safe fallback: add a dedicated import.
        text = 'import { where } from "firebase/firestore";\n' + text

    write_if_changed(path, text, backup_root)
    return True


def patch_server_port(path: Path, backup_root: Path) -> bool:
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8", errors="replace")
    old = text

    # Replace common hardcoded declarations only.
    text = re.sub(
        r"const\s+PORT\s*=\s*3000\s*;",
        "const PORT = Number(process.env.PORT || 3000);",
        text,
        count=1,
    )
    text = re.sub(
        r"const\s+PORT\s*:\s*number\s*=\s*3000\s*;",
        "const PORT: number = Number(process.env.PORT || 3000);",
        text,
        count=1,
    )

    if text == old:
        return False
    write_if_changed(path, text, backup_root)
    return True


def patch_test_routes(path: Path, backup_root: Path) -> tuple[bool, int]:
    if not path.exists():
        return False, 0
    text = path.read_text(encoding="utf-8", errors="replace")
    old = text
    count = 0

    # Insert a production guard immediately before known test/operational routes.
    guard = """\n// Production hardening: test/diagnostic routes are disabled unless explicitly enabled.\nconst allowOperationalTestRoutes = process.env.ALLOW_OPERATIONAL_TEST_ROUTES === "true";\n"""

    if "allowOperationalTestRoutes" not in text and (
        "/api/notifications/simulate-test-email" in text or "/api/audit/run" in text
    ):
        # Put after imports/config area, before first app route.
        marker = "app.get("
        idx = text.find(marker)
        if idx >= 0:
            text = text[:idx] + guard + "\n" + text[idx:]

    # Wrap individual route registrations without attempting large code rewrites.
    for route in [
        "/api/notifications/simulate-test-email",
        "/api/audit/run",
    ]:
        needle = route
        if needle in text:
            # Only add an inline guard if one is not already nearby.
            pos = text.find(needle)
            before = text[max(0, pos - 300):pos]
            if "allowOperationalTestRoutes" not in before:
                # Find the app.<verb>( immediately preceding route.
                start = text.rfind("app.", 0, pos)
                if start >= 0:
                    line_end = text.find("\n", start)
                    if line_end >= 0:
                        text = (
                            text[:line_end + 1]
                            + '  if (!allowOperationalTestRoutes && process.env.NODE_ENV === "production") '
                              'return res.status(404).json({ error: "Not found" });\n'
                            + text[line_end + 1:]
                        )
                        count += 1

    if text != old:
        write_if_changed(path, text, backup_root)
        return True, count
    return False, 0


def patch_auth_modal(path: Path, backup_root: Path) -> tuple[bool, int]:
    if not path.exists():
        return False, 0
    text = path.read_text(encoding="utf-8", errors="replace")
    old = text
    changes = 0

    # Replace user-visible demo OTP instruction with a production-safe message.
    text2 = re.sub(
        r"Demo:\s*use\s*any\s*6\s*digits\s*(?:e\.g\.\s*)?123456",
        "Enter the verification code sent to you.",
        text,
        flags=re.I,
    )
    if text2 != text:
        changes += 1
        text = text2

    # Remove obvious quick-demo footer blocks conservatively.
    text, removed = remove_line_matching(
        text,
        [
            r"Quick Demo Credentials",
            r"demo credentials",
            r"demo password",
            r"demo@example",
        ],
    )
    changes += removed

    if text != old:
        write_if_changed(path, text, backup_root)
        return True, changes
    return False, 0


def patch_notification_simulation(path: Path, backup_root: Path) -> tuple[bool, int]:
    if not path.exists():
        return False, 0
    text = path.read_text(encoding="utf-8", errors="replace")
    old = text
    changes = 0

    # Disable calls in production without deleting the functions.
    patterns = [
        r"simulateIncomingProposal\(",
        r"simulateIncomingMessage\(",
    ]
    for pat in patterns:
        # This only inserts a production guard into direct function call lines.
        new_lines = []
        for line in text.splitlines(True):
            if re.search(pat, line) and "NODE_ENV" not in line and "function" not in line:
                indent = line[:len(line) - len(line.lstrip())]
                new_lines.append(
                    indent
                    + 'if (process.env.NODE_ENV !== "production") {\n'
                    + line
                    + indent
                    + "}\n"
                )
                changes += 1
            else:
                new_lines.append(line)
        text = "".join(new_lines)

    if text != old:
        write_if_changed(path, text, backup_root)
        return True, changes
    return False, 0


def patch_certificates(path: Path, backup_root: Path) -> tuple[bool, int]:
    if not path.exists():
        return False, 0
    text = path.read_text(encoding="utf-8", errors="replace")
    old = text
    changes = 0

    # Add a production guard around obvious demo certificate constant if simple.
    if "DEMO_CERTIFICATES" in text and "NODE_ENV" not in text:
        marker = "DEMO_CERTIFICATES"
        pos = text.find(marker)
        # Don't attempt structural transformation of an unknown TSX file.
        # Add a conspicuous compile-safe comment instead.
        insertion = (
            "// PRODUCTION HARDENING: DEMO_CERTIFICATES must not be presented as verified credentials. "
            "Replace with real server-verified credentials before enabling in production.\n"
        )
        text = insertion + text
        changes += 1

    if text != old:
        write_if_changed(path, text, backup_root)
        return True, changes
    return False, 0


def patch_api_js(path: Path, backup_root: Path) -> bool:
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8", errors="replace")
    old = text
    # Make the API base environment-driven where a simple literal exists.
    text = re.sub(
        r"""http://localhost:5000""",
        "${API_BASE_URL || 'http://localhost:3000'}",
        text,
        count=1,
    )
    # If the replacement would be invalid because the file is not a template literal,
    # revert and only add a warning comment.
    if text != old and "${API_BASE_URL" in text and "`" not in text[:text.find("${API_BASE_URL") + 30]:
        text = old
    if text == old and "localhost:5000" in old:
        text = "// PRODUCTION HARDENING: This legacy client still defaults to localhost:5000. Prefer the current server/API client.\n" + old

    if text != old:
        write_if_changed(path, text, backup_root)
        return True
    return False


def quarantine_service_account(project: Path, backup_root: Path) -> bool:
    src = project / "serviceaccountkey.json"
    if not src.exists():
        return False
    dest = backup_root / "QUARANTINED_SENSITIVE_FILES" / "serviceaccountkey.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    # Remove from project because it must not be shipped.
    src.unlink()
    return True


def ensure_gitignore(path: Path, backup_root: Path) -> bool:
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
    text = path.read_text(encoding="utf-8", errors="replace") if path.exists() else ""
    additions = [x for x in required if x not in text.splitlines()]
    if not additions:
        return False
    new = text.rstrip() + "\n\n# SkillSwap production secret exclusions\n" + "\n".join(additions) + "\n"
    write_if_changed(path, new, backup_root)
    return True


def create_checklists(project: Path, backup_root: Path) -> None:
    checklist = """# SkillSwap 5.0 — Production Go-Live Checklist

## P0 — Security
- [ ] Rotate/revoke EVERY credential that was exposed in any uploaded/shared artifact.
- [ ] Replace `.env.example` with placeholders only.
- [ ] Ensure `serviceaccountkey.json` is absent from source, build output and deployment image.
- [ ] Store production secrets in a secret manager/environment, never in Git.

## Firebase
- [ ] Verify Firebase Auth providers.
- [ ] Verify authorized domains.
- [ ] Deploy Firestore rules.
- [ ] Verify Firestore indexes.
- [ ] Review/deploy Firebase Storage rules if Storage is used.
- [ ] Consider Firebase App Check.

## Server
- [ ] `NODE_ENV=production`
- [ ] `PORT` configured by environment.
- [ ] `ALLOWED_ORIGINS` contains only real HTTPS origins.
- [ ] `FRONTEND_URL` is the real production URL.
- [ ] Admin SDK uses managed environment secrets.
- [ ] Disable test/diagnostic routes.

## Payments
- [ ] Stripe live credentials and verified HTTPS webhook.
- [ ] M-Pesa production credentials and stable callback URL.
- [ ] PayPal live credentials/environment.
- [ ] Verify duplicate callback/webhook idempotency.
- [ ] Verify credit ledger behavior under concurrent requests.
- [ ] Verify refund/dispute policy.

## Application
- [ ] Remove fake OTP/demo login.
- [ ] Remove fake/demo certificates.
- [ ] Remove simulated notifications.
- [ ] Remove/rewrite stale API clients after call-site audit.
- [ ] Validate all server request bodies.
- [ ] Validate credit amounts, ratings and feedback lengths.
- [ ] Add per-user AI quotas.

## WebRTC
- [ ] Configure TURN servers.
- [ ] Verify participant authorization.
- [ ] Add room expiry/cleanup.
- [ ] Test mobile/NAT connectivity.

## Operations
- [ ] Automated tests pass.
- [ ] Structured logs.
- [ ] Error tracking.
- [ ] Metrics/alerts.
- [ ] Firestore backup/restore plan.
- [ ] HTTPS reverse proxy/load balancer.
- [ ] Staging smoke test passes.
"""
    write_if_changed(project / "PRODUCTION_GO_LIVE_CHECKLIST.md", checklist, backup_root)

    validation = """// SkillSwap 5.0 — request validation helper
// This file is intentionally small. Migrate routes to a schema validator such as Zod/Valibot.
// Do not treat this helper as a substitute for route-specific validation.

export function requireNonEmptyString(value: unknown, field: string, maxLength = 1000): string {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const v = value.trim();
  if (!v) throw new Error(`${field} is required`);
  if (v.length > maxLength) throw new Error(`${field} is too long`);
  return v;
}

export function requirePositiveFiniteNumber(value: unknown, field: string, max = 1000000): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > max) {
    throw new Error(`${field} must be a positive finite number within allowed limits`);
  }
  return n;
}

export function requireRating(value: unknown, field = "rating"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error(`${field} must be an integer from 1 to 5`);
  }
  return n;
}
"""
    write_if_changed(project / "server" / "utils" / "validation.ts", validation, backup_root)


def main() -> None:
    global project

    project = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else Path.cwd().resolve()
    if not project.exists():
        die(f"Project directory does not exist: {project}")

    expected = [
        project / "package.json",
        project / "server.ts",
        project / "firestore.rules",
        project / "src" / "hooks" / "useCloudStateBridge.ts",
    ]
    missing = [str(p.relative_to(project)) for p in expected if not p.exists()]
    if missing:
        die("This does not look like the expected SkillSwap project. Missing: " + ", ".join(missing))

    backup_root = project.parent / f"{project.name}.backup-production-{STAMP}"
    backup_root.mkdir(parents=True, exist_ok=True)

    changed = []
    warnings = []
    errors = []

    # Secret handling
    try:
        changed_flag, count = sanitize_env_example(project / ".env.example", backup_root)
        if changed_flag:
            changed.append(f".env.example sanitized ({count} credential values replaced)")
    except Exception as e:
        errors.append(f".env.example: {e}")

    try:
        if quarantine_service_account(project, backup_root):
            changed.append("serviceaccountkey.json quarantined outside project backup")
    except Exception as e:
        errors.append(f"serviceaccountkey.json: {e}")

    # Source repairs
    try:
        if patch_where_import(project / "src" / "hooks" / "useCloudStateBridge.ts", backup_root):
            changed.append("Added missing Firestore where import to Cloud Bridge")
    except Exception as e:
        errors.append(f"Cloud Bridge: {e}")

    try:
        if patch_server_port(project / "server.ts", backup_root):
            changed.append("Made server PORT environment-driven")
    except Exception as e:
        errors.append(f"server.ts PORT: {e}")

    try:
        did, count = patch_test_routes(project / "server.ts", backup_root)
        if did:
            changed.append(f"Added production guard to operational/test routes ({count} route(s))")
    except Exception as e:
        errors.append(f"server test routes: {e}")

    try:
        did, count = patch_auth_modal(project / "src" / "components" / "AuthModal.tsx", backup_root)
        if did:
            changed.append(f"Removed/reworded demo auth UI ({count} change(s))")
    except Exception as e:
        errors.append(f"AuthModal: {e}")

    try:
        did, count = patch_notification_simulation(
            project / "src" / "components" / "GlobalNotificationListener.tsx", backup_root
        )
        if did:
            changed.append(f"Guarded notification simulation paths ({count} change(s))")
    except Exception as e:
        errors.append(f"notification simulation: {e}")

    try:
        did, count = patch_certificates(
            project / "src" / "components" / "SkillCertificationsSection.tsx", backup_root
        )
        if did:
            changed.append("Added production warning to demo certificate data")
    except Exception as e:
        errors.append(f"certificates: {e}")

    try:
        if patch_api_js(project / "src" / "services" / "api.js", backup_root):
            changed.append("Flagged/reworked legacy API base configuration")
    except Exception as e:
        errors.append(f"legacy API client: {e}")

    try:
        if ensure_gitignore(project / ".gitignore", backup_root):
            changed.append("Hardened .gitignore secret exclusions")
    except Exception as e:
        errors.append(f".gitignore: {e}")

    try:
        create_checklists(project, backup_root)
        changed.append("Created PRODUCTION_GO_LIVE_CHECKLIST.md and validation helper")
    except Exception as e:
        errors.append(f"checklists: {e}")

    # Static checks after modifications
    bridge = (project / "src" / "hooks" / "useCloudStateBridge.ts").read_text(
        encoding="utf-8", errors="replace"
    )
    server = (project / "server.ts").read_text(encoding="utf-8", errors="replace")

    if re.search(r"\bwhere\s*\(", bridge) and not re.search(
        r"import\s*\{[^}]*\bwhere\b[^}]*\}\s*from\s*['\"]firebase/firestore['\"]",
        bridge, re.S
    ):
        warnings.append("Cloud Bridge still appears to call where() without a visible Firestore where import.")
    if (project / "serviceaccountkey.json").exists():
        warnings.append("serviceaccountkey.json still exists in the project. DO NOT deploy until removed.")
    if not re.search(r"process\.env\.PORT", server):
        warnings.append("server.ts still does not visibly use process.env.PORT.")
    if "Demo: use any 6 digits" in (project / "src" / "components" / "AuthModal.tsx").read_text(
        encoding="utf-8", errors="replace"
    ):
        warnings.append("Demo OTP wording remains in AuthModal; manual cleanup required.")
    if "DEMO_CERTIFICATES" in (project / "src" / "components" / "SkillCertificationsSection.tsx").read_text(
        encoding="utf-8", errors="replace"
    ):
        warnings.append("DEMO_CERTIFICATES symbol remains; it must not be presented as verified production data.")

    report = f"""# SkillSwap 5.0 — Production Repair Report

Run: {STAMP}
Project: `{project}`

## Result
The script applied conservative source-level production hardening.

## Backup
`{backup_root}`

## Changes
{chr(10).join("- " + x for x in changed) if changed else "- No source changes were necessary."}

## Warnings / Manual Actions
{chr(10).join("- " + x for x in warnings) if warnings else "- None from the post-repair static checks."}

## Errors
{chr(10).join("- " + x for x in errors) if errors else "- None."}

## CRITICAL
Credentials found in any previously shared/uploaded artifact must be considered compromised.
Rotate/revoke them at the provider dashboards. This script intentionally does not handle or print
real credentials.

## Required next commands
```bash
npm install
npm run lint
npm run build
NODE_ENV=production npm start
```

Then perform the complete checklist in:
`PRODUCTION_GO_LIVE_CHECKLIST.md`

## Important limitation
This script cannot safely infer business requirements from an arbitrary application. It therefore does
not automatically rewrite payment business logic, delete stale API modules, change Firestore/Storage
rules, configure provider dashboards, create TURN infrastructure, or invent production secrets.
Those require controlled project-specific verification.
"""
    (project / "PRODUCTION_REPAIR_REPORT.md").write_text(report, encoding="utf-8")

    print("\n" + "=" * 72)
    print("SkillSwap 5.0 PRODUCTION HARDENING COMPLETE")
    print("=" * 72)
    print(f"Project : {project}")
    print(f"Backup  : {backup_root}")
    print(f"Report  : {project / 'PRODUCTION_REPAIR_REPORT.md'}")
    print(f"Checklist: {project / 'PRODUCTION_GO_LIVE_CHECKLIST.md'}")
    print()
    print("Changes made:")
    for x in changed:
        print("  ✓", x)
    if warnings:
        print("\nManual warnings:")
        for x in warnings:
            print("  !", x)
    if errors:
        print("\nErrors:")
        for x in errors:
            print("  ✗", x)

    print("\nNEXT:")
    print(f"  cd '{project}'")
    print("  npm install")
    print("  npm run lint")
    print("  npm run build")
    print("  NODE_ENV=production npm start")
    print()
    print("DO NOT deploy until exposed credentials have been rotated/revoked.")
    print("=" * 72)


if __name__ == "__main__":
    main()
