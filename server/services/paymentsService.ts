/**
 * Server-authoritative credit-purchase fulfillment.
 *
 * The pattern for every gateway is the same: 1) create a `pendingPayments`
 * record BEFORE sending the user to the gateway, with the userId and
 * creditHours taken from the verified request (never trusted from a later
 * client call), 2) only the gateway's own signed webhook/callback - never
 * a client-callable "I paid, credit me" endpoint - is allowed to mark it
 * fulfilled and increment the user's Firestore balance. Fulfillment is a
 * transaction guarded by pendingPayment.status, so a duplicate/replayed
 * webhook delivery can't double-credit.
 *
 * This replaces:
 *  - StripeCheckoutModal.tsx's fully client-side fake charge (a setTimeout
 *    calling onAddCredits directly - no gateway involved at all)
 *  - UnifiedCheckoutModal.tsx calling a client "verify-session" /
 *    "simulate-pin" endpoint that doesn't even exist server-side, and on
 *    the rare working path (PayPal capture), crediting from the client's
 *    own onSuccess(amount) callback with an amount IT chose
 *  - mpesaCallback.js's webhook handler, which had a literal
 *    "// TODO: credit the user" and never actually did
 *  - the abandoned server/payments/*.ts dbStore simulator, whose
 *    verifyAndFulfillSession() granted 5 free credits to ANY session id
 *    it didn't recognize
 */
import { firestore } from "../../firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

export type Gateway = "stripe" | "mpesa" | "paypal";

export async function createPendingPayment(params: {
  gateway: Gateway;
  gatewayRef: string;
  userId: string;
  creditHours: number;
  amount: number;
  currency: string;
}): Promise<void> {
  if (!firestore) throw new Error("Firestore unavailable");
  await firestore.collection("pendingPayments").doc(`${params.gateway}_${params.gatewayRef}`).set({
    ...params,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Called ONLY from a verified gateway callback/webhook. Idempotent: a
 * second call for the same gatewayRef (retry, replay) is a silent no-op,
 * never a second credit.
 */
export async function fulfillPendingPayment(gateway: Gateway, gatewayRef: string, gatewayReceipt?: string): Promise<boolean> {
  if (!firestore) throw new Error("Firestore unavailable");
  const ref = firestore.collection("pendingPayments").doc(`${gateway}_${gatewayRef}`);

  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      console.warn(`[payments] No pending payment found for ${gateway}:${gatewayRef}`);
      return false;
    }
    const pending = snap.data()!;
    if (pending.status !== "pending") {
      // Already fulfilled (or failed) - don't credit twice.
      return false;
    }

    const userRef = firestore!.collection("users").doc(pending.userId);
    tx.update(userRef, { timeCredits: FieldValue.increment(Number(pending.creditHours) || 0) });
    tx.update(ref, {
      status: "completed",
      gatewayReceipt: gatewayReceipt || null,
      completedAt: FieldValue.serverTimestamp(),
    });
    tx.set(firestore!.collection("transactions").doc(), {
      gateway,
      userId: pending.userId,
      credits: pending.creditHours,
      amount: pending.amount,
      currency: pending.currency,
      status: "SUCCESS",
      gatewayRef,
      createdAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
}

export async function markPendingPaymentFailed(gateway: Gateway, gatewayRef: string, reason?: string): Promise<void> {
  if (!firestore) return;
  const ref = firestore.collection("pendingPayments").doc(`${gateway}_${gatewayRef}`);
  try {
    await ref.update({ status: "failed", failReason: reason || null, failedAt: FieldValue.serverTimestamp() });
  } catch {
    // doc may not exist - fine, nothing to mark
  }
}

/** Read-only status check safe to expose to the client for polling (never mutates anything). */
export async function getPendingPaymentStatus(gateway: Gateway, gatewayRef: string): Promise<string | null> {
  if (!firestore) return null;
  const snap = await firestore.collection("pendingPayments").doc(`${gateway}_${gatewayRef}`).get();
  if (!snap.exists) return null;
  return (snap.data() as any).status;
}

/**
 * Full read of a pending payment record - used server-side only, right
 * before a gateway capture/confirmation, to verify the caller actually
 * owns this payment and that what's about to be captured matches what
 * was actually promised (amount, currency) before any credit is issued.
 */
export async function getPendingPayment(gateway: Gateway, gatewayRef: string): Promise<{
  userId: string;
  creditHours: number;
  amount: number;
  currency: string;
  status: string;
} | null> {
  if (!firestore) return null;
  const snap = await firestore.collection("pendingPayments").doc(`${gateway}_${gatewayRef}`).get();
  if (!snap.exists) return null;
  return snap.data() as any;
}
