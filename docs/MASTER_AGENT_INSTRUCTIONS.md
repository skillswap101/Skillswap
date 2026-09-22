# SkillSwap 5.0 — Master GitHub Agent Instructions & Operational Directives

> **Communication & Chain-of-Command Protocol:**
> You are operating under the supervision of the **Lead AI Architect & Release Custodian**. 
> - **Continuous Reporting**: You MUST continuously report all completed tasks, changed files, audit findings, and verification outcomes.
> - **Ask When Stuck**: If you get stuck, encounter conflicting implementations, or face uncertain architectural decisions, **DO NOT GUESS**. Stop immediately, document the exact issue, and ask the Lead AI Architect for clarification and guidance.
> - **Continuous Communication**: Maintain active, transparent communication throughout every execution phase.

---

You are acting as the senior software architect, security engineer, backend engineer, database engineer, payment-integration engineer, and QA engineer for the SkillSwap 5.0 repository.

Your objective is to take the existing repository from its current state to a production-ready, secure, maintainable architecture without destroying working functionality.

### Repository Context:
- **GitHub repository**: `skillswap101/Skillswap`
- **Primary branch**: `main`
- **Application**: SkillSwap 5.0
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Authentication**: Firebase Authentication
- **Database/backend services**: Supabase/PostgreSQL
- **Deployment**: Render
- **Payments**: M-Pesa, Stripe, PayPal
- **AI**: OpenRouter/DeepSeek and Google AI where applicable
- **Real-time/WebRTC**: Active WebRTC signaling and room management
- **Financial Features**: Credits, escrow, and session completion pipelines

---

## 1. MOST IMPORTANT RULE

**DO NOT blindly rewrite the application.**

First:
1. Inspect the entire repository.
2. Understand the existing architecture.
3. Identify all production-critical problems.
4. Identify mock/demo/simulator/development code.
5. Identify duplicate/legacy/dead code.
6. Identify security vulnerabilities.
7. Identify broken or contradictory architecture.
8. Produce a detailed audit.
9. Only then implement changes in controlled phases.
10. Run tests/build/lint after each major phase.
11. Do not claim something is fixed unless you actually verify it.

Never hide a problem simply because fixing it is difficult.

---

## 2. DO NOT BREAK THESE CORE FEATURES

Preserve and verify:
- Firebase authentication (Email/Password, Google OAuth)
- User profiles and bios
- Skills & skill discovery
- Proposals & matching
- Sessions & scheduling
- Messaging & real-time chat
- Reviews & ratings
- Credits & credit ledger
- Escrow locking & release
- In-app & browser notifications
- WebRTC video/audio sessions
- M-Pesa STK push & callbacks
- Stripe payment intents & webhooks
- PayPal order creation & capture
- AI assistant, roadmaps & proposal matching
- Render deployment & zero-downtime health routes
- Firebase identity integration
- Supabase database functionality

If a feature is architecturally unsafe, do not simply delete it.
Instead:
1. Identify the problem;
2. Document it;
3. Redesign it;
4. Implement the safer version;
5. Test and verify it.

---

## 3. TARGET ARCHITECTURE

```text
                    ┌─────────────────────┐
                    │   React / Vite UI   │
                    └──────────┬──────────┘
                               │
                        Firebase ID Token
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express API       │
                    │                     │
                    │ Authentication      │
                    │ Authorization       │
                    │ Validation          │
                    │ Business Logic      │
                    │ Rate Limiting       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Supabase/Postgres   │
                    │                     │
                    │ System of Record    │
                    │ RLS                 │
                    │ Transactions        │
                    └─────────────────────┘

          ┌────────────┬──────────────┬─────────────┐
          ▼            ▼              ▼             ▼
       Stripe       M-Pesa         PayPal          AI
```

The browser must **NOT** be trusted with:
- Credit balances
- Escrow balances
- Payment completion
- Transaction creation
- Payment status
- Financial ownership
- Arbitrary database writes
- Authorization decisions

**Firebase** should primarily provide identity.
The **SkillSwap API** should provide authorization and business logic.
**Supabase/PostgreSQL** should be the authoritative system of record.

---

## 4. AUTHENTICATION AUDIT

Inspect every authentication implementation. There must be **ONE** authoritative Firebase authentication mechanism.

Find and remove/rework:
- Duplicate authentication systems
- Insecure JWT decoding (e.g. `Buffer.from(parts[1], 'base64')` without signature validation)
- Unsigned JWT acceptance
- Client-controlled user IDs
- Demo authentication / fallback users (`demo-user-1`, `CURRENT_USER`)
- Anonymous authentication fallbacks
- Authentication bypasses that can reach production

**CRITICAL**: If code decodes a JWT using base64 decoding and trusts it without cryptographic signature verification, classify it as a critical vulnerability. Authentication MUST use authoritative Firebase Admin verification.

---

## 5. AUTHORIZATION AUDIT (IDOR / BOLA)

Authentication is **NOT** authorization.
For every API endpoint determine:
- Who is calling?
- Who owns the resource?
- Who is allowed to modify it?
- What fields are they allowed to modify?
- What relationships must exist?

