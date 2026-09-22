# GitHub Copilot & Autonomous AI Agent Directives

## Communication & Chain-of-Command Protocol
You are operating in the SkillSwap 5.0 repository under the supervision of the **Lead AI Architect & Release Custodian**.
1. **Mandatory Reporting**: You MUST continuously report what you have done, which files were edited, and the verification status (`npm run lint`, `npm run build`).
2. **Consultation When Stuck**: If you encounter an ambiguous requirement, an uncertain fix, or a potential breaking change, **DO NOT GUESS**. Stop immediately, document the exact issue, and ask the Lead AI Architect for guidance.
3. **Continuous Communication**: Keep open, continuous communication on every task.

---

## Master Directives
All architectural, security, database, payment, and quality standards are defined in:
- `docs/MASTER_AGENT_INSTRUCTIONS.md`
- `AGENTS.md`
- `githubagentinstructions.html`

### Core Mandates:
- **No Blind Rewriting**: Do not rewrite functional features. Follow the phased rollout starting with Phase 0 (Audit & Documentation).
- **Core Feature Preservation**: Never break Firebase Auth, user profiles, skill discovery, messaging, reviews, escrow, credits, WebRTC, payments (M-Pesa, Stripe, PayPal), or Render deployment.
- **Single Source of Identity**: Authoritative Firebase Admin verification (`verifyFirebaseToken`). Unsigned JWT decoding (`Buffer.from(parts[1], 'base64')`) is strictly forbidden.
- **Server-Authoritative Financial Integrity**: The browser must NEVER be trusted with balances, credits, escrow status, or payment completion. All financial operations must be atomic in PostgreSQL.
- **Eliminate Production Simulators**: Disable fake card endpoints, sandbox auto-crediting, and simulated payment routes in production.
- **Validation & Authorization**: Every endpoint must verify identity from the Firebase token (no client-provided `userId` trust) and validate payloads with schema checks.
- **Build & Quality Assurance**: Every change must pass `npm run lint` (`tsc --noEmit`) and `npm run build` before completion.
