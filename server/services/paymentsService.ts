/**
 * Server-authoritative credit-purchase fulfillment with Supabase Postgres.
 */
import { supabase } from "../supabaseClient.js";

export type Gateway = "stripe" | "mpesa" | "paypal";

const inMemoryPending = new Map<string, any>();

export async function createPendingPayment(params: {
  gateway: Gateway;
  gatewayRef: string;
  userId: string;
  creditHours: number;
  amount: number;
  currency: string;
}): Promise<void> {
  const paymentId = `${params.gateway}_${params.gatewayRef}`;
  const payload = {
    id: paymentId,
    ...params,
    status: "pending",
    createdAt: new Date().toISOString(),
    raw_data: params,
  };

  inMemoryPending.set(paymentId, payload);

  try {
    const { error } = await supabase.from("pendingPayments").upsert(payload);
    if (error) {
      console.warn("[payments] Supabase pendingPayments notice (using in-memory fallback):", error.message);
    }
  } catch (err: any) {
    console.warn("[payments] Supabase connection error for pendingPayments:", err.message);
  }
}

export async function fulfillPendingPayment(
  gateway: Gateway,
  gatewayRef: string,
  gatewayReceipt?: string
): Promise<boolean> {
  const paymentId = `${gateway}_${gatewayRef}`;
  let pending: any = null;

  try {
    const { data, error } = await supabase
      .from("pendingPayments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    if (!error && data) {
      pending = data;
    }
  } catch (err: any) {
    console.warn(`[payments] Failed to query pendingPayments for ${paymentId}:`, err.message);
  }

  if (!pending) {
    pending = inMemoryPending.get(paymentId);
  }

  if (!pending) {
    console.warn(`[payments] No pending payment found for ${paymentId}`);
    return false;
  }

  if (pending.status === "completed") {
    console.log(`[payments] Payment ${paymentId} is already completed; skipping redundant fulfillment.`);
    return false;
  }

  if (pending.status !== "pending") {
    console.warn(`[payments] Payment ${paymentId} has status '${pending.status}'; cannot fulfill.`);
    return false;
  }

  // Attempt atomic fulfillment via PostgreSQL RPC.
  // The RPC acquires row locks (SELECT ... FOR UPDATE) on pendingPayments and users,
  // increments timeCredits, marks payment as 'completed', and logs the transaction ledger atomically.
  // Note: We deliberately DO NOT mutate in-memory or database records prior to RPC completion.
  try {
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("fulfill_pending_payment", {
      p_payment_id: paymentId,
      p_gateway_receipt: gatewayReceipt || null,
    });

    if (rpcErr) {
      console.error(
        `[payments] RPC fulfill_pending_payment failed for ${paymentId}:`,
        rpcErr.message,
        rpcErr.details || ""
      );
      // Strictly fail-closed: do not grant credits or mark payment completed
      return false;
    }

    if (rpcRes === true || (typeof rpcRes === "object" && rpcRes?.success === true)) {
      // ONLY update in-memory record status AFTER successful atomic fulfillment in the database
      pending.status = "completed";
      pending.gatewayReceipt = gatewayReceipt || null;
      pending.completedAt = new Date().toISOString();
      inMemoryPending.set(paymentId, pending);

      console.log(`[payments] Payment ${paymentId} fulfilled successfully via atomic RPC.`);
      return true;
    }

    console.warn(
      `[payments] RPC fulfill_pending_payment returned non-success (${JSON.stringify(rpcRes)}) for ${paymentId}. No credits granted.`
    );
    return false;
  } catch (rpcEx: any) {
    console.error(`[payments] Exception during RPC fulfill_pending_payment for ${paymentId}:`, rpcEx.message);
    // Strictly fail-closed: never fall back to non-atomic balance updates
    return false;
  }
}

export async function markPendingPaymentFailed(
  gateway: Gateway,
  gatewayRef: string,
  reason?: string
): Promise<void> {
  const paymentId = `${gateway}_${gatewayRef}`;
  const mem = inMemoryPending.get(paymentId);
  if (mem) {
    mem.status = "failed";
    mem.failReason = reason || null;
    mem.failedAt = new Date().toISOString();
    inMemoryPending.set(paymentId, mem);
  }

  try {
    await supabase
      .from("pendingPayments")
      .update({
        status: "failed",
        failReason: reason || null,
        failedAt: new Date().toISOString(),
      })
      .eq("id", paymentId);
  } catch {}
}

export async function getPendingPaymentStatus(
  gateway: Gateway,
  gatewayRef: string
): Promise<string | null> {
  const paymentId = `${gateway}_${gatewayRef}`;
  try {
    const { data } = await supabase
      .from("pendingPayments")
      .select("status")
      .eq("id", paymentId)
      .maybeSingle();
    if (data?.status) return data.status;
  } catch {}
  return inMemoryPending.get(paymentId)?.status || null;
}

export async function getPendingPayment(
  gateway: Gateway,
  gatewayRef: string
): Promise<{
  userId: string;
  creditHours: number;
  amount: number;
  currency: string;
  status: string;
} | null> {
  const paymentId = `${gateway}_${gatewayRef}`;
  try {
    const { data } = await supabase
      .from("pendingPayments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    if (data) return data as any;
  } catch {}
  return inMemoryPending.get(paymentId) || null;
}