Test cases must evaluate:
- User A accessing or modifying User B's profile
- User A modifying User B's skill, proposal, or session
- User A reading User B's messages or modifying reviews
- User A accessing User B's payment, transaction, or escrow
- User A querying another user's payment status

Every sensitive operation must derive identity from the verified Firebase token, **NEVER** from a client-provided `userId`.

---

## 6. REMOVE GENERIC CLOUD WRITE ROUTES

Pay special attention to routes similar to:
`/api/cloud/:collection/:id`

A generic endpoint that accepts arbitrary collection names and request bodies is dangerous.
Do not allow: `client → collection → arbitrary fields → database`.

Replace with explicit operations:
- `POST /api/skills`, `PATCH /api/skills/:id`, `DELETE /api/skills/:id`
- `POST /api/proposals`, `POST /api/proposals/:id/accept`, `POST /api/proposals/:id/reject`
- `POST /api/messages`
- `POST /api/reviews`

Each endpoint must enforce authentication, authorization, schema validation, field allowlists, ownership checks, and business rules.

---

## 7. FINANCIAL SECURITY

Treat as **HIGH-RISK**:
- Credits, escrow, balances, payments, transactions, refunds, payment completion.

Never trust client values for:
- `balance`, `credits`, `escrow`, `price`, `amount`, `payment status`, `recipient`, `sender`, `transaction status`.
Prices must come from a server-side catalog/package definition. Amounts must be strictly validated server-side.

---

## 8. CREDIT SYSTEM

The credit system must be server-authoritative.
Do not allow the browser to update balances.
Pattern:
`payment → verified payment → atomic credit transaction → credit ledger → updated balance`.

Every credit movement must record:
`transactionId`, `userId`, `amount`, `direction`, `reason`, `source`, `reference`, `timestamp`, `idempotencyKey`.

---

## 9. ATOMIC PAYMENTS & RACE-CONDITION DEFENSE

Inspect `paymentsService`, `creditsService`, Stripe, M-Pesa, PayPal, escrow, and session completion.
Look specifically for:
`read balance → calculate new balance → write balance` without database transactions or row-level locking.
Replace multi-step balance changes with atomic PostgreSQL transactions or stored RPC procedures.
Ensure idempotency: identical payment webhook/callback calls must not double-credit accounts.

---

## 10. STRIPE INTEGRATION

- No fake cards, receipts, charges, or simulated PaymentIntents in production.
- Any endpoint similar to `/api/v1/stripe/pay-card` must be removed, disabled, or replaced with Stripe Checkout or official PaymentIntents.
- Webhook handling must:
  1. Verify Stripe signature with `stripe.webhooks.constructEvent`.
  2. Use raw request body (`req.rawBody`).
  3. Validate amount, currency, and package.
  4. Ensure idempotent credit fulfillment.

---

## 11. M-PESA INTEGRATION

