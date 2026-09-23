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
  } catch {
    // Fall back to in-memory record below
  }

  if (!pending) {
    pending = inMemoryPending.get(paymentId);
  }

  if (!pending) {
    console.warn(`[payments] No pending payment found for ${paymentId}`);
    return false;
  }

  if (pending.status !== "pending") {
    // Already fulfilled or failed
    return false;
  }

  // Update in-memory record status
  pending.status = "completed";
  pending.gatewayReceipt = gatewayReceipt || null;
  pending.completedAt = new Date().toISOString();
  inMemoryPending.set(paymentId, pending);

  // Attempt atomic fulfillment via PostgreSQL RPC first
  try {
    const { data: rpcSuccess, error: rpcErr } = await supabase.rpc("fulfill_pending_payment", {
      p_payment_id: paymentId,
      p_gateway_receipt: gatewayReceipt || null,
    });
    if (!rpcErr && rpcSuccess === true) {
      return true;
    }
  } catch (rpcEx: any) {
    console.warn("[payments] RPC fulfill_pending_payment notice (using fallback):", rpcEx.message);
  }

  // Fallback: Increment user's time credits in Supabase
  try {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", pending.userId)
      .maybeSingle();

    const currentBalance = Number(user?.timeCredits) || 0;
    const hoursToAdd = Number(pending.creditHours) || 0;

    await supabase
      .from("users")
      .update({
        timeCredits: currentBalance + hoursToAdd,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", pending.userId);
  } catch (e: any) {
    console.warn("[payments] Failed to update user credits in Supabase:", e.message);
  }

  // Attempt marking pending payment completed in Supabase
  try {
    await supabase
      .from("pendingPayments")
      .update({
        status: "completed",
        gatewayReceipt: gatewayReceipt || null,
        completedAt: new Date().toISOString(),
      })
      .eq("id", paymentId);
  } catch {}

  // Attempt recording in transactions ledger
  try {
    await supabase.from("transactions").insert({
      userId: pending.userId,
      gateway,
      gatewayRef,
      amount: pending.amount,
      credits: pending.creditHours,
      currency: pending.currency,
      status: "SUCCESS",
      createdAt: new Date().toISOString(),
    });
  } catch {}

  return true;
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
