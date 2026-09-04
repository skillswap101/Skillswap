/**
 * Server-authoritative credit / escrow engine.
 *
 * Nothing in this file is reachable without a verified Firebase ID token
 * (enforced by the routes in server.ts that call these functions). Every
 * balance change happens inside a single Firestore transaction, so a
 * partial failure can't leave credits half-moved, and every mutating
 * operation checks the CURRENT server-side status of the document before
 * acting - so a replayed/duplicate request (double-click, retry, replay)
 * can't double-credit, double-release, or double-refund.
 *
 * Previously: the browser incremented `currentUser.timeCredits` directly
 * in React state (App.tsx `handleCompleteSession`) and Stripe/M-Pesa/PayPal
 * checkout modals called `onAddCredits(amount)` with a client-supplied
 * amount and zero server verification. Both of those paths are gone -
 * credits now only ever change here.
 */
import { firestore } from "../../firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

export class CreditsError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface AcceptProposalResult {
  sessionId: string;
  escrowId: string | null;
}

/**
 * Accept a swap proposal: locks the learner's credits into escrow (if the
 * proposal uses time credits) and creates the session. Only the proposal's
 * recipient (the mentor being asked to teach) can accept it.
 */
export async function acceptProposal(proposalId: string, callerUid: string): Promise<AcceptProposalResult> {
  if (!firestore) throw new CreditsError("Firestore unavailable", 503);

  const proposalRef = firestore.collection("proposals").doc(proposalId);
  const sessionRef = firestore.collection("sessions").doc();
  const escrowRef = firestore.collection("escrowTransactions").doc();

  return firestore.runTransaction(async (tx) => {
    const proposalSnap = await tx.get(proposalRef);
    if (!proposalSnap.exists) throw new CreditsError("Proposal not found", 404);
    const proposal = proposalSnap.data()!;

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
      const learnerRef = firestore!.collection("users").doc(learnerId);
      const learnerSnap = await tx.get(learnerRef);
      if (!learnerSnap.exists) throw new CreditsError("Learner profile not found", 404);
      const learnerBalance = Number(learnerSnap.data()!.timeCredits) || 0;

      if (learnerBalance < amount) {
        throw new CreditsError("Learner does not have enough time credits for this swap", 402);
      }

      tx.update(learnerRef, {
        timeCredits: FieldValue.increment(-amount),
        escrowLockedCredits: FieldValue.increment(amount),
      });

      tx.set(escrowRef, {
        id: escrowRef.id,
        proposalId,
        learnerId,
        mentorId,
        amount,
        currency: "credits",
        status: "LOCKED",
        lockedAt: FieldValue.serverTimestamp(),
      });

      escrowId = escrowRef.id;
    }

    tx.update(proposalRef, { status: "accepted", updatedAt: FieldValue.serverTimestamp() });

    tx.set(sessionRef, {
      id: sessionRef.id,
      swapProposalId: proposalId,
      title: `${proposal.requestedSkillTitle} \u2194 ${proposal.offeredSkillTitle}`,
      mentorId,
      mentorName: proposal.recipientName,
      mentorAvatar: proposal.recipientAvatar,
      learnerId,
      learnerName: proposal.senderName,
      learnerAvatar: proposal.senderAvatar,
      participantIds: [mentorId, learnerId],
      skillTitle: proposal.requestedSkillTitle,
      date: proposal.proposedDate,
      time: proposal.proposedTime,
      durationMinutes: proposal.durationMinutes,
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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { sessionId: sessionRef.id, escrowId };
  });
}

/** Decline a pending proposal. No credits ever moved yet at this stage, so this is a pure status change. */
export async function declineProposal(proposalId: string, callerUid: string): Promise<void> {
  if (!firestore) throw new CreditsError("Firestore unavailable", 503);
  const proposalRef = firestore.collection("proposals").doc(proposalId);

  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(proposalRef);
    if (!snap.exists) throw new CreditsError("Proposal not found", 404);
    const proposal = snap.data()!;
    if (proposal.status !== "pending") {
      throw new CreditsError(`Proposal is already ${proposal.status}`, 409);
    }
    if (proposal.recipientId !== callerUid) {
      throw new CreditsError("Only the proposal recipient can decline it", 403);
    }
    tx.update(proposalRef, { status: "declined", updatedAt: FieldValue.serverTimestamp() });
  });
}

