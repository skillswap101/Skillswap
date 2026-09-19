/**
 * Server-authoritative credit-purchase fulfillment with Supabase Postgres.
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
    console.error("[payments] createPendingPayment error:", error.message);
    throw new Error(`Failed to create pending payment: ${error.message}`);
  }
}

export async function fulfillPendingPayment(
  gateway: Gateway,
  gatewayRef: string,
  gatewayReceipt?: string
): Promise<boolean> {
  const paymentId = `${gateway}_${gatewayRef}`;
  const { data: pending, error } = await supabase
    .from("pendingPayments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !pending) {
    console.warn(`[payments] No pending payment found for ${paymentId}`);
    return false;
  }

  if (pending.status !== "pending") {
    // Already fulfilled or failed
    return false;
  }

  // Increment user's time credits
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", pending.userId)
    .single();

  const currentBalance = Number(user?.timeCredits) || 0;
  const hoursToAdd = Number(pending.creditHours) || 0;

  await supabase
    .from("users")
    .update({
      timeCredits: currentBalance + hoursToAdd,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", pending.userId);

  // Mark pending payment completed
  await supabase
    .from("pendingPayments")
    .update({
      status: "completed",
      gatewayReceipt: gatewayReceipt || null,
      completedAt: new Date().toISOString(),
    })
    .eq("id", paymentId);

  // Record in transactions ledger
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

  return true;
}

export async function markPendingPaymentFailed(
  gateway: Gateway,
  gatewayRef: string,
  reason?: string
): Promise<void> {
  const paymentId = `${gateway}_${gatewayRef}`;
  await supabase
    .from("pendingPayments")
    .update({
      status: "failed",
      failReason: reason || null,
      failedAt: new Date().toISOString(),
    })
    .eq("id", paymentId);
}

export async function getPendingPaymentStatus(
  gateway: Gateway,
  gatewayRef: string
): Promise<string | null> {
  const paymentId = `${gateway}_${gatewayRef}`;
  const { data } = await supabase
    .from("pendingPayments")
    .select("status")
    .eq("id", paymentId)
    .maybeSingle();
  return data?.status || null;
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
  const { data } = await supabase
    .from("pendingPayments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  return data as any;
}
