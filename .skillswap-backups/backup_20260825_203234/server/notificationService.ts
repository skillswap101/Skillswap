import { EmailNotification, EmailNotificationCategory, SwapContract, UserProfile, EscrowRecord } from '../src/types';
import { dbStore } from './dbStore';

class NotificationService {
  private notifications: EmailNotification[] = [];

  constructor() {
    this.seedInitialNotifications();
  }

  private seedInitialNotifications() {
    const alex = dbStore.getUser('user_alex');
    const elena = dbStore.getUser('user_elena');

    if (alex && elena) {
      // Seed an initial email for Alex regarding the Spanish session escrow
      this.sendEmailNotification({
        recipientUserId: alex.id,
        recipientEmail: alex.email,
        recipientName: alex.name,
        senderName: 'SkillSwap Escrow Protocol',
        senderEmail: 'escrow-contracts@skillswap.dev',
        subject: '🔒 Escrow Secured: 2.0 Time Credits locked for Spanish Coaching',
        previewText: 'Your swap agreement with Elena Rodriguez has been locked in bilateral escrow.',
        category: 'escrow_locked',
        swapId: 'swap_201',
        actionLabel: 'View Contract & Live Studio',
        actionUrl: 'swaps',
        metadata: {
          skillTitle: 'Conversational Spanish & Business Fluency Bootcamp',
          credits: 2.0,
          partnerName: elena.name,
          scheduledDate: new Date(Date.now() + 86400000).toISOString(),
          escrowId: 'escrow_101',
        },
        htmlBody: this.generateEscrowLockedHtml({
          recipientName: alex.name,
          partnerName: elena.name,
          skillTitle: 'Conversational Spanish & Business Fluency Bootcamp',
          credits: 2.0,
          scheduledDate: new Date(Date.now() + 86400000).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          escrowId: 'escrow_101',
          swapId: 'swap_201',
        }),
      });

      // Seed an email for Elena about the proposal
      this.sendEmailNotification({
        recipientUserId: elena.id,
        recipientEmail: elena.email,
        recipientName: elena.name,
        senderName: 'Alex Chen via SkillSwap',
        senderEmail: 'notifications@skillswap.dev',
        subject: '✨ New Swap Proposal: Alex Chen wants to learn Conversational Spanish',
        previewText: 'Alex Chen sent a 2.0-hour swap proposal for Conversational Spanish Bootcamp.',
        category: 'proposal_received',
        swapId: 'swap_201',
        actionLabel: 'Review & Enter Studio',
        actionUrl: 'swaps',
        metadata: {
          skillTitle: 'Conversational Spanish & Business Fluency Bootcamp',
          credits: 2.0,
          partnerName: alex.name,
        },
        htmlBody: this.generateProposalReceivedHtml({
          recipientName: elena.name,
          senderName: alex.name,
          skillTitle: 'Conversational Spanish & Business Fluency Bootcamp',
          credits: 2.0,
          scheduledDate: new Date(Date.now() + 86400000).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          learningGoals: ['Practice job interview responses in Spanish', 'Learn technical and business vocabulary', 'Receive live accent feedback'],
          swapId: 'swap_201',
        }),
      });
    }
  }

  /**
   * Dispatches and records a new simulated email notification
   */
  public sendEmailNotification(data: Omit<EmailNotification, 'id' | 'createdAt' | 'isRead'>): EmailNotification {
    const notification: EmailNotification = {
      ...data,
      id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    this.notifications.unshift(notification);
    return notification;
  }

  public getNotifications(userId?: string): EmailNotification[] {
    if (userId) {
      return this.notifications.filter(n => n.recipientUserId === userId);
    }
    return this.notifications;
  }

  public markAsRead(id: string): boolean {
    const item = this.notifications.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      return true;
    }
    return false;
  }