/**
 * Complete a session: releases escrowed credits to the mentor and marks the
 * session completed. Either participant can trigger it (matches the
 * existing UI - a "mark complete" button). Guarded so it can only ever run
 * once per session no matter how many times the request is retried.
 */
export async function completeSession(
  sessionId: string,
  callerUid: string,
  rating?: number,
  feedback?: string
): Promise<void> {
  if (!firestore) throw new CreditsError("Firestore unavailable", 503);
  const sessionRef = firestore.collection("sessions").doc(sessionId);

  await firestore.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    if (!sessionSnap.exists) throw new CreditsError("Session not found", 404);
    const session = sessionSnap.data()!;

    if (session.mentorId !== callerUid && session.learnerId !== callerUid) {
      throw new CreditsError("Not a participant in this session", 403);
    }
    if (session.status === "completed") {
      // Idempotent: a duplicate/retried request for an already-completed
      // session is a no-op, not an error and definitely not a double-credit.
      return;
    }
    if (session.status === "cancelled") {
      throw new CreditsError("Cannot complete a cancelled session", 409);
    }

    if (session.escrowId) {
      const escrowRef = firestore!.collection("escrowTransactions").doc(session.escrowId);
      const escrowSnap = await tx.get(escrowRef);
      if (escrowSnap.exists && escrowSnap.data()!.status === "LOCKED") {
        const escrow = escrowSnap.data()!;
        const amount = Number(escrow.amount) || 0;
        const mentorRef = firestore!.collection("users").doc(escrow.mentorId);
        const learnerRef = firestore!.collection("users").doc(escrow.learnerId);

        tx.update(mentorRef, {
          timeCredits: FieldValue.increment(amount),
          hoursTaught: FieldValue.increment(1),
        });
        tx.update(learnerRef, {
          escrowLockedCredits: FieldValue.increment(-amount),
          hoursLearned: FieldValue.increment(1),
        });
        tx.update(escrowRef, { status: "RELEASED", releasedAt: FieldValue.serverTimestamp() });
      }
    }

    tx.update(sessionRef, {
      status: "completed",
      completedAt: FieldValue.serverTimestamp(),
      ...(rating !== undefined ? { learnerRating: rating } : {}),
      ...(feedback !== undefined ? { learnerFeedback: feedback } : {}),
    });
  });
}

/** Cancel a scheduled session and refund any locked escrow back to the learner. */
export async function cancelSession(sessionId: string, callerUid: string): Promise<void> {
  if (!firestore) throw new CreditsError("Firestore unavailable", 503);
  const sessionRef = firestore.collection("sessions").doc(sessionId);

  await firestore.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    if (!sessionSnap.exists) throw new CreditsError("Session not found", 404);
    const session = sessionSnap.data()!;

    if (session.mentorId !== callerUid && session.learnerId !== callerUid) {
      throw new CreditsError("Not a participant in this session", 403);
    }
    if (session.status === "completed" || session.status === "cancelled") {
      throw new CreditsError(`Session is already ${session.status}`, 409);
    }

    if (session.escrowId) {
      const escrowRef = firestore!.collection("escrowTransactions").doc(session.escrowId);
      const escrowSnap = await tx.get(escrowRef);
      if (escrowSnap.exists && escrowSnap.data()!.status === "LOCKED") {
        const escrow = escrowSnap.data()!;
        const amount = Number(escrow.amount) || 0;
        const learnerRef = firestore!.collection("users").doc(escrow.learnerId);
        tx.update(learnerRef, {
          timeCredits: FieldValue.increment(amount),
          escrowLockedCredits: FieldValue.increment(-amount),
        });
        tx.update(escrowRef, { status: "REFUNDED", refundedAt: FieldValue.serverTimestamp() });
      }
    }

    tx.update(sessionRef, { status: "cancelled", cancelledAt: FieldValue.serverTimestamp() });
  });
}
