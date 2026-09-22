# Database & Storage Audit — SkillSwap 5.0

**Audit Date**: September 22, 2026  
**Auditor**: Lead AI Engineer & Autonomous Code Auditor  
**Scope**: Supabase PostgreSQL schema, indexes, RLS policies, migrations, and decommissioned Firestore artifacts.

---

## 1. Database Architecture Overview

SkillSwap 5.0 migrated its primary relational and document persistence layer from Google Cloud Firestore to **Supabase PostgreSQL**:
- **Connection**: Managed via `@supabase/supabase-js` client in both frontend and backend.
- **Decommissioned Technologies**: Firestore has been fully decoupled from data storage (`export const db = null as any` in `src/firebase.ts` and `firebaseAdmin.ts`).
- **Legacy Files to Remove**: `src/utils/firestoreRepository.ts` (dead code).

---

## 2. PostgreSQL Table Inventory (`SUPABASE_SCHEMA.sql`)

| Table Name | Purpose | Primary Key | Foreign Keys / References | Realtime Enabled |
|---|---|---|---|---|
| `public.users` | User profiles, balances, ratings, badges | `id (text)` | None | Yes |
| `public.skills` | Marketplace skill offerings and requests | `id (text)` | `userId -> users(id)` | Yes |
| `public.proposals` | Swap exchange proposals | `id (text)` | `senderId`, `recipientId` | Yes |
| `public.sessions` | Confirmed learning video/audio sessions | `id (text)` | `mentorId`, `learnerId` | Yes |
| `public.messages` | In-swap chat message history | `id (text)` | `swapProposalId` | Yes |
| `public.reviews` | Peer reviews and ratings | `id (text)` | `skillId`, `authorId` | Yes |
| `public.escrowTransactions`| Locked/Released credit records | `id (text)` | `proposalId`, `sessionId` | No |
| `public.pendingPayments` | Gateway transactions awaiting webhook | `id (text)` | `userId -> users(id)` | No |
| `public.transactions` | Financial audit ledger | `id (text)` | `userId -> users(id)` | No |
| `public.stripe_events` | Idempotency log for Stripe webhooks | `id (text)` | None | No |
| `public.notifications` | In-app user notifications | `id (text)` | `recipientUserId -> users(id)` | Yes |
| `public.webrtcRooms` | Video signaling session state | `id (text)` | None | No |

---

## 3. Critical Database Findings

### A. Wildcard RLS Policies in Base Schema (`SUPABASE_SCHEMA.sql`)
- Lines 251–278 contain unrestricted public access rules:
  ```sql
  create policy "Allow upsert users" on public.users for all using (true) with check (true);
  create policy "Allow manage skills" on public.skills for all using (true) with check (true);
  create policy "Allow manage proposals" on public.proposals for all using (true) with check (true);
  ```
- **Evaluation**: While `supabase_security_migration.sql` was drafted to drop these policies, executing it without first updating the client will break direct writes currently performed by `src/hooks/useCloudStateBridge.ts`.
- **Target Architecture**:
  1. Frontend sends all create/update requests through backend Express routes.
  2. Express uses `SUPABASE_SERVICE_ROLE_KEY` to execute authorized operations.
  3. Supabase RLS is configured to deny all direct anonymous client mutations (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` with read-only public policies for public marketplace skills).

### B. Missing Index Optimization
- Several critical query columns lack explicit B-tree indexes in `SUPABASE_SCHEMA.sql`:
  - `public.skills ("userId", "category", "createdAt")`
  - `public.proposals ("senderId", "recipientId", "status")`
  - `public.sessions ("mentorId", "learnerId", "status")`
  - `public.messages ("swapProposalId", "timestamp")`
  - `public.notifications ("recipientUserId", "read")`
- **Impact**: As dataset grows, sequential table scans will degrade API response times.
- **Remediation**: Include comprehensive index creation in `supabase_security_migration.sql`.

### C. Concurrency & Locking Deficiencies
- Credit modifications currently read the balance via client/server SELECT and issue a subsequent UPDATE.
- In high-concurrency scenarios, multiple transactions can read identical starting balances.
- **Remediation**: Use the database-level stored procedure `fulfill_pending_payment` defined in `supabase_security_migration.sql` with `SELECT ... FOR UPDATE`, and create corresponding stored procedures for escrow locks and releases (`lock_escrow_credits`, `release_escrow_credits`).
