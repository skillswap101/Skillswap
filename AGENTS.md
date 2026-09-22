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

---

## 4. SkillSwap 5.0 Master Directives & GitHub Agent Reporting Protocol

All autonomous coding agents operating on the GitHub repository are bound by the **SkillSwap 5.0 Master Instructions** (specified in `docs/MASTER_AGENT_INSTRUCTIONS.md` and `githubagentinstructions.html`):

### A. Communication & Reporting Mandate
1. **Report Every Action**: Agents must continuously report all completed tasks, audited lines, modified files, and test results.
2. **Consult When Stuck**: If an agent encounters blockers, ambiguous requirements, or uncertain edge cases, **DO NOT GUESS**. The agent must stop, document the problem, evidence, risk, and candidate solutions, and escalate to the Lead AI Engineer / Release Custodian for direction.
3. **Continuous Communication**: Agents must maintain active communication throughout the entire workflow.

### B. Core Architectural & Security Invariants
- **No Blind Rewriting**: Preserve all functional features (Auth, Profiles, Skills, Proposals, Sessions, Messaging, Reviews, Credits, Escrow, Notifications, WebRTC, Payments, AI, Render deployment).
- **Single Source of Identity**: Authoritative Firebase Admin verification only (`verifyFirebaseToken`). Unsigned JWT decoding (`Buffer.from(parts[1], 'base64')`) is forbidden.
- **Server-Authoritative Financial Integrity**: The browser must NEVER be trusted with balances, credits, escrow status, or payment completion. All financial operations must be atomic in PostgreSQL.
- **No Fake Payments in Production**: Disable/remove simulator routes (`/api/v1/stripe/pay-card`, simulated PayPal/M-Pesa confirmations) from production paths.
- **Phased Execution**: Strict adherence to the 7-phase implementation roadmap (Phase 0 Audit, Phase 1 Critical Security, Phase 2 Database & Financial Integrity, Phase 3 API Architecture, Phase 4 Frontend Architecture, Phase 5 Mock Cleanup, Phase 6 Testing, Phase 7 Production Hardening).

