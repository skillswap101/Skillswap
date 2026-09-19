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
    const { data: learner, error: learnerErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", learnerId)
      .single();

    if (learnerErr || !learner) {
      throw new CreditsError("Learner profile not found", 404);
    }

    const learnerBalance = Number(learner.timeCredits) || 0;
    if (learnerBalance < amount) {
      throw new CreditsError("Learner does not have enough time credits for this swap", 402);
    }

    // Deduct from timeCredits, add to escrowLockedCredits
    await supabase
      .from("users")
      .update({
        timeCredits: learnerBalance - amount,
        escrowLockedCredits: (Number(learner.escrowLockedCredits) || 0) + amount,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", learnerId);

    // Create escrow transaction
    const escrowPayload = {
      proposalId,
      learnerId,
      mentorId,
      amount,
      currency: "credits",
      status: "LOCKED",
      lockedAt: new Date().toISOString(),
    };

    const { data: escrowRow, error: escrowErr } = await supabase
      .from("escrowTransactions")
      .insert(escrowPayload)
      .select("id")
      .single();

    if (!escrowErr && escrowRow) {
      escrowId = escrowRow.id;
    }
  }

  // Update proposal status
  await supabase
    .from("proposals")
    .update({ status: "accepted", updatedAt: new Date().toISOString() })
    .eq("id", proposalId);

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

  // Release escrow credits if locked
  if (session.escrowId) {
    const { data: escrow } = await supabase
      .from("escrowTransactions")
      .select("*")
      .eq("id", session.escrowId)
      .single();

    if (escrow && escrow.status === "LOCKED") {
      const amount = Number(escrow.amount) || 0;

      // Credit mentor
      const { data: mentor } = await supabase.from("users").select("*").eq("id", escrow.mentorId).single();
      if (mentor) {
        await supabase
          .from("users")
          .update({
            timeCredits: (Number(mentor.timeCredits) || 0) + amount,
            hoursTaught: (Number(mentor.hoursTaught) || 0) + 1,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", escrow.mentorId);
      }

      // Deduct from learner's escrowLockedCredits
      const { data: learner } = await supabase.from("users").select("*").eq("id", escrow.learnerId).single();
      if (learner) {
        await supabase
          .from("users")
          .update({
            escrowLockedCredits: Math.max(0, (Number(learner.escrowLockedCredits) || 0) - amount),
            hoursLearned: (Number(learner.hoursLearned) || 0) + 1,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", escrow.learnerId);
      }

      // Mark escrow released
      await supabase
        .from("escrowTransactions")
        .update({ status: "RELEASED", releasedAt: new Date().toISOString() })
        .eq("id", session.escrowId);
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

  // Refund locked escrow back to learner
  if (session.escrowId) {
    const { data: escrow } = await supabase
      .from("escrowTransactions")
      .select("*")
      .eq("id", session.escrowId)
      .single();

    if (escrow && escrow.status === "LOCKED") {
      const amount = Number(escrow.amount) || 0;
      const { data: learner } = await supabase.from("users").select("*").eq("id", escrow.learnerId).single();
      if (learner) {
        await supabase
          .from("users")
          .update({
            timeCredits: (Number(learner.timeCredits) || 0) + amount,
            escrowLockedCredits: Math.max(0, (Number(learner.escrowLockedCredits) || 0) - amount),
            updatedAt: new Date().toISOString(),
          })
          .eq("id", escrow.learnerId);
      }

      await supabase
        .from("escrowTransactions")
        .update({ status: "REFUNDED", refundedAt: new Date().toISOString() })
        .eq("id", session.escrowId);
    }
  }

  await supabase
    .from("sessions")
    .update({ status: "cancelled", cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .eq("id", sessionId);
}
