/**
 * Server-authoritative credit-purchase fulfillment with Supabase Postgres.
 * PostgreSQL is the sole authoritative state machine for payments.
 */
import { supabase } from "../supabaseClient.js";

export type Gateway = "stripe" | "mpesa" | "paypal";

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

  const { error } = await supabase.from("pendingPayments").upsert(payload);
  if (error) {
    console.error("[payments] PostgreSQL pendingPayments upsert failed:", error.message);
    throw new Error(`Database error: Could not persist pending payment (${error.message})`);
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
    console.error(`[payments] Failed to query pendingPayments for ${paymentId}:`, err.message);
    return false;
  }

  if (!pending) {
    console.warn(`[payments] No pending payment found in PostgreSQL for ${paymentId}`);
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

  // Atomic fulfillment via PostgreSQL stored procedure.
  // The RPC acquires row locks (SELECT ... FOR UPDATE) on pendingPayments and users,
  // increments timeCredits, marks payment as 'completed', and logs the transaction ledger atomically.
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
      console.log(`[payments] Payment ${paymentId} fulfilled successfully via atomic RPC.`);
      await supabase
        .from("pendingPayments")
        .update({
          status: "completed",
          gatewayReceipt: gatewayReceipt || null,
          completedAt: new Date().toISOString(),
        })
        .eq("id", paymentId);
      return true;
    }

    console.warn(
      `[payments] RPC fulfill_pending_payment returned non-success (${JSON.stringify(rpcRes)}) for ${paymentId}. No credits granted.`
    );
    return false;
  } catch (rpcEx: any) {
    console.error(`[payments] Exception during RPC fulfill_pending_payment for ${paymentId}:`, rpcEx.message);
    // Strictly fail-closed
    return false;
  }
}

export async function markPendingPaymentFailed(
  gateway: Gateway,
  gatewayRef: string,
  reason?: string
): Promise<void> {
  const paymentId = `${gateway}_${gatewayRef}`;
  try {
    const { error } = await supabase
      .from("pendingPayments")
      .update({
        status: "failed",
        failReason: reason || null,
        failedAt: new Date().toISOString(),
      })
      .eq("id", paymentId);
    if (error) {
      console.error(`[payments] Failed to mark payment ${paymentId} as failed:`, error.message);
    }
  } catch (err: any) {
    console.error(`[payments] Error updating failed status for ${paymentId}:`, err.message);
  }
}

export async function getPendingPaymentStatus(
  gateway: Gateway,
  gatewayRef: string
): Promise<string | null> {
  const paymentId = `${gateway}_${gatewayRef}`;
  try {
    const { data, error } = await supabase
      .from("pendingPayments")
      .select("status")
      .eq("id", paymentId)
      .maybeSingle();
    if (!error && data?.status) return data.status;
  } catch (err: any) {
    console.error(`[payments] Error querying status for ${paymentId}:`, err.message);
  }
  return null;
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
    const { data, error } = await supabase
      .from("pendingPayments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    if (!error && data) return data as any;
  } catch (err: any) {
    console.error(`[payments] Error querying pending payment ${paymentId}:`, err.message);
  }
  return null;
}

