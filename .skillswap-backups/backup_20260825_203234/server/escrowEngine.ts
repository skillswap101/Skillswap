import { dbStore } from './dbStore';
import { SwapContract, EscrowRecord } from '../src/types';
import { notificationService } from './notificationService';

export class EscrowEngine {
  /**
   * Locks time credits from requester into escrow when swap is accepted
   */
  public lockEscrow(swapId: string, requesterId: string, providerId: string, amountCredits: number): EscrowRecord {
    const requester = dbStore.getUser(requesterId);
    const provider = dbStore.getUser(providerId);

    if (!requester) throw new Error(`Requester ${requesterId} not found`);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    if (requester.timeCredits < amountCredits) {
      throw new Error(
        `Insufficient time credits. Required: ${amountCredits} hrs, Available: ${requester.timeCredits} hrs. Please top up your wallet.`
      );
    }

    // Deduct available balance and add to locked escrow
    const newRequesterBalance = Number((requester.timeCredits - amountCredits).toFixed(2));
    const newLockedBalance = Number(((requester.escrowLockedCredits || 0) + amountCredits).toFixed(2));

    dbStore.updateUser(requesterId, {
      timeCredits: newRequesterBalance,
      escrowLockedCredits: newLockedBalance,
    });

    // Create Escrow Record
    const escrow = dbStore.createEscrow({
      swapId,
      payerId: requesterId,
      recipientId: providerId,
      amountCredits,
      status: 'locked',
    });

    // Update Swap Contract
    const updatedSwap = dbStore.updateSwap(swapId, {
      status: 'accepted',
      escrowId: escrow.id,
    });

    // Journal Entry
    dbStore.addTransaction({
      userId: requesterId,
      type: 'escrow_lock',
      amount: -amountCredits,
      balanceAfter: newRequesterBalance,
      description: `Locked ${amountCredits} hrs in Escrow for swap with ${provider.name}`,
      referenceId: escrow.id,
    });

    // Send Simulated Email Notifications
    notificationService.onEscrowLocked(updatedSwap, escrow);

    return escrow;
  }

  /**
   * Releases locked credits to provider upon session completion sign-off
   */
  public releaseEscrow(swapId: string, authorizedByUserId: string): { escrow: EscrowRecord; swap: SwapContract } {
    const swap = dbStore.getSwap(swapId);
    if (!swap) throw new Error(`Swap ${swapId} not found`);

    const escrowId = swap.escrowId;
    if (!escrowId) throw new Error(`No escrow linked to swap ${swapId}`);

    const escrow = dbStore.getEscrow(escrowId);
    if (!escrow) throw new Error(`Escrow record ${escrowId} not found`);

    if (escrow.status !== 'locked') {
      throw new Error(`Escrow is currently in '${escrow.status}' state and cannot be released.`);
    }

    const payer = dbStore.getUser(escrow.payerId);
    const recipient = dbStore.getUser(escrow.recipientId);

    if (!payer || !recipient) {
      throw new Error('Payer or Recipient profile not found');
    }

    // Release from Payer's locked bucket
    const updatedLocked = Math.max(0, Number(((payer.escrowLockedCredits || 0) - escrow.amountCredits).toFixed(2)));
    dbStore.updateUser(payer.id, {
      escrowLockedCredits: updatedLocked,
      completedSwaps: (payer.completedSwaps || 0) + 1,
    });

    // Credit Recipient's available balance
    const updatedRecipientCredits = Number((recipient.timeCredits + escrow.amountCredits).toFixed(2));
    dbStore.updateUser(recipient.id, {
      timeCredits: updatedRecipientCredits,
      completedSwaps: (recipient.completedSwaps || 0) + 1,
    });

    // Update Escrow Record
    const updatedEscrow = dbStore.updateEscrow(escrow.id, {
      status: 'released',
      releasedAt: new Date().toISOString(),
    });

    // Update Swap Contract
    const updatedSwap = dbStore.updateSwap(swap.id, {
      status: 'settled',
    });

    // Journal Entries
    dbStore.addTransaction({
      userId: payer.id,
      type: 'escrow_release',
      amount: 0,
      balanceAfter: payer.timeCredits,
      description: `Escrow released (${escrow.amountCredits} hrs) to ${recipient.name} after successful session completion.`,
      referenceId: escrow.id,
    });

    dbStore.addTransaction({
      userId: recipient.id,
      type: 'swap_earned',
      amount: escrow.amountCredits,
      balanceAfter: updatedRecipientCredits,
      description: `Earned ${escrow.amountCredits} Time Credits for teaching ${swap.skillTitle} to ${payer.name}`,
      referenceId: escrow.id,
    });

    // Send Simulated Email Notifications
    notificationService.onEscrowSettled(updatedSwap, updatedEscrow);

    return { escrow: updatedEscrow, swap: updatedSwap };
  }

