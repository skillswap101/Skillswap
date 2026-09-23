# Changelog

All notable changes to the SkillSwap platform are documented in this file.

## [Unreleased]
### Added
- **Phase 1: Critical Security Remediations (`docs/CHANGELOG_SECURITY.md`)**:
  - Eliminated unearned credit generation in PayPal capture (`paypal.js`) by removing fallback bypass and strictly gating simulation behind non-production flags.
  - Resolved Broken Object-Level Authorization (BOLA/IDOR) on M-Pesa transaction polling (`mpesaPay.js`) by asserting caller ownership against pending payment records.
  - Hardened M-Pesa simulated confirmation endpoint to fail closed in production environments.
  - Purged hardcoded JWT and secret tokens from `server/supabaseClient.ts` and `src/lib/supabase.ts`.
  - Consolidated `middleware/auth.js` with the authoritative `firebaseAdmin.ts` instance, ensuring fail-closed authentication.
- **SkillSwap 5.0 Master Protocol & GitHub Agent Directives (`/docs/MASTER_AGENT_INSTRUCTIONS.md`, `/.github/copilot-instructions.md`)**: Codified the complete 52-section operational mandate, 7-phase roadmap, and continuous communication & escalation protocol.
- **Phase 0 Comprehensive Production Audit Suite**:
  - `AUDIT_REPORT.md`: Master production audit synthesizing all subsystem findings.
  - `docs/ARCHITECTURE_AUDIT.md`: Structural topology, module boundaries, data flow, and separation of concerns.
  - `docs/SECURITY_AUDIT.md`: Vulnerability analysis covering BOLA/IDOR, credentials, and authentication.
  - `docs/MOCK_DATA_AUDIT.md`: Inventory and eradication protocol for mock data, demo users, and fake records.
  - `docs/API_AUDIT.md`: Catalog of all 24 REST endpoints, auth gates, rate limiting, and missing route definitions.
  - `docs/DATABASE_AUDIT.md`: Analysis of Supabase PostgreSQL schema, missing indexes, and wildcard RLS policies.
  - `docs/PAYMENT_AUDIT.md`: Stripe, M-Pesa, PayPal, and Escrow financial integrity audit.
  - `docs/FRONTEND_AUDIT.md`: Component hierarchy, React 19 compatibility, and mobile responsiveness.
  - `docs/PRODUCTION_READINESS.md`: Production readiness assessment and environment configuration matrix.
  - `docs/REMEDIATION_PLAN.md`: Prioritized remediation roadmap spanning P0 (critical security) to P3.
- **Modern Typography & Glassmorphic Design (`index.html`, `src/index.css`)**: Integrated Google Fonts (Plus Jakarta Sans for display headings, Inter for high-density UI readability), subtle radial grid patterns, and glassmorphism panel styles.
- **Centralized Modal Architecture (`src/hooks/useModalManager.ts`)**: Built a unified modal management hook to decouple global dialog states and streamline `App.tsx` state footprint.
- **Export Codebase ZIP (`src/components/SettingsHubModal.tsx`)**: Relocated repository backup download into Settings Hub to preserve clean navigation bar ergonomics.
- **Render Production Blueprint (`render.yaml`)**: Configured automatic zero-downtime deployment pipeline for Render with health check verification (`/api/health`).

### Fixed
- **Reverse Proxy Rate Limit Validation Error (`server.ts`)**: Enabled `app.set('trust proxy', 1)` and configured `validate: { xForwardedForHeader: false }` on `express-rate-limit` instances to eliminate the `X-Forwarded-For` ValidationError behind Cloud Run, Render, and Nginx proxies.
- **Duplicate Notification Button (`src/App.tsx`, `src/components/Header.tsx`)**: Removed redundant root `<GlobalNotificationListener />` so only a single unified notification bell appears in the header.
- **Header Layout Overflow & Post Skill Visibility (`src/components/Header.tsx`)**: Resolved horizontal overflow pushing the "Post Skill" button off-screen by optimizing button density and making Post Skill an unclipped, high-priority CTA.
- **Autonomous AI Directives (`AGENTS.md`)**: Expanded agent capabilities to include vulnerability auditing, PR code reviews, self-healing, and Render deployment protocols.
- **Enhanced AI CI Reviewer (`scripts/ai-code-reviewer.js`)**: Upgraded automated code auditor with secret scanning, Render compatibility checks, and security audit rules.
- **Automated Health Check Route**: Added `/api/health` endpoint on Express server reporting server uptime and health state.

### Security & Hardening
- Secret pattern scanning in CI before PR merge.
- Strict CORS validation permitting `.onrender.com`, Google Cloud Run, and configured domains.
