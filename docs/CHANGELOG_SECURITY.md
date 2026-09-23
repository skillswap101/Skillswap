# Security Changelog — SkillSwap 5.0

This file records all security-related architectural modifications, CVE/CWE resolutions, authorization patches, and secrets hygiene enforcements across the platform.

---

## [Phase 1: Critical Security] — 2026-09-23

### 1. BOLA / IDOR Resolution on Payment Status Polling (CWE-639)
- **File**: `mpesaPay.js`
- **Issue**: `/api/v1/mpesa/status/:checkoutRequestId` permitted any authenticated user to poll payment status for any arbitrary `checkoutRequestId`.
- **Resolution**: Added ownership check querying `getPendingPayment('mpesa', req.params.checkoutRequestId)` and asserting `pending.userId === req.user.uid`. Returns `403 Access denied` if caller is not the owner.

### 2. Elimination of Unearned Credit Bypass in PayPal Capture (CWE-284)
- **File**: `paypal.js`
- **Issue**: Capture route `/api/v1/paypal/capture-order` contained fallback logic crediting real account time credits for simulated order IDs (`PP_SIM_`) or when PayPal environment variables were unconfigured.
- **Resolution**:
  - Unconfigured PayPal gateway fails closed with `503 Service Unavailable`.
  - Simulator order IDs are rejected in production with `403 Forbidden`. Only permitted if `ALLOW_PAYMENT_SIMULATORS === 'true'` and `NODE_ENV !== 'production'`.

### 3. Simulator Gate Hardening in M-Pesa (CWE-284)
- **File**: `mpesaPay.js`
- **Issue**: Simulated confirmation endpoint `/api/v1/mpesa/simulate-confirm` was vulnerable to loose condition gating.
- **Resolution**: Strictly fail-closed gating: disabled if `NODE_ENV === 'production' || ALLOW_PAYMENT_SIMULATORS !== 'true'`.

### 4. Removal of Hardcoded Tokens & Fail-Closed Supabase Initialization (CWE-798)
- **Files**: `server/supabaseClient.ts`, `src/lib/supabase.ts`
- **Issue**: Hardcoded JWT / anon key strings were present as default fallbacks.
- **Resolution**:
  - Removed all hardcoded token literals from both server and client modules.
  - Server initialization strictly prioritizes environment variables and warns on missing configuration rather than silently utilizing embedded strings.

### 5. Consolidation of Authoritative Firebase Authentication (CWE-306)
- **File**: `middleware/auth.js`
- **Issue**: Duplicate `initializeApp` credential parsing and potential for unrevoked token drift.
- **Resolution**: Unified with central `firebaseAdmin.ts` instance `firebaseAuth`. Enforced fail-closed behavior returning `503 Service Unavailable` if Firebase Admin is not initialized.