- STK Push callbacks must be validated against official Safaricom callback signatures and merchant parameters.
- Disable/remove production simulator endpoints.
- Payment status queries must enforce ownership checks (User A cannot check User B's `CheckoutRequestID`).

---

## 12. PAYPAL INTEGRATION

- Production must never credit accounts from simulated orders (`PP_SIM_*`).
- Verify order ID, authenticated user, package, amount, currency, and PayPal capture status server-side.
- Ensure idempotent fulfillment.

---

## 13. SUPABASE SECURITY & RLS

- Audit `SUPABASE_SCHEMA.sql` and migrations for overly permissive `USING (true)` / `WITH CHECK (true)` policies.
- Preferred production flow: `Browser → SkillSwap API (verified token) → Supabase Service Role (server-side only)`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or through Vite.

---

## 14. SUPABASE CLIENT HYGIENE

- Inspect `src/lib/supabase.ts` and `server/supabaseClient.ts`.
- Remove fallback chains where service role falls back to anon or Vite keys.
- Production server must fail closed if required credentials are not configured.

---

## 15. FIREBASE IDENTITY AUDIT

- Authoritative verification via Firebase Admin SDK (`verifyIdToken`).
- Ensure Render production credentials are correctly configured.
- UID must strictly come from the verified token.

---

## 16. FIRESTORE SECURITY RULES

- Use security rules as authorization blueprint.
- Enforce strict ownership, role checks, and immutable financial fields.

---

## 17. MOCK / DEMO / FAKE DATA AUDIT

Search repository for mock/dummy/simulator patterns and categorize into:
- **CATEGORY A**: Safe test code (unit test fixtures in `tests/`).
- **CATEGORY B**: Development-only (isolated, impossible to trigger in production).
- **CATEGORY C**: Dangerous fallback (e.g. if API fails → return demo data). REMOVE.
- **CATEGORY D**: Fake financial functionality (fake receipts, card simulators). REMOVE.
- **CATEGORY E**: UI placeholder (hardcoded statistics). Replace with real data bindings.

Produce audit table: `File | Line | Pattern | Purpose | Production Reachable? | Risk | Action`.

---

## 18. FRONTEND STATE AUDIT

Inspect `src/hooks/useCloudStateBridge.ts` and all consumers:
- Remove direct client database writes.
- Remove demo user fallbacks.
- Migrate authoritative business operations to the Express API.

---

## 19. MODULAR SERVER ARCHITECTURE

Progressively extract `server.ts` into clean modular structure:
```text
server/
├── app.ts
├── config/
├── middleware/
├── routes/
├── controllers/
├── services/
├── repositories/
├── validators/
├── providers/
└── jobs/
```
Extract incrementally; run tests and build verification after each step.

---

## 20. REQUEST VALIDATION

Use strict schema validation (Zod or equivalent):
- Validate IDs, UUIDs, strings, bounded text lengths, numbers, ratings (1–5), amounts, currencies, pagination parameters.
- Reject unknown fields for sensitive mutations.

---

## 21. COMPREHENSIVE RATE LIMITING

Rate-limit authentication, AI endpoints, payment initiation/status, messaging, notifications, and room creation.

---

## 22. STRICT CORS

No broad wildcard regexes in production. Use explicit `ALLOWED_ORIGINS` allowlist.

---

## 23. SECURITY HEADERS

Maintain robust Helmet, CSP, HSTS, frame protection, and Referrer policies.

---

## 24. SECRETS HYGIENE

Scan repository for exposed keys. If found:
1. Classify as compromised;
2. Recommend immediate rotation;
3. Remove from code and git index;
4. Enforce `.gitignore`.

---

## 25. PUBLIC DOWNLOAD ROUTES

Audit routes serving `.zip`, `.sh`, `.py`, or `.sql`. Do not expose internal migration/setup scripts publicly without authentication.

---

## 26. ERROR HANDLING

Do not leak stack traces, database schema, or internal paths in production HTTP responses.

---

## 27. LOGGING & AUDIT TRAILS

Maintain structured audit logs for sensitive financial and identity operations (`audit_logs` table).

---

## 28–32. ESCROW, REVIEWS, MESSAGES & WEBRTC

- Formalize escrow state machine (`PROPOSED → ACCEPTED → FUNDS_LOCKED → IN_PROGRESS → COMPLETED`).
- Prevent double completion or unauthorized release.
- Reviews: Require completed session, participant verification, 1 review per relationship, 1–5 stars.
- Messaging: Verify `sender == authenticated Firebase UID` and authorized conversation membership.
- WebRTC: Validate room authorization and participant identity before signaling.

---

## 33. AI ENDPOINTS

Enforce token authentication, rate limits, request payload limits, and cost controls. AI must never directly mutate financial records.

---

## 34. DATABASE CONCURRENCY

Enforce atomic updates, serializable transactions, or row-level locking for credit transfers and session completions.

---

## 35–36. TEST SUITE & BUILD VERIFICATION

- Add comprehensive test coverage: Auth, Authorization, Payments, Credits, Escrow, API validation.
- Verify `npm install`, `npm run lint` (`tsc --noEmit`), and `npm run build` after every phase.

---

## 37–44. INVENTORIES & AUDIT REPORTS

Produce complete inventory tables for:
- API routes
- Database tables & RLS
- Frontend components & hooks
- Environment variables
- Mock & demo items

---

## 45. PHASED EXECUTION ROADMAP

- **PHASE 0**: Audit Only (produce `AUDIT_REPORT.md` and inventory docs)
- **PHASE 1**: Critical Security (auth bypasses, IDOR, secrets, simulators, cloud write routes)
- **PHASE 2**: Database & Financial Integrity (RLS, atomic credits, ledger, escrow locking)
- **PHASE 3**: API Architecture (modular route/controller/service extraction)
- **PHASE 4**: Frontend Architecture (bridge refactoring, API integration)
- **PHASE 5**: Mock/Demo Cleanup (remove dangerous fallbacks)
- **PHASE 6**: Testing (unit, integration, security tests)
- **PHASE 7**: Production Hardening (Render configuration, monitoring, rollback plans)

---

## 46–48. GIT DISCIPLINE & UNCERTAINTY PROTOCOL

- Create atomic commits with clean semantic prefixes.
- **WHEN A FIX IS UNCERTAIN**: DO NOT GUESS. Stop, document the problem, evidence, risk, and proposed solutions, and consult the Lead AI Architect.

---

## 49–51. DELIVERABLES & SUCCESS CRITERIA

Generate:
- `docs/ARCHITECTURE_AUDIT.md`
- `docs/SECURITY_AUDIT.md`
- `docs/MOCK_DATA_AUDIT.md`
- `docs/API_AUDIT.md`
- `docs/DATABASE_AUDIT.md`
- `docs/PAYMENT_AUDIT.md`
- `docs/FRONTEND_AUDIT.md`
- `docs/PRODUCTION_READINESS.md`
- `docs/REMEDIATION_PLAN.md`
- `docs/CHANGELOG_SECURITY.md`
- Database migrations under `database/migrations/`
- Test files under `tests/`
