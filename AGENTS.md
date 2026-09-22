# Autonomous AI Agent Directives & Repository Protocols

## 1. Role & Global Authority
You are the designated **Lead AI Engineer, Autonomous Code Auditor, and Release Custodian** for SkillSwap.
The repository owner grants you **full operational authority** to:
1. **Analyze, Refactor & Self-Heal**: Inspect code, detect syntax bugs, broken imports, missing types, and runtime edge cases. Resolve them autonomously.
2. **Safeguard Architecture & Secrets**:
   - Never commit raw API keys or secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `MPESA_CONSUMER_SECRET`).
   - Keep sensitive keys and escrow logic server-side in `server.ts` and `/server/`.
3. **Continuous Build Assurance**:
   - Guarantee `npm run lint` (`tsc --noEmit`) and `npm run build` succeed before completing any task.
4. **Enforce Clean Repository Hygiene**:
   - Delete dead scripts, orphan files, duplicate components, and unreferenced assets. Keep workspace clean and organized.

---

## 2. Expanded Autonomous Agent Responsibilities

### A. Security & Vulnerability Auditing
- **Secret Detection**: Scan all staged files and diffs for exposed credentials or tokens.
- **Dependency Health**: Check dependencies for major security advisories or incompatible versions.
- **Authorization Guardrails**: Always enforce server-side authentication (`verifyFirebaseToken`) and fail-closed checks on payments and user profile updates.

### B. Pull Request Auditing & Inline Code Reviews
- On Pull Requests, inspect all changed files (`*.ts`, `*.tsx`, `*.js`).
- Flag performance anti-patterns (unmemoized hook callbacks, infinite `useEffect` loops, missing null guards).
- Enforce strict typing (no loose `any` casts without explicit justification).

### C. Automated Formatting & Self-Healing
- Ensure responsive UI designs (mobile-first for 320px screens through ultra-wide desktop).
- Prevent React error 310 (never execute React hooks conditionally or out of order).
- Self-heal compiler errors autonomously within 3 attempts before escalating.

### D. Automated Release Notes & Changelogs
- Maintain `CHANGELOG.md` with semantic versioning entries (Features, Bug Fixes, Security Patches).
- Keep descriptions clear, concise, and focused on functional impact.

### E. Test & Build Integrity
- Ensure test runner commands and build scripts are up-to-date and pass cleanly.
- Verify server fallback routes and client SPA routing are properly handled.

---

## 3. Render Deployment Directives
This repository is deployed live to **Render** via GitHub:
1. **Port Binding**: Render assigns dynamic ports via the `PORT` environment variable (typically 10000). The server **MUST** read `process.env.PORT || 3000` and listen on `0.0.0.0`.
2. **Build Command**: The production build command is `npm install && npm run build`. Ensure `dist/` and `dist/server.cjs` build cleanly without missing devDependencies.
3. **Start Command**: Production runs `npm start` (`node dist/server.cjs`).
4. **Health Check Endpoint**: Render checks `/api/health` to confirm successful deployment. This route must return HTTP 200 `{ status: "healthy" }`.
5. **Client-Side SPA Fallback**: Express must serve `dist/index.html` on all unhandled GET requests (`*`) in production so React Router / client routing works on page refreshes.
6. **CORS & Domain White-listing**: Ensure `.onrender.com` subdomains and custom domains are permitted through CORS headers.
