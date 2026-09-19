import { api } from './api';
import { SwapContract, EscrowRecord } from '../types';

export class EscrowManager {
  /**
   * Accepts a swap proposal and locks the required time credits into Escrow
   */
  public static async acceptAndLock(swap: SwapContract, currentUserId: string): Promise<{ success: boolean; escrow: EscrowRecord }> {
    return api.lockEscrow({
      swapId: swap.id,
      requesterId: swap.requesterId,
      providerId: swap.providerId,
      amountCredits: swap.totalCredits,
    });
  }

  /**
   * Completes a swap session and releases escrowed time credits to the mentor
   */
  public static async completeAndRelease(swapId: string, currentUserId: string): Promise<{ success: boolean; escrow: EscrowRecord; swap: SwapContract }> {
    return api.releaseEscrow(swapId, currentUserId);
  }

  /**
   * Cancels a swap and refunds locked time credits back to requester
   */
  public static async cancelAndRefund(swapId: string, reason: string, currentUserId: string): Promise<{ success: boolean; escrow: EscrowRecord; swap: SwapContract }> {
    return api.refundEscrow(swapId, reason, currentUserId);
  }

  /**
   * Raises a formal dispute on an escrow transaction
   */
  public static async raiseDispute(swapId: string, disputerId: string, reason: string): Promise<{ success: boolean; escrow: EscrowRecord; swap: SwapContract }> {
    return api.disputeEscrow(swapId, disputerId, reason);
  }
}
