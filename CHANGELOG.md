# Changelog

All notable changes to the SkillSwap platform are documented in this file.

## [Unreleased]
### Security & Architectural Hardening (Audit Implementations)
- **Schema Normalization & Bidirectional Field Sync (`database/migrations/004_...`, `useCloudStateBridge.ts`)**:
  - Added PostgreSQL migration `004` providing bidirectional synchronization triggers between legacy snake_case (`sender_id`, `receiver_id`, `host_id`, `attendee_id`) and camelCase (`senderId`, `recipientId`, `mentorId`, `learnerId`).
  - Updated client data bridge (`cleanRow` & mutation payloads) to transparently support both column conventions, eliminating column mismatch errors.
- **Atomic Financial Escrow Stored Procedures (`creditsService.ts`)**:
  - Implemented PostgreSQL stored procedures with row-level locks (`SELECT ... FOR UPDATE`):
    - `lock_escrow_credits(p_proposal_id, p_learner_id, p_mentor_id, p_amount)`
    - `release_escrow_credits(p_session_id, p_escrow_id)`
    - `refund_escrow_credits(p_escrow_id, p_reason)`
  - Replaced non-atomic in-memory math in `creditsService.ts` with server-authoritative RPCs, preventing race conditions and double-spending.
- **Authoritative Database Payment Persistence (`paymentsService.ts`)**:
  - Completely removed the in-memory `Map` fallback (`inMemoryPending`), ensuring all pending payments are authoritatively stored in PostgreSQL before proceeding.
- **Official Supabase Client `accessToken` Integration (`src/lib/supabase.ts`)**:
  - Migrated `createClient` to use Supabase's official `accessToken` async callback with Firebase Auth, automatically handling 1-hour token rotation and eliminating manual header mutations.
- **Unified Authentication Middleware (`middleware/auth.js` & `server.ts`)**:
  - Consolidated authentication middleware across Express payment routes and core API endpoints to uniform Firebase Admin verification.
- **Repository Hygiene & Render Alignment**:
  - Removed dead unreferenced `src/data/mockData.ts`.
  - Updated `render.yaml` to declare all production environment variables.

### Bug Fixes & Cloud State Resilience
- **Offline & Unconfigured Cloud State Bridge (`useCloudStateBridge.ts` & `storageService.ts`)**:
  - Resolved `TypeError: Failed to fetch` during message sending (`addMessageToCloud`) and avatar uploads by checking `isSupabaseConfigured()`.
  - Added optimistic message updating in local state and offline cache (`localStorage`) before performing network sync.
  - Guarded initial queries and real-time channel subscriptions against unconfigured Supabase endpoints, preventing DNS lookup failures (`placeholder.supabase.co`).
  - Added graceful data URL fallback in `uploadAvatar` for unconfigured environments.

### Operations & Render Keep-Awake Cron
- **Render Uptime Automation (`database/migrations/003_render_keep_awake_cron.sql`)**:
  - Integrated Supabase `pg_cron` and `pg_net` scheduled task to ping `https://skillswap-0919.onrender.com/api/health` every 12 minutes (`*/12 * * * *`).
  - Added safe idempotent unschedule guards (`if exists ... perform cron.unschedule`) to prevent duplicate job naming collisions.
  - Exempted `/api/health` from rate-limiting in `server.ts` and removed duplicate health route definition to guarantee uninterrupted HTTP 200 uptime responses.
  - Documented verification queries for `cron.job`, `cron.job_run_details`, and `net._http_response`.

### Security & Financial Hardening
- **Payment Fulfillment Architecture Hardening (`paymentsService.ts`)**:
  - Removed dangerous non-atomic fallback that read balance and performed uncoordinated balance increments outside transactions.
  - Eliminated premature mutation of in-memory payment status before database RPC commitment.
  - Aligned PostgreSQL RPC parameter signature to `{ p_payment_id, p_gateway_receipt }` and enforced fail-closed response handling.
  - Guaranteed idempotency by tying ledger entries directly to `payment_row.id` with `ON CONFLICT (id) DO NOTHING`.
  - Added uniqueness indexes on `transactions(id)`, `transactions(gateway, "gatewayRef")`, and `pendingPayments(gateway, "gatewayRef")`.
  - Hardened Stripe, M-Pesa, and PayPal webhook/capture fulfillment to reject fake credits, retry failed webhooks, and safely acknowledge duplicate submissions.
  - Added automated test suite `scripts/test-payments-atomic.ts` covering RPC parameter alignment, duplicate/repeated call idempotency, and concurrent race-condition prevention.

### Added
- **Phase 2: Database & Financial Integrity**:
  - Implemented atomic `fulfill_pending_payment` RPC in PostgreSQL to guarantee idempotency and ACID credit assignment.
  - Added indexes on `proposals(senderId, recipientId)`, `sessions(mentorId, learnerId)`, and `messages(swapProposalId)`.
  - Upgraded `paymentsService.ts` to enforce server-side atomic fulfillment.
- **Phase 3: API Architecture & Modular Route Extraction**:
  - Added RESTful endpoints in `server.ts` for `/api/users`, `/api/users/:id`, and `/api/users/:id` (PATCH with strict ownership check).
  - Added `/api/listings` (GET query with filters and POST with authenticated creator assignment).
  - Added `/api/escrow/release`, `/api/escrow/refund`, and `/api/escrow/dispute` routes.
  - Added `/api/transactions` authenticated ledger query.
- **Phase 4: Frontend Architecture & Escrow Sync**:
  - Eliminated client-side over-fetching in `useCloudStateBridge.ts` by scoping queries to authenticated user only.
  - Migrated `ChatPortal.tsx` and `CallActionModal.tsx` from local storage escrow mocks to server-authoritative API calls.
  - Replaced fake hardcoded transaction data in `TimeCreditsView.tsx` with authentic transaction ledger records.
- **Phase 5: Mock Data & Orphan Code Cleanup**:
  - Deleted 9 orphaned / duplicate files: `src/utils/escrowManager.ts`, `src/utils/firebaseEscrow.ts`, `src/components/CreateListingModal.tsx`, `src/components/LiveSessionRoom.tsx`, `src/components/Navbar.tsx`, `src/components/ProposeSwapModal.tsx`, `src/components/SkillMarketplace.tsx`, `src/services/api.js`, `src/utils/firestoreRepository.ts`.
  - Removed `FALLBACK_COMMUNITY_MEMBERS` mock data from `UserDirectoryModal.tsx`, providing authentic marketplace user derivation and clean empty states.
- **Phase 6: Testing & Automated Validation**:
  - Implemented `scripts/test-integrity.cjs` covering health checks, fail-closed auth guards, forged token rejection, and public endpoint integrity.
  - Added `"test": "node scripts/test-integrity.cjs"` to `package.json`.
- **Phase 7: Production Hardening & Final Verification**:
  - Verified full TypeScript compilation (`tsc --noEmit`) and Vite + Esbuild production build (`npm run build`).
  - Verified Express SPA fallback routes and Render dynamic port binding.

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
