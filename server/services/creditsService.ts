/**
 * Server-Authoritative Credit and Escrow Service using Supabase Postgres.
 */
import { supabase } from "../supabaseClient.js";

export class CreditsError extends Error {
  public status: number;
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "CreditsError";
    this.status = statusCode;
  }
}

export interface AcceptProposalResult {
  sessionId: string;
  escrowId: string | null;
}

export async function acceptProposal(
  proposalId: string,
  callerUid: string
): Promise<AcceptProposalResult> {
  const { data: proposal, error: propErr } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (propErr || !proposal) {
    throw new CreditsError("Proposal not found", 404);
  }

  if (proposal.status !== "pending") {
    throw new CreditsError(`Proposal is already ${proposal.status}`, 409);
  }

  if (proposal.recipientId !== callerUid) {
    throw new CreditsError("Only the proposal recipient can accept it", 403);
  }

  const learnerId: string = proposal.senderId;
  const mentorId: string = proposal.recipientId;
  const amount: number = proposal.useTimeCredits ? Number(proposal.timeCreditsAmount) || 0 : 0;
  let escrowId: string | null = null;

  if (amount > 0) {
    // Execute atomic PostgreSQL RPC with row-level locks
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("lock_escrow_credits", {
      p_proposal_id: proposalId,
      p_learner_id: learnerId,
      p_mentor_id: mentorId,
      p_amount: amount,
    });

    if (rpcErr) {
      console.error("[creditsService] lock_escrow_credits RPC error:", rpcErr);
      throw new CreditsError("Failed to lock escrow credits in database", 500);
    }

    if (!rpcRes?.success) {
      if (rpcRes?.error === "INSUFFICIENT_CREDITS") {
        throw new CreditsError("Learner does not have enough time credits for this swap", 402);
      }
      throw new CreditsError(rpcRes?.message || "Failed to lock credits", 400);
    }

    escrowId = rpcRes.escrowId || null;
  } else {
    // Zero credit amount swap - mark accepted directly
    await supabase
      .from("proposals")
      .update({ status: "accepted", updatedAt: new Date().toISOString() })
      .eq("id", proposalId);
  }

  // Create session
  const sessionPayload = {
    swapProposalId: proposalId,
    title: `${proposal.requestedSkillTitle || 'Skill'} ↔ ${proposal.offeredSkillTitle || 'Skill'}`,
    mentorId,
    mentorName: proposal.recipientName || "Mentor",
    mentorAvatar: proposal.recipientAvatar || "",
    learnerId,
    learnerName: proposal.senderName || "Learner",
    learnerAvatar: proposal.senderAvatar || "",
    participantIds: [mentorId, learnerId],
    skillTitle: proposal.requestedSkillTitle || "Skill Swap Session",
    date: proposal.proposedDate || new Date().toISOString().split("T")[0],
    time: proposal.proposedTime || "12:00",
    durationMinutes: proposal.durationMinutes || 60,
    status: "scheduled",
    meetingUrl: `https://skillswap.app/room/${proposalId}`,
    escrowId,
    timeCreditsEscrowed: amount,
    agenda: [
      "00-15 mins: Introductions & learning objectives",
      "15-30 mins: Core skill breakdown & demonstration",
      "30-45 mins: Hands-on interactive practice",
      "45-60 mins: Review, Q&A, and practice homework",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data: sessionRow, error: sessionErr } = await supabase
    .from("sessions")
    .insert(sessionPayload)
    .select("id")
    .single();

  const createdSessionId = sessionRow?.id || `sess_${Date.now()}`;
  return { sessionId: createdSessionId, escrowId };
}

export async function declineProposal(proposalId: string, callerUid: string): Promise<void> {
  const { data: proposal, error: propErr } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (propErr || !proposal) {
    throw new CreditsError("Proposal not found", 404);
  }

  if (proposal.status !== "pending") {
    throw new CreditsError(`Proposal is already ${proposal.status}`, 409);
  }

  if (proposal.recipientId !== callerUid) {
    throw new CreditsError("Only the proposal recipient can decline it", 403);
  }

  await supabase
    .from("proposals")
    .update({ status: "declined", updatedAt: new Date().toISOString() })
    .eq("id", proposalId);
}

export async function completeSession(
  sessionId: string,
  callerUid: string,
  rating?: number,
  feedback?: string
): Promise<void> {
  const { data: session, error: sessErr } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessErr || !session) {
    throw new CreditsError("Session not found", 404);
  }

  if (session.mentorId !== callerUid && session.learnerId !== callerUid) {
    throw new CreditsError("Not a participant in this session", 403);
  }

  if (session.status === "completed") {
    return; // Idempotent
  }

  if (session.status === "cancelled") {
    throw new CreditsError("Cannot complete a cancelled session", 409);
  }

  // Release escrow credits atomically if locked
  if (session.escrowId) {
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("release_escrow_credits", {
      p_session_id: sessionId,
      p_escrow_id: session.escrowId,
    });

    if (rpcErr) {
      console.error("[creditsService] release_escrow_credits RPC error:", rpcErr);
      throw new CreditsError("Failed to release escrow credits in database", 500);
    }

    if (rpcRes && !rpcRes.success) {
      throw new CreditsError(rpcRes.message || "Failed to release escrow", 400);
    }
  }

  // Mark session completed
  await supabase
    .from("sessions")
    .update({
      status: "completed",
      completedAt: new Date().toISOString(),
      ...(rating !== undefined ? { learnerRating: rating } : {}),
      ...(feedback !== undefined ? { learnerFeedback: feedback } : {}),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

export async function cancelSession(sessionId: string, callerUid: string): Promise<void> {
  const { data: session, error: sessErr } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessErr || !session) {
    throw new CreditsError("Session not found", 404);
  }

  if (session.mentorId !== callerUid && session.learnerId !== callerUid) {
    throw new CreditsError("Not a participant in this session", 403);
  }

  if (session.status === "completed" || session.status === "cancelled") {
    throw new CreditsError(`Session is already ${session.status}`, 409);
  }

  // Refund locked escrow atomically back to learner
  if (session.escrowId) {
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("refund_escrow_credits", {
      p_escrow_id: session.escrowId,
      p_reason: `Session cancelled by user ${callerUid}`,
    });

    if (rpcErr) {
      console.error("[creditsService] refund_escrow_credits RPC error:", rpcErr);
      throw new CreditsError("Failed to refund escrow credits in database", 500);
    }

    if (rpcRes && !rpcRes.success) {
      throw new CreditsError(rpcRes.message || "Failed to refund escrow", 400);
    }
  }

  await supabase
    .from("sessions")
    .update({ status: "cancelled", cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .eq("id", sessionId);
}