  public markAllAsRead(userId: string): number {
    let count = 0;
    this.notifications.forEach(n => {
      if (n.recipientUserId === userId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    return count;
  }

  public deleteNotification(id: string): boolean {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    return false;
  }

  // ==========================================
  // EVENT TRIGGER HANDLERS
  // ==========================================

  /**
   * Triggered when a learner creates a new swap proposal
   */
  public onProposalCreated(swap: SwapContract) {
    const requester = dbStore.getUser(swap.requesterId);
    const provider = dbStore.getUser(swap.providerId);

    if (!provider || !requester) return;

    // 1. Email to Mentor / Provider
    this.sendEmailNotification({
      recipientUserId: provider.id,
      recipientEmail: provider.email,
      recipientName: provider.name,
      senderName: `${requester.name} via SkillSwap`,
      senderEmail: 'proposals@skillswap.dev',
      subject: `🎯 New Swap Proposal: ${requester.name} wants to learn ${swap.skillTitle}`,
      previewText: `${requester.name} proposed an exchange of ${swap.hours} hour(s) for ${swap.skillTitle}.`,
      category: 'proposal_received',
      swapId: swap.id,
      actionLabel: 'Review & Accept Proposal',
      actionUrl: 'swaps',
      metadata: {
        skillTitle: swap.skillTitle,
        credits: swap.totalCredits,
        partnerName: requester.name,
        scheduledDate: swap.scheduledDate,
      },
      htmlBody: this.generateProposalReceivedHtml({
        recipientName: provider.name,
        senderName: requester.name,
        skillTitle: swap.skillTitle,
        credits: swap.totalCredits,
        scheduledDate: new Date(swap.scheduledDate).toLocaleString(),
        learningGoals: swap.learningGoals || [],
        swapId: swap.id,
      }),
    });

    // 2. Confirmation Email to Requester
    this.sendEmailNotification({
      recipientUserId: requester.id,
      recipientEmail: requester.email,
      recipientName: requester.name,
      senderName: 'SkillSwap Proposal System',
      senderEmail: 'confirmations@skillswap.dev',
      subject: `📤 Proposal Dispatched: Swap request sent to ${provider.name}`,
      previewText: `Your proposal for ${swap.skillTitle} was delivered to ${provider.name}.`,
      category: 'proposal_received',
      swapId: swap.id,
      actionLabel: 'View Active Proposals',
      actionUrl: 'swaps',
      metadata: {
        skillTitle: swap.skillTitle,
        credits: swap.totalCredits,
        partnerName: provider.name,
      },
      htmlBody: this.generateProposalConfirmationHtml({
        recipientName: requester.name,
        partnerName: provider.name,
        skillTitle: swap.skillTitle,
        credits: swap.totalCredits,
        swapId: swap.id,
      }),
    });
  }

  /**
   * Triggered when a proposal is accepted and time credits are locked into escrow
   */
  public onEscrowLocked(swap: SwapContract, escrow: EscrowRecord) {
    const requester = dbStore.getUser(swap.requesterId);
    const provider = dbStore.getUser(swap.providerId);
    if (!requester || !provider) return;

    // Email to Learner
    this.sendEmailNotification({
      recipientUserId: requester.id,
      recipientEmail: requester.email,
      recipientName: requester.name,
      senderName: 'SkillSwap Smart Escrow',
      senderEmail: 'escrow@skillswap.dev',
      subject: `🔒 Escrow Locked: ${escrow.amountCredits} Credits Secured for ${swap.skillTitle}`,
      previewText: `Your session with ${provider.name} is confirmed. Credits are safely locked in trust.`,
      category: 'escrow_locked',
      swapId: swap.id,
      actionLabel: 'Enter Live Session Studio',
      actionUrl: 'live_room',
      metadata: {
        skillTitle: swap.skillTitle,
        credits: escrow.amountCredits,
        partnerName: provider.name,
        escrowId: escrow.id,
      },
      htmlBody: this.generateEscrowLockedHtml({
        recipientName: requester.name,
        partnerName: provider.name,
        skillTitle: swap.skillTitle,
        credits: escrow.amountCredits,
        scheduledDate: new Date(swap.scheduledDate).toLocaleString(),
        escrowId: escrow.id,
        swapId: swap.id,
      }),
    });

    // Email to Mentor
    this.sendEmailNotification({
      recipientUserId: provider.id,
      recipientEmail: provider.email,
      recipientName: provider.name,
      senderName: 'SkillSwap Smart Escrow',
      senderEmail: 'escrow@skillswap.dev',
      subject: `🎉 Swap Confirmed! ${escrow.amountCredits} Credits Funded by ${requester.name}`,
      previewText: `The escrow for ${swap.skillTitle} is fully funded and ready for your scheduled session.`,
      category: 'proposal_accepted',
      swapId: swap.id,
      actionLabel: 'Prepare Session & Whiteboard',
      actionUrl: 'live_room',
      metadata: {
        skillTitle: swap.skillTitle,
        credits: escrow.amountCredits,
        partnerName: requester.name,
        escrowId: escrow.id,
      },
      htmlBody: this.generateMentorReadyHtml({
        recipientName: provider.name,
        partnerName: requester.name,
        skillTitle: swap.skillTitle,
        credits: escrow.amountCredits,
        scheduledDate: new Date(swap.scheduledDate).toLocaleString(),
        swapId: swap.id,
      }),
    });
  }

  /**
   * Triggered when session finishes and escrow is released to provider
   */
  public onEscrowSettled(swap: SwapContract, escrow: EscrowRecord) {
    const requester = dbStore.getUser(swap.requesterId);
    const provider = dbStore.getUser(swap.providerId);
    if (!requester || !provider) return;

    // Email to Mentor (Provider)
    this.sendEmailNotification({
      recipientUserId: provider.id,
      recipientEmail: provider.email,
      recipientName: provider.name,
      senderName: 'SkillSwap Time Ledger',
      senderEmail: 'payouts@skillswap.dev',
      subject: `💰 Time Credits Released: +${escrow.amountCredits} hrs credited to your wallet`,
      previewText: `Bilateral sign-off verified for ${swap.skillTitle}. Your balance is updated.`,
      category: 'session_settled',
      swapId: swap.id,
      actionLabel: 'View Wallet Balance',
      actionUrl: 'wallet',
      metadata: {
        skillTitle: swap.skillTitle,
        credits: escrow.amountCredits,
        partnerName: requester.name,
        escrowId: escrow.id,
      },
      htmlBody: this.generateCreditsReleasedHtml({
        recipientName: provider.name,
        partnerName: requester.name,
        skillTitle: swap.skillTitle,
        credits: escrow.amountCredits,
        escrowId: escrow.id,
        swapId: swap.id,
      }),
    });

    // Email to Learner (Certificate & Completion Notice)
    this.sendEmailNotification({
      recipientUserId: requester.id,
      recipientEmail: requester.email,
      recipientName: requester.name,
      senderName: 'SkillSwap Mastery Protocol',
      senderEmail: 'certificates@skillswap.dev',
      subject: `📜 Certificate of Mastery Awarded: ${swap.skillTitle}`,
      previewText: `Congratulations! Your peer mentorship with ${provider.name} is complete. Your verified certificate is ready.`,
      category: 'session_settled',
      swapId: swap.id,
      actionLabel: 'View & Download Certificate',
      actionUrl: 'swaps',
      metadata: {
        skillTitle: swap.skillTitle,
        credits: escrow.amountCredits,
        partnerName: provider.name,
      },
      htmlBody: this.generateLearnerCertificateHtml({
        recipientName: requester.name,
        mentorName: provider.name,
        skillTitle: swap.skillTitle,
        hours: swap.hours,
        swapId: swap.id,
      }),
    });
  }

  /**
   * Triggered when a dispute is opened
   */
  public onDisputeOpened(swap: SwapContract, disputerId: string, reason: string) {
    const requester = dbStore.getUser(swap.requesterId);
    const provider = dbStore.getUser(swap.providerId);
    if (!requester || !provider) return;

    const disputer = disputerId === requester.id ? requester : provider;
    const otherParty = disputerId === requester.id ? provider : requester;

    [requester, provider].forEach(u => {
      this.sendEmailNotification({
        recipientUserId: u.id,
        recipientEmail: u.email,
        recipientName: u.name,
        senderName: 'SkillSwap Mediation Desk',
        senderEmail: 'disputes@skillswap.dev',
        subject: `⚠️ Dispute Mediation Notice: Swap #${swap.id.slice(0, 8)} (${swap.skillTitle})`,
        previewText: `A dispute was logged by ${disputer.name}. Escrow funds are paused pending mediation.`,
        category: 'dispute_opened',
        swapId: swap.id,
        actionLabel: 'Open Dispute Mediation Desk',
        actionUrl: 'swaps',
        metadata: {
          skillTitle: swap.skillTitle,
          partnerName: otherParty.name,
        },
        htmlBody: this.generateDisputeOpenedHtml({
          recipientName: u.name,
          disputerName: disputer.name,
          skillTitle: swap.skillTitle,
          reason,
          swapId: swap.id,
        }),
      });
    });
  }

  /**
   * Triggered when a dispute is resolved
   */
  public onDisputeResolved(swap: SwapContract, resolution: string, notes: string) {
    const requester = dbStore.getUser(swap.requesterId);
    const provider = dbStore.getUser(swap.providerId);
    if (!requester || !provider) return;

    [requester, provider].forEach(u => {
      this.sendEmailNotification({
        recipientUserId: u.id,
        recipientEmail: u.email,
        recipientName: u.name,
        senderName: 'SkillSwap Mediation Desk',
        senderEmail: 'disputes@skillswap.dev',
        subject: `✅ Dispute Resolved: Swap #${swap.id.slice(0, 8)} (${swap.skillTitle})`,
        previewText: `Mediation ruling concluded: ${resolution}. Escrow reallocated accordingly.`,
        category: 'dispute_resolved',
        swapId: swap.id,
        actionLabel: 'Review Resolution & Ledger',
        actionUrl: 'wallet',
        metadata: {
          skillTitle: swap.skillTitle,
        },
        htmlBody: this.generateDisputeResolvedHtml({
          recipientName: u.name,
          skillTitle: swap.skillTitle,
          resolution,
          notes,
          swapId: swap.id,
        }),
      });
    });
  }

  /**
   * Triggered when a user buys time credits via Stripe, M-Pesa, or PayPal
   */
  public onCreditsPurchased(userId: string, hours: number, gateway: string, amount: string, receiptId: string) {
    const user = dbStore.getUser(userId);
    if (!user) return;

    this.sendEmailNotification({
      recipientUserId: user.id,
      recipientEmail: user.email,
      recipientName: user.name,
      senderName: 'SkillSwap Billing & Treasury',
      senderEmail: 'treasury@skillswap.dev',
      subject: `💳 Payment Receipt: +${hours} Time Credits Added via ${gateway.toUpperCase()}`,
      previewText: `Your payment was verified. ${hours} hours have been deposited into your Time Wallet.`,
      category: 'credits_purchased',
      actionLabel: 'Explore Marketplace Skills',
      actionUrl: 'marketplace',
      metadata: {
        credits: hours,
      },
      htmlBody: this.generatePaymentReceiptHtml({
        recipientName: user.name,
        hours,
        gateway: gateway.toUpperCase(),
        amount,
        receiptId,
        newBalance: user.timeCredits,
      }),
    });
  }

  // ==========================================
  // HTML EMAIL TEMPLATE GENERATORS
  // ==========================================

  private generateProposalReceivedHtml(params: {
    recipientName: string;
    senderName: string;
    skillTitle: string;
    credits: number;
    scheduledDate: string;
    learningGoals: string[];
    swapId: string;
  }): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">SkillSwap 5.0</h1>
          <p style="margin: 6px 0 0; color: #e0e7ff; font-size: 13px;">Peer-to-Peer Knowledge Exchange Protocol</p>
        </div>

        <div style="padding: 32px 24px;">
          <div style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; display: inline-block;">
            <span style="color: #a5b4fc; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">🎯 Proposal Alert</span>
          </div>

          <h2 style="margin: 0 0 16px; font-size: 20px; color: #ffffff;">Hello ${params.recipientName},</h2>
          <p style="margin: 0 0 20px; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
            <strong>${params.senderName}</strong> is interested in learning from you and has submitted a new bilateral swap agreement for your listing:
          </p>

          <div style="background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 24px;">
            <div style="font-size: 17px; font-weight: bold; color: #38bdf8; margin-bottom: 12px;">${params.skillTitle}</div>
            
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
              <div style="background: #0f172a; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Duration</div>
                <div style="font-size: 15px; font-weight: bold; color: #ffffff;">${params.credits} Hour${params.credits > 1 ? 's' : ''}</div>
              </div>
              <div style="background: #0f172a; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Escrow Guarantee</div>
                <div style="font-size: 15px; font-weight: bold; color: #fbbf24;">${params.credits} Time Credits</div>
              </div>
            </div>

            <div style="font-size: 13px; color: #94a3b8; margin-bottom: 6px; font-weight: 600;">Proposed Session Goals:</div>
            <ul style="margin: 0 0 0 18px; padding: 0; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
              ${params.learningGoals.map(g => `<li>${g}</li>`).join('')}
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="#swaps" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
              Review & Accept Proposal
            </a>
          </div>

          <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
            Contract Reference: ${params.swapId} • Protected by bilateral cryptographic escrow
          </p>
        </div>

        <div style="background: #090d16; padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b;">
          SkillSwap 5.0 • Multi-Gateway Escrow & WebRTC Peer Exchange Foundation
        </div>
      </div>
    `;
  }

  private generateProposalConfirmationHtml(params: {
    recipientName: string;
    partnerName: string;
    skillTitle: string;
    credits: number;
    swapId: string;
  }): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="background: #1e293b; padding: 24px; text-align: center; border-bottom: 1px solid #334155;">
          <h2 style="margin: 0; font-size: 18px; color: #ffffff;">SkillSwap Proposal Sent ✓</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Hi ${params.recipientName}, your swap proposal for <strong>${params.skillTitle}</strong> has been transmitted to <strong>${params.partnerName}</strong>.
          </p>
          <div style="background: #022c22; border: 1px solid #059669; padding: 14px; border-radius: 10px; margin: 16px 0; font-size: 13px; color: #6ee7b7;">
            ⚡ <strong>Next Step:</strong> Once ${params.partnerName} accepts, ${params.credits} Time Credits will be placed in secure escrow.
          </div>
        </div>
      </div>
    `;
  }

  private generateEscrowLockedHtml(params: {
    recipientName: string;
    partnerName: string;
    skillTitle: string;
    credits: number;
    scheduledDate: string;
    escrowId: string;
    swapId: string;
  }): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Escrow Vault Secured</h1>
          <p style="margin: 6px 0 0; color: #ccfbf1; font-size: 13px;">Bilateral Time Banking Contract Active</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; color: #ffffff;">Hello ${params.recipientName},</h2>
          <p style="margin: 0 0 20px; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Your exchange with <strong>${params.partnerName}</strong> is confirmed. <strong>${params.credits} Time Credits</strong> have been locked into Escrow (ID: <code>${params.escrowId}</code>).
          </p>
          <div style="background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 24px;">
            <div style="font-size: 15px; font-weight: bold; color: #38bdf8;">${params.skillTitle}</div>
            <div style="font-size: 13px; color: #94a3b8; margin-top: 6px;">Scheduled Time: ${params.scheduledDate}</div>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="#live_room" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
              Enter Live Studio Room
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateMentorReadyHtml(params: {
    recipientName: string;
    partnerName: string;
    skillTitle: string;
    credits: number;
    scheduledDate: string;
    swapId: string;
  }): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Session Ready!</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Hi ${params.recipientName}, ${params.partnerName} has funded ${params.credits} Time Credits into Escrow for <strong>${params.skillTitle}</strong>.
          </p>
        </div>
      </div>
    `;
  }

  private generateCreditsReleasedHtml(params: {
    recipientName: string;
    partnerName: string;
    skillTitle: string;
    credits: number;
    escrowId: string;
    swapId: string;
  }): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">+${params.credits} Time Credits Deposited</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Great work, ${params.recipientName}! ${params.partnerName} has signed off on the session for <strong>${params.skillTitle}</strong>. ${params.credits} Time Credits have been transferred to your available balance.
          </p>
        </div>
      </div>
    `;
  }

  private generateLearnerCertificateHtml(params: {
    recipientName: string;
    mentorName: string;
    skillTitle: string;
    hours: number;
    swapId: string;
  }): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Certificate of Mastery</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Congratulations ${params.recipientName}! You have successfully completed ${params.hours} hour(s) of peer mentoring in <strong>${params.skillTitle}</strong> with ${params.mentorName}.
          </p>
        </div>
      </div>
    `;
  }

  private generateDisputeOpenedHtml(params: {
    recipientName: string;
    disputerName: string;
    skillTitle: string;
    reason: string;
    swapId: string;
  }): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="background: #dc2626; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; color: #ffffff;">Dispute Mediation Active</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Hello ${params.recipientName}, a dispute has been opened by <strong>${params.disputerName}</strong> for swap <strong>${params.skillTitle}</strong>.
          </p>
          <div style="background: #1e293b; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; font-size: 13px; color: #fca5a5;">
            Reason: "${params.reason}"
          </div>
        </div>
      </div>
    `;
  }

