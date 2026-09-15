# SkillSwap 5.0 — Production Go-Live Checklist

## P0 — Security
- [ ] Rotate/revoke EVERY credential that was exposed in any uploaded/shared artifact.
- [ ] Replace `.env.example` with placeholders only.
- [ ] Ensure `serviceaccountkey.json` is absent from source, build output and deployment image.
- [ ] Store production secrets in a secret manager/environment, never in Git.

## Firebase
- [ ] Verify Firebase Auth providers.
- [ ] Verify authorized domains.
- [ ] Deploy Firestore rules.
- [ ] Verify Firestore indexes.
- [ ] Review/deploy Firebase Storage rules if Storage is used.
- [ ] Consider Firebase App Check.

## Server
- [ ] `NODE_ENV=production`
- [ ] `PORT` configured by environment.
- [ ] `ALLOWED_ORIGINS` contains only real HTTPS origins.
- [ ] `FRONTEND_URL` is the real production URL.
- [ ] Admin SDK uses managed environment secrets.
- [ ] Disable test/diagnostic routes.

## Payments
- [ ] Stripe live credentials and verified HTTPS webhook.
- [ ] M-Pesa production credentials and stable callback URL.
- [ ] PayPal live credentials/environment.
- [ ] Verify duplicate callback/webhook idempotency.
- [ ] Verify credit ledger behavior under concurrent requests.
- [ ] Verify refund/dispute policy.

## Application
- [ ] Remove fake OTP/demo login.
- [ ] Remove fake/demo certificates.
- [ ] Remove simulated notifications.
- [ ] Remove/rewrite stale API clients after call-site audit.
- [ ] Validate all server request bodies.
- [ ] Validate credit amounts, ratings and feedback lengths.
- [ ] Add per-user AI quotas.

## WebRTC
- [ ] Configure TURN servers.
- [ ] Verify participant authorization.
- [ ] Add room expiry/cleanup.
- [ ] Test mobile/NAT connectivity.

## Operations
- [ ] Automated tests pass.
- [ ] Structured logs.
- [ ] Error tracking.
- [ ] Metrics/alerts.
- [ ] Firestore backup/restore plan.
- [ ] HTTPS reverse proxy/load balancer.
- [ ] Staging smoke test passes.
