# API & Endpoint Audit — SkillSwap 5.0

**Audit Date**: September 22, 2026  
**Auditor**: Lead AI Engineer & Autonomous Code Auditor  
**Scope**: All Express REST API routes, parameter validation, authentication gates, and error handling.

---

## 1. Complete Route Inventory

### A. Health & System
| Method | Route | Auth Required | Purpose | Status |
|---|---|---|---|---|
| `GET` | `/api/health` | None | Render health check / readiness | Verified (HTTP 200 `{ status: "healthy" }`) |
| `GET` | `/api/audit/run` | Firebase Token | Automated system diagnostics | Operational |

### B. Core Application & Cloud State
| Method | Route | Auth Required | Purpose | Status / Risk |
|---|---|---|---|---|
| `POST` | `/api/cloud/:collection/:id` | Firebase Token | Generic cloud document upsert | **RISK**: Overly broad parameter route. Replace with explicit resource endpoints. |
| `GET` | `/api/cloud/:collection/:id` | Firebase Token | Generic cloud document retrieval | **RISK**: Access control logic is hardcoded per collection. |
| `POST` | `/api/proposals/:id/accept` | Firebase Token | Accept swap proposal & lock escrow | Needs atomic database locking. |
| `POST` | `/api/proposals/:id/decline` | Firebase Token | Decline swap proposal | Operational. |
| `POST` | `/api/sessions/:id/complete` | Firebase Token | Complete swap session & release credits | Needs atomic database transaction. |
| `POST` | `/api/sessions/:id/cancel` | Firebase Token | Cancel session & refund escrow | Needs atomic database transaction. |
| `POST` | `/api/escrow/transfer` | Firebase Token | Direct escrow credit transfer | Endpoint returns 501 / disabled. |
| `POST` | `/api/webrtc/:roomId` | Firebase Token | WebRTC signaling offer/answer/ice | Operational. |

### C. Notification Subsystem
| Method | Route | Auth Required | Purpose | Status |
|---|---|---|---|---|
| `GET` | `/api/notifications` | Firebase Token | Fetch user notifications | Scoped to caller UID. |
| `PATCH` | `/api/notifications/:id/read` | Firebase Token | Mark notification read | Scoped to caller UID. |
| `POST` | `/api/notifications/mark-all-read` | Firebase Token | Mark all notifications read | Scoped to caller UID. |
| `DELETE` | `/api/notifications/:id` | Firebase Token | Delete notification | Scoped to caller UID. |
| `POST` | `/api/notifications/simulate-test-email`| Firebase Token | Test notification generator | Development tool. |

### D. AI Intelligence Endpoints
| Method | Route | Auth Required | Rate Limited | Purpose |
|---|---|---|---|---|
| `POST` | `/api/ai/assistant` | Firebase Token | Yes (`expensiveLimiter`) | AI tutor chat via Gemini |
| `POST` | `/api/ai/learning-roadmap`| Firebase Token | Yes (`expensiveLimiter`) | Curriculum roadmap generator |
| `POST` | `/api/ai/generate-proposal`| Firebase Token | Yes (`expensiveLimiter`) | Smart proposal generator |
| `POST` | `/api/ai/match` | Firebase Token | Yes (`expensiveLimiter`) | Semantic skill matchmaker |
| `POST` | `/api/deepseek-reasoning`| Firebase Token | Yes (`expensiveLimiter`) | DeepSeek reasoning model |

### E. Payment & Gateway Routes
| Method | Route | Auth Required | Status / Vulnerability |
|---|---|---|---|
| `POST` | `/api/v1/stripe/create-checkout-session` | Firebase Token | Operational (Stripe Checkout). |
| `POST` | `/api/v1/stripe/pay-card` | Firebase Token | **DEPRECATED**: Returns HTTP 410. Should be pruned. |
| `POST` | `/api/v1/stripe/webhook` | Stripe Signature | Operational (Validates HMAC signature). |
| `POST` | `/api/v1/mpesa/pay` | Firebase Token | Operational (Initiates STK Push). |
| `GET` | `/api/v1/mpesa/status/:checkoutRequestId`| Firebase Token | **VULNERABLE (BOLA)**: Missing caller ownership check. |
| `POST` | `/api/v1/mpesa/simulate-confirm` | Firebase Token | **VULNERABLE**: Simulator should be eliminated in production. |
| `POST` | `/api/v1/mpesa/callback` | Public (Safaricom) | Operational (Performs independent Safaricom query). |
| `POST` | `/api/v1/paypal/create-order` | Firebase Token | Operational. |
| `POST` | `/api/v1/paypal/capture-order` | Firebase Token | **VULNERABLE**: Contains sandbox credit bypass branch. |

---

## 2. API Architectural Gaps
1. **Missing Endpoints for Frontend Client**: `src/lib/api.ts` defines `api.getListings()`, `api.createListing()`, `api.getUsers()`, and `api.updateUser()`, but corresponding `/api/listings` and `/api/users` REST endpoints do not exist in `server.ts`.
2. **Standardization of Responses**: Endpoints mix `{ success: true, data }` and naked payloads `{ id, ... }`. Establish uniform API envelopes across all endpoints.