  /**
   * Refunds locked escrow credits back to requester
   */
  public refundEscrow(swapId: string, reason: string, authorizedByUserId: string): { escrow: EscrowRecord; swap: SwapContract } {
    const swap = dbStore.getSwap(swapId);
    if (!swap) throw new Error(`Swap ${swapId} not found`);

    const escrowId = swap.escrowId;
    if (!escrowId) throw new Error(`No escrow linked to swap ${swapId}`);

    const escrow = dbStore.getEscrow(escrowId);
    if (!escrow) throw new Error(`Escrow record ${escrowId} not found`);

    if (escrow.status !== 'locked' && escrow.status !== 'disputed') {
      throw new Error(`Escrow in state ${escrow.status} cannot be refunded.`);
    }

    const payer = dbStore.getUser(escrow.payerId);
    if (!payer) throw new Error('Payer profile not found');

    // Refund locked credits back to available balance
    const updatedLocked = Math.max(0, Number(((payer.escrowLockedCredits || 0) - escrow.amountCredits).toFixed(2)));
    const updatedAvailable = Number((payer.timeCredits + escrow.amountCredits).toFixed(2));

    dbStore.updateUser(payer.id, {
      timeCredits: updatedAvailable,
      escrowLockedCredits: updatedLocked,
    });

    const updatedEscrow = dbStore.updateEscrow(escrow.id, {
      status: 'refunded',
      refundedAt: new Date().toISOString(),
      disputeReason: reason,
    });

    const updatedSwap = dbStore.updateSwap(swap.id, {
      status: 'cancelled',
      sessionNotes: `Cancelled/Refunded: ${reason}`,
    });

    dbStore.addTransaction({
      userId: payer.id,
      type: 'escrow_refund',
      amount: escrow.amountCredits,
      balanceAfter: updatedAvailable,
      description: `Escrow refunded (+${escrow.amountCredits} hrs) for cancelled swap. Reason: ${reason}`,
      referenceId: escrow.id,
    });

    return { escrow: updatedEscrow, swap: updatedSwap };
  }

  /**
   * Disputes an active swap escrow
   */
  public disputeEscrow(swapId: string, disputerId: string, reason: string): { escrow: EscrowRecord; swap: SwapContract } {
    const swap = dbStore.getSwap(swapId);
    if (!swap) throw new Error(`Swap ${swapId} not found`);

    const escrow = dbStore.getEscrow(swap.escrowId || '');
    if (!escrow) throw new Error('No escrow found');

    const updatedEscrow = dbStore.updateEscrow(escrow.id, {
      status: 'disputed',
      disputeReason: reason,
    });

    const updatedSwap = dbStore.updateSwap(swap.id, {
      status: 'disputed',
      sessionNotes: `Dispute opened by ${disputerId}: ${reason}`,
    });

    notificationService.onDisputeOpened(updatedSwap, disputerId, reason);

    return { escrow: updatedEscrow, swap: updatedSwap };
  }

  /**
   * Resolves a disputed escrow
   */
  public resolveDispute(
    swapId: string,
    resolution: 'refund_requester' | 'release_provider' | 'split_50_50',
    notes: string
  ) {
    if (resolution === 'refund_requester') {
      const res = this.refundEscrow(swapId, `Dispute Resolution: ${notes}`, 'admin_mediator');
      notificationService.onDisputeResolved(res.swap, 'Full Refund to Learner', notes);
      return res;
    }
    if (resolution === 'release_provider') {
      const res = this.releaseEscrow(swapId, 'admin_mediator');
      notificationService.onDisputeResolved(res.swap, 'Full Release to Mentor', notes);
      return res;
    }

    // Split 50/50
    const swap = dbStore.getSwap(swapId);
    const escrow = dbStore.getEscrow(swap?.escrowId || '');
    if (!swap || !escrow) throw new Error('Swap or escrow not found');

    const half = Number((escrow.amountCredits / 2).toFixed(2));
    const payer = dbStore.getUser(escrow.payerId);
    const recipient = dbStore.getUser(escrow.recipientId);

    if (payer && recipient) {
      const payerLocked = Math.max(0, Number(((payer.escrowLockedCredits || 0) - escrow.amountCredits).toFixed(2)));
      const payerAvailable = Number((payer.timeCredits + half).toFixed(2));
      dbStore.updateUser(payer.id, {
        timeCredits: payerAvailable,
        escrowLockedCredits: payerLocked,
      });

      const recipientAvailable = Number((recipient.timeCredits + (escrow.amountCredits - half)).toFixed(2));
      dbStore.updateUser(recipient.id, {
        timeCredits: recipientAvailable,
      });

      const updatedEscrow = dbStore.updateEscrow(escrow.id, {
        status: 'released',
        releasedAt: new Date().toISOString(),
        disputeReason: `50/50 Split Resolution: ${notes}`,
      });

      const updatedSwap = dbStore.updateSwap(swap.id, {
        status: 'settled',
        sessionNotes: `Dispute settled with 50/50 split: ${notes}`,
      });

      notificationService.onDisputeResolved(updatedSwap, '50/50 Split Mediation Ruling', notes);

      return { escrow: updatedEscrow, swap: updatedSwap };
    }
    throw new Error('Users not found for split resolution');
  }
}

export const escrowEngine = new EscrowEngine();