  private generateDisputeResolvedHtml(params: {
    recipientName: string;
    skillTitle: string;
    resolution: string;
    notes: string;
    swapId: string;
  }): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="background: #059669; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; color: #ffffff;">Dispute Resolved</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Hello ${params.recipientName}, the dispute for <strong>${params.skillTitle}</strong> has been resolved.
          </p>
          <div style="background: #1e293b; padding: 12px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #6ee7b7;">
            <strong>Ruling:</strong> ${params.resolution}<br/>
            <strong>Notes:</strong> ${params.notes}
          </div>
        </div>
      </div>
    `;
  }

  private generatePaymentReceiptHtml(params: {
    recipientName: string;
    hours: number;
    gateway: string;
    amount: string;
    receiptId: string;
    newBalance: number;
  }): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Payment Confirmed</h1>
          <p style="margin: 6px 0 0; color: #e0e7ff; font-size: 13px;">Time Credit Wallet Top-Up</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; color: #ffffff;">Thank you, ${params.recipientName}</h2>
          <p style="margin: 0 0 20px; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            We have credited <strong>+${params.hours} Time Credits</strong> to your wallet via ${params.gateway}.
          </p>
          <div style="background: #1e293b; border-radius: 12px; padding: 16px; border: 1px solid #334155; margin-bottom: 20px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #94a3b8;">Amount Paid:</span>
              <span style="color: #ffffff; font-weight: bold;">${params.amount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #94a3b8;">Gateway:</span>
              <span style="color: #ffffff; font-weight: bold;">${params.gateway}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #94a3b8;">Receipt ID:</span>
              <span style="color: #38bdf8; font-family: monospace;">${params.receiptId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #334155;">
              <span style="color: #94a3b8;">New Total Balance:</span>
              <span style="color: #fbbf24; font-weight: bold;">${params.newBalance.toFixed(1)} Hours</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

export const notificationService = new NotificationService();
