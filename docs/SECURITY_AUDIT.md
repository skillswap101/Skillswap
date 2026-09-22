# Security Audit — SkillSwap 5.0

**Audit Date**: September 22, 2026  
**Auditor**: Lead AI Engineer & Autonomous Code Auditor  
**Classification Standards**: OWASP Top 10 API Security, CWE, Master Agent Security Mandates

---

## 1. Executive Security Summary

The codebase has strong foundational defenses (Express `trust proxy`, rate limiters, Helmet headers, CORS policies), but contains several critical vulnerabilities that must be resolved prior to production launch:

| ID | Vulnerability | Severity | Location | Status |
|---|---|---|---|---|
| SEC-01 | Hardcoded Supabase Anon Key & Fallback Chain | **HIGH** | `src/lib/supabase.ts:9`, `server/supabaseClient.ts:14` | Open |
| SEC-02 | Insecure Credential Fallback Chain in Server | **CRITICAL** | `server/supabaseClient.ts:10-15` | Open |
| SEC-03 | Broken Object Level Authorization (BOLA/IDOR) on M-Pesa Status | **HIGH** | `mpesaPay.js:92-100` | Open |
| SEC-04 | Free Credit Generation via Sandbox Bypass | **CRITICAL** | `paypal.js:153-162` | Open |
| SEC-05 | Insecure Overly Permissive Row Level Security (RLS) | **CRITICAL** | `SUPABASE_SCHEMA.sql:251-278` | Open |
| SEC-06 | Non-Atomic Financial Credit Operations (Race Condition) | **HIGH** | `server/services/paymentsService.ts:88-97`, `creditsService.ts:58-71` | Open |
| SEC-07 | Production Simulator Endpoints Exposed | **MEDIUM** | `mpesaPay.js:103-128`, `stripe.js:127-132` | Open |

---

## 2. Detailed Vulnerability Analyses

### SEC-01 & SEC-02: Hardcoded Secrets & Insecure Fallback Chain
- **Location**: `src/lib/supabase.ts` (lines 8-10), `server/supabaseClient.ts` (lines 10-15).
- **Detail**:
  ```ts
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  ```
- **Risk**: If the privileged `SUPABASE_SERVICE_ROLE_KEY` is not present, the server silently falls back to an unprivileged anonymous key or hardcoded placeholder, causing permission failures or exposing secrets.
- **Requirement**: The server must fail closed: if `SUPABASE_SERVICE_ROLE_KEY` is missing in production, throw an explicit initialization error and never fall back to public keys.

### SEC-03: Broken Object Level Authorization (BOLA / IDOR) on M-Pesa Status
- **Location**: `mpesaPay.js` (lines 92-100).
- **Detail**:
  ```js
  router.get('/api/v1/mpesa/status/:checkoutRequestId', authenticateUser, async (req, res) => {
    const status = await getPendingPaymentStatus('mpesa', req.params.checkoutRequestId);
    ...
  });
  ```
- **Risk**: Although the user is authenticated, the endpoint does not verify whether `checkoutRequestId` belongs to `req.user.uid`. Any authenticated user can poll the transaction status and receipt information of another user by providing their ID.
- **Requirement**: Validate that the record's `userId === req.user.uid` before returning payment details.

### SEC-04: Free Credit Generation via Sandbox Bypass in PayPal Capture
- **Location**: `paypal.js` (lines 153-162).
- **Detail**:
  ```js
  if (orderID.startsWith('PP_SIM_') || !isPaypalConfigured()) {
    await fulfillPendingPayment('paypal', orderID, `PP_RECEIPT_${Date.now()}`);
    return res.json({ success: true, message: 'PayPal payment captured successfully (Sandbox Mode)', ... });
  }
  ```
- **Risk**: Any caller can supply `orderID: "PP_SIM_123"` or hit the endpoint when PayPal credentials are not loaded to receive free real account credits.
- **Requirement**: Remove all simulator bypass logic from production code. In non-production test environments, strictly gate simulations behind `ALLOW_PAYMENT_SIMULATORS === 'true'` and explicit admin role checks.

### SEC-05: Overly Permissive Row Level Security (RLS)
- **Location**: `SUPABASE_SCHEMA.sql` (lines 251-278).
- **Detail**:
  ```sql
  create policy "Allow upsert users" on public.users for all using (true) with check (true);
  create policy "Allow manage skills" on public.skills for all using (true) with check (true);
  create policy "Allow manage proposals" on public.proposals for all using (true) with check (true);
  ```
- **Risk**: Direct client connections using the public anonymous key can update, overwrite, or delete any record in the database, including user credit balances (`timeCredits`).
- **Requirement**: Execute `supabase_security_migration.sql` to revoke public write access and enforce server-mediated database operations through the Express service role.

### SEC-06: Non-Atomic Financial Credit Operations
- **Location**: `server/services/paymentsService.ts` (lines 82-98), `server/services/creditsService.ts` (lines 58-71, 205-235).
- **Detail**: Application performs `SELECT balance -> compute in memory -> UPDATE balance`.
- **Risk**: Concurrent calls (e.g. concurrent proposal acceptance or double-tap payment callbacks) cause race conditions and balance desynchronization.
- **Requirement**: Use database-level atomic locking (`SELECT ... FOR UPDATE`) or PostgreSQL RPC functions (`fulfill_pending_payment`, `lock_escrow_credits`, `release_escrow_credits`).

---

## 3. Security Recommendations Summary
1. Disallow all client-side write access to critical tables via strict RLS.
2. Route all mutations through authenticated Express routes guarded by `verifyFirebaseToken`.
3. Validate ownership on all resource access (`resource.userId === req.user.uid`).
4. Eliminate fallback secret defaults and enforce fail-closed credential validation.
