# Payment Systems & Financial Integrity Audit — SkillSwap 5.0

**Audit Date**: September 22, 2026  
**Auditor**: Lead AI Engineer & Autonomous Code Auditor  
**Scope**: Stripe, Safaricom M-Pesa, PayPal, Escrow, and Time Credit Ledger workflows.

---

## 1. Supported Payment Gateways

SkillSwap 5.0 supports three payment gateways for purchasing platform Time Credits:
1. **Stripe Checkout**: Credit/debit card processing via hosted checkout sessions.
2. **Safaricom M-Pesa**: Direct mobile money STK push for East African markets.
3. **PayPal**: International digital wallet orders via PayPal Orders v2 API.

---

## 2. In-Depth Gateway Security & Logic Audits

### A. Stripe Integration (`stripe.js`)
- **Checkout Session Creation** (`/api/v1/stripe/create-checkout-session`):
  - Properly authenticates user via `authenticateUser`.
  - Packages and prices are validated against authoritative definitions in `server/packageCatalog.ts`.
  - Creates a `pendingPayments` record with `gateway: 'stripe'` and unique `gatewayRef: session.id`.
- **Webhook Handler** (`/api/v1/stripe/webhook`):
  - Properly verifies raw request body HMAC signature using `stripe.webhooks.constructEvent`.
  - Rejects missing or invalid signatures with HTTP 400.
  - Idempotency is checked via `pendingPayments` record status.
- **Vulnerability**:
  - `/api/v1/stripe/pay-card` endpoint is disabled (`HTTP 410`), but remains present in code. Remove completely.

### B. M-Pesa Integration (`mpesa.js`, `mpesaPay.js`, `mpesaCallback.js`)
- **STK Push Initiation** (`/api/v1/mpesa/pay`):
  - Validates Kenyan phone number formatting (`2547XXXXXXXX` or `2541XXXXXXXX`).
  - Calls Safaricom Daraja API with OAuth bearer token and generated password timestamp.
  - Records pending transaction in Supabase.
- **Independent Callback Verification** (`mpesaCallback.js`):
  - When Safaricom calls `/api/v1/mpesa/callback`, the handler does **not** blindly trust the incoming JSON.
  - Calls Safaricom's `querySTKPushStatus` independently to confirm the transaction status directly from the telco.
  - Upon verified success, calls `fulfillPendingPayment`.
- **Vulnerabilities**:
  1. `/api/v1/mpesa/status/:checkoutRequestId`: Missing caller authorization. Caller can inspect any user's transaction status by knowing their `checkoutRequestId`.
  2. `/api/v1/mpesa/simulate-confirm`: Allows simulated fulfillment; must be completely disabled in production.

### C. PayPal Integration (`paypal.js`)
- **Order Creation** (`/api/v1/paypal/create-order`):
  - Generates PayPal v2 order using server-side client credentials.
  - Persists pending record in `pendingPayments`.
- **Order Capture** (`/api/v1/paypal/capture-order`):
  - **CRITICAL FLAW (Lines 153-162)**: Contains a sandbox bypass:
    ```js
    if (orderID.startsWith('PP_SIM_') || !isPaypalConfigured()) {
      await fulfillPendingPayment('paypal', orderID, `PP_RECEIPT_${Date.now()}`);
      ...
    }
    ```
  - This allows free credit generation by passing `PP_SIM_*` or if environment variables are unset.
  - **Remediation**: Eliminate this bypass entirely. PayPal capture must strictly require an authorized capture response from the PayPal API.

### D. Time Credits & Escrow Subsystem (`creditsService.ts`)
- **Proposal Acceptance & Lock**:
  - Validates that learner has sufficient credits.
  - Deducts from `timeCredits` and increments `escrowLockedCredits`.
  - Creates an `escrowTransactions` entry with status `LOCKED`.
- **Session Completion & Release**:
  - Only participants (mentor or learner) can complete.
  - Increments mentor's `timeCredits` and decrements learner's `escrowLockedCredits`.
  - Sets escrow status to `RELEASED`.
- **Vulnerability**:
  - Both lock and release operations are non-atomic (read balance, update balance). Must be wrapped in database transactions or PostgreSQL stored functions.

---

## 3. Financial Integrity Checklist
- [x] Webhook signatures cryptographically validated (Stripe)
- [x] Independent third-party transaction query on callback (M-Pesa)
- [ ] No simulation or fake receipt bypass in production (PayPal & M-Pesa open issues)
- [ ] Atomic database-level credit deduction and release (Needs RPC implementation)
- [ ] Object-level access control on payment status polling (Needs BOLA fix)
