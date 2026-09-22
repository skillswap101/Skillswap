# Mock Data & Stub Audit — SkillSwap 5.0

**Audit Date**: September 22, 2026  
**Auditor**: Lead AI Engineer & Autonomous Code Auditor  
**Scope**: Full scan for hardcoded fixtures, demo users, simulated delays, and fake identifiers.

---

## 1. Inventory of Mock Data & Stub Files

| File | Type of Mock / Stub | Risk / Impact |
|---|---|---|
| `src/data/mockData.ts` | Complete static seed dataset: `CURRENT_USER`, `INITIAL_SKILLS`, `INITIAL_PROPOSALS`, `INITIAL_SESSIONS`, `INITIAL_MESSAGES`, `INITIAL_REVIEWS`. | **HIGH**: Feeds offline cache and fallback state if database is empty. |
| `src/components/UserDirectoryModal.tsx` | `FALLBACK_COMMUNITY_MEMBERS` array containing `CURRENT_USER`, `usr_1`, `usr_2`. | **MEDIUM**: Displays fake users if user database query returns fewer than 3 records. |
| `src/utils/escrowManager.ts` | `INITIAL_ESCROW_TXS` containing `escrow-101`, `escrow-102`. | **HIGH**: Pollutes escrow list with fake transactions when using local storage. |
| `src/hooks/useCloudStateBridge.ts` | Imports `INITIAL_*` from `mockData.ts` for `loadFromOfflineCache`. | **HIGH**: Can mask database connection issues by silently displaying dummy data. |
| `paypal.js` | `PP_SIM_*` prefix check and simulated capture branch. | **CRITICAL**: Enables simulated fulfillment without real money transfer. |
| `mpesaPay.js` | `/api/v1/mpesa/simulate-confirm` simulator endpoint. | **MEDIUM**: Allows fake M-Pesa confirmation if enabled. |

---

## 2. Component-by-Component Findings

### A. `src/data/mockData.ts`
- **Contents**:
  - `CURRENT_USER`: "Alex Rivera" (`usr_me`), with fake rating, credits, bio, and avatar.
  - `INITIAL_SKILLS`: 8 hardcoded skills with fake Unsplash images and reviews.
  - `INITIAL_PROPOSALS`: 3 hardcoded proposals between `usr_me` and `usr_1` / `usr_2`.
  - `INITIAL_SESSIONS`: 2 hardcoded sessions.
  - `INITIAL_MESSAGES`: 4 hardcoded chat messages.
  - `INITIAL_REVIEWS`: 4 hardcoded reviews.
- **Remediation**:
  - Convert `mockData.ts` into an optional database seeding script (`scripts/seedDatabase.ts`) for clean initial deployment.
  - Remove all runtime fallback imports in production client state.

### B. `src/components/UserDirectoryModal.tsx`
- **Lines 23-45**:
  ```ts
  const FALLBACK_COMMUNITY_MEMBERS: User[] = [
    CURRENT_USER,
    { id: 'usr_1', name: 'Elena Rostova', ... },
    { id: 'usr_2', name: 'Marcus Chen', ... },
  ];
  ```
- **Behavior**: If the database query returns 0 users, it renders fake members.
- **Remediation**: Display an authentic empty state ("No community members found yet. Be the first to join!") instead of synthetic user cards.

### C. `src/utils/escrowManager.ts`
- **Lines 5-34**:
  ```ts
  const INITIAL_ESCROW_TXS: EscrowTransaction[] = [
    { id: 'escrow-101', proposalId: 'prop-1', ... },
    { id: 'escrow-102', proposalId: 'prop-2', ... }
  ];
  ```
- **Behavior**: Initializes browser `localStorage` with fake transactions.
- **Remediation**: Delete `src/utils/escrowManager.ts` in its entirety in Phase 1.

---

## 3. Verification Protocol for Zero Mock Data
1. Run `grep -rn "CURRENT_USER\|mockData\|INITIAL_ESCROW_TXS" src/`.
2. Ensure empty database returns legitimate empty UI states (empty state banners with action buttons) rather than fallback mock arrays.
3. Ensure all payment fulfillment requests contact actual payment processor webhooks or APIs.
