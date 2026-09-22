# Prioritized Remediation Plan — SkillSwap 5.0

**Audit Date**: September 22, 2026  
**Auditor**: Lead AI Engineer & Autonomous Code Auditor  
**Execution Sequence**: Strict phase gating (Phase 1 through Phase 6) per Master Agent Directives.

---

## Priority Order of Remediation

### Immediate Priority (P0 — Security & Financial Invariants)
1. **Fix SEC-04 (PayPal Credit Bypass)**:
   - Target: `paypal.js` (lines 153-162).
   - Action: Remove `orderID.startsWith('PP_SIM_') || !isPaypalConfigured()` bypass. Strictly require real PayPal Order capture verification before calling `fulfillPendingPayment`.
2. **Fix SEC-03 (M-Pesa BOLA/IDOR)**:
   - Target: `mpesaPay.js` (lines 92-100).
   - Action: Fetch pending payment record, verify `pending.userId === req.user.uid`, return 403 if unauthorized.
3. **Fix SEC-01 & SEC-02 (Credential Hardcoding & Server Fallback)**:
   - Target: `src/lib/supabase.ts`, `server/supabaseClient.ts`.
   - Action: Eliminate hardcoded secret string fallbacks. Ensure server fails closed with a descriptive runtime error if `SUPABASE_SERVICE_ROLE_KEY` is not provided.
4. **Remove Disabled / Dangerous Routes**:
   - Target: `stripe.js` (`/api/v1/stripe/pay-card`), `mpesaPay.js` (`/api/v1/mpesa/simulate-confirm`).
   - Action: Remove or strictly gate simulator routes behind non-production flags.

---

### High Priority (P1 — Architecture & Single Source of Truth)
5. **Consolidate Authentication Middleware**:
   - Action: Merge `middleware/auth.js` into canonical `server/middleware/auth.ts` or `server.ts` `verifyFirebaseToken`. Update `stripe.js`, `mpesaPay.js`, and `paypal.js` to use the unified middleware.
6. **Eliminate Client-Side Escrow Duplication**:
   - Target: `src/utils/escrowManager.ts`, `src/utils/firebaseEscrow.ts`.
   - Action: Update `ChatPortal.tsx`, `CallActionModal.tsx`, and `TimeCreditsView.tsx` to interact with backend endpoints (`/api/proposals/:id/accept`, `/api/sessions/:id/complete`) rather than browser `localStorage`. Delete local escrow manager files.
7. **Prune Orphaned Code**:
   - Action: Remove unused files:
     - `src/components/CreateListingModal.tsx`
     - `src/components/LiveSessionRoom.tsx`
     - `src/components/Navbar.tsx`
     - `src/components/ProposeSwapModal.tsx`
     - `src/components/SkillMarketplace.tsx`
     - `src/services/api.js`
     - `src/utils/firestoreRepository.ts`

---

### Medium Priority (P2 — Database Integrity & Concurrency)
8. **Enforce Atomic Financial Transactions via PostgreSQL RPC**:
   - Action: Ensure credit updates in `server/services/paymentsService.ts` and `server/services/creditsService.ts` execute through `fulfill_pending_payment` and dedicated atomic RPC functions utilizing row-level locks (`SELECT ... FOR UPDATE`).
9. **Eliminate Client-Side Over-Fetching**:
   - Action: Update `useCloudStateBridge.ts` to query Supabase with `.or(\`senderId.eq.${uid},recipientId.eq.${uid}\`)` instead of downloading all table records into client memory.
10. **Apply Database Migration**:
    - Action: Run `supabase_security_migration.sql` to establish strict RLS once the backend endpoints are in place.

---

### Normal Priority (P3 — Mock Data Eradication & Test Suite)
11. **Eradicate Mock Fallbacks**:
    - Target: `src/components/UserDirectoryModal.tsx`, `src/hooks/useCloudStateBridge.ts`.
    - Action: Replace `FALLBACK_COMMUNITY_MEMBERS` with authentic empty-state UI components.
12. **Introduce Automated Test Suite**:
    - Action: Add `test` script in `package.json` with integration tests covering `/api/health`, authentication verification, rate limit headers, and webhook signature verification.
