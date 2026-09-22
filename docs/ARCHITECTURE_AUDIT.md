# Architecture Audit — SkillSwap 5.0

**Audit Date**: September 22, 2026  
**Auditor**: Lead AI Engineer & Autonomous Code Auditor  
**Scope**: Full repository architecture, module boundaries, data flow, server/client separation, and deployment topology.

---

## 1. System Topology Overview

SkillSwap 5.0 is designed as a hybrid full-stack web application hosted on Render and containerized for Cloud Run / Docker environments:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│  React 19 + TypeScript + Vite + Tailwind CSS v4             │
│  State: useCloudStateBridge, AuthContext, ThemeContext      │
└──────────────┬───────────────────────────────┬──────────────┘
               │ (Client-side Supabase query)  │ (HTTP API /api/*)
               ▼                               ▼
┌──────────────────────────────┐    ┌─────────────────────────┐
│     Supabase Postgres        │    │    Express Node Server   │
│  (Database & Realtime Pub)   │    │  (server.ts / CJS bundl)│
│  Auth: Third-Party JWT / Anon│    └────────────┬────────────┘
└──────────────────────────────┘                 │ (Service Role)
                                                 ▼
                                    ┌─────────────────────────┐
                                    │    Supabase Postgres    │
                                    │ (Privileged DB Queries) │
                                    └─────────────────────────┘
```

---

## 2. Identified Architectural Defects

### A. Split-Brain Data Flow (Supabase Direct vs. Express Backend)
- **Finding**: Currently, the client interacts with data in two conflicting ways:
  1. `src/hooks/useCloudStateBridge.ts` calls `supabase.from(...)` directly from the browser using the public anonymous key.
  2. `server.ts` exposes `/api/cloud/:collection/:id`, `/api/proposals/*`, `/api/sessions/*`, etc., interacting with Supabase via `server/supabaseClient.ts`.
  3. `src/lib/api.ts` makes fetch calls to `/api/listings`, `/api/users`, etc., which are **not implemented** in `server.ts`.
- **Architectural Violation**: Violates the single-authority principle. Business rules (escrow locks, credit deductions, and listing creation) are scattered between client hooks, orphaned API files, and Express controllers.
- **Remediation**: Establish Express as the single source of truth for all mutations and sensitive queries (`Browser -> SkillSwap API -> Supabase`). Restrict client-side Supabase strictly to real-time pub/sub listeners.

### B. Dual Authentication Middlewares
- **Finding**: Two distinct authentication middlewares exist:
  1. `server.ts`: `verifyFirebaseToken` (TypeScript, validates Firebase ID token using `firebaseAuth.verifyIdToken(token)`).
  2. `middleware/auth.js`: `authenticateUser` (JavaScript, initializes a duplicate Firebase Admin app and verifies ID tokens without revoked token checking).
- **Impact**: Code duplication and maintenance drift. Payment gateway routes (`stripe.js`, `mpesaPay.js`, `paypal.js`) import `middleware/auth.js`, while core API routes in `server.ts` use `verifyFirebaseToken`.
- **Remediation**: Consolidate into a single, canonical TypeScript middleware (`server/middleware/auth.ts`) using the centralized `firebaseAdmin.ts` instance.

### C. Multiple Escrow Managers with Conflicting Storage Engines
- **Finding**: Three separate escrow management files exist in the project:
  1. `src/lib/escrowManager.ts`: Calls `api.lockEscrow`, `api.releaseEscrow`, `api.refundEscrow`.
  2. `src/utils/escrowManager.ts`: Stores and mutates escrow transactions inside browser `localStorage` (`skillswap_5_escrow_transactions`).
  3. `src/utils/firebaseEscrow.ts`: An unreferenced utility that reads/writes to `localStorage` via `src/utils/escrowManager.ts`.
  4. `server/services/creditsService.ts`: Mutates escrow in Supabase Postgres (`escrowTransactions`).
- **Impact**: Some components (`ChatPortal.tsx`, `CallActionModal.tsx`, `TimeCreditsView.tsx`) read and write escrow to local storage, completely bypassed by the real server database.
- **Remediation**: Delete `src/utils/escrowManager.ts` and `src/utils/firebaseEscrow.ts`. Route all UI escrow operations exclusively through authoritative backend API endpoints backed by Postgres.

### D. Dead & Duplicate UI Components
- **Finding**: Five major components are unreferenced and obsolete:
  1. `src/components/CreateListingModal.tsx` (Replaced by `PostSkillModal.tsx`).
  2. `src/components/LiveSessionRoom.tsx` (Replaced by `SessionRoomModal.tsx`).
  3. `src/components/Navbar.tsx` (Replaced by `Header.tsx`).
  4. `src/components/ProposeSwapModal.tsx` (Replaced by `ProposalModal.tsx`).
  5. `src/components/SkillMarketplace.tsx` (Marketplace is rendered inline in `src/App.tsx`).
- **Remediation**: Prune orphaned components to eliminate maintenance overhead, reduce bundle size, and prevent confusing regression edits.

---

## 3. Structural Health Score
- **Modularity**: Medium (Good sub-component separation, but duplicate modules exist)
- **Layer Separation**: Low (Direct client DB access mixed with backend endpoints)
- **Deployment Alignment**: High (Render configuration, Vite proxy, and CJS bundling are well configured)
