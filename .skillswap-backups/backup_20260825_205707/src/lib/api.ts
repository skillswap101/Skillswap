import {
  UserProfile,
  SkillListing,
  SwapContract,
  EscrowRecord,
  TimeCreditTransaction,
  AuditCheckResult,
  EmailNotification,
} from '../types';

export const api = {
  // Users
  async getUsers(): Promise<UserProfile[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUser(id: string): Promise<UserProfile> {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async updateUser(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  // Listings
  async getListings(params?: { category?: string; type?: string; search?: string }): Promise<SkillListing[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/listings?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch listings');
    return res.json();
  },

  async createListing(data: any): Promise<SkillListing> {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create listing');
    }
    return res.json();
  },

  async deleteListing(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Swaps
  async getSwaps(userId?: string): Promise<SwapContract[]> {
    const url = userId ? `/api/swaps?userId=${userId}` : '/api/swaps';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch swaps');
    return res.json();
  },

  async getSwap(id: string): Promise<SwapContract> {
    const res = await fetch(`/api/swaps/${id}`);
    if (!res.ok) throw new Error('Failed to fetch swap');
    return res.json();
  },

  async createSwap(data: any): Promise<SwapContract> {
    const res = await fetch('/api/swaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create swap proposal');
    }
    return res.json();
  },

  async updateSwap(id: string, updates: Partial<SwapContract>): Promise<SwapContract> {
    const res = await fetch(`/api/swaps/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update swap');
    return res.json();
  },

  // Escrow Operations
  async lockEscrow(params: {
    swapId: string;
    requesterId: string;
    providerId: string;
    amountCredits: number;
  }): Promise<{ success: boolean; escrow: EscrowRecord }> {
    const res = await fetch('/api/escrow/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to lock escrow');
    }
    return res.json();
  },

  async releaseEscrow(swapId: string, userId: string): Promise<{ success: boolean; escrow: EscrowRecord; swap: SwapContract }> {
    const res = await fetch('/api/escrow/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swapId, userId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to release escrow');
    }
    return res.json();
  },

  async refundEscrow(swapId: string, reason: string, userId: string): Promise<{ success: boolean; escrow: EscrowRecord; swap: SwapContract }> {
    const res = await fetch('/api/escrow/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swapId, reason, userId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to refund escrow');
    }
    return res.json();
  },

  async disputeEscrow(swapId: string, disputerId: string, reason: string): Promise<{ success: boolean; escrow: EscrowRecord; swap: SwapContract }> {
    const res = await fetch('/api/escrow/dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swapId, disputerId, reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to dispute escrow');
    }
    return res.json();
  },

  async resolveDispute(params: {
    swapId: string;
    resolution: 'refund_requester' | 'release_provider' | 'split_50_50';
    notes: string;
  }): Promise<{ success: boolean; escrow: EscrowRecord; swap: SwapContract }> {
    const res = await fetch('/api/escrow/resolve-dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to resolve dispute');
    }
    return res.json();
  },

  // Transactions
  async getTransactions(userId?: string): Promise<TimeCreditTransaction[]> {
    const url = userId ? `/api/transactions?userId=${userId}` : '/api/transactions';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  // Payments: Stripe
  async createStripeSession(data: {
    userId: string;
    creditHours: number;
    amountUSD: number;
  }) {
    const res = await fetch('/api/payments/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create Stripe session');
    }
    return res.json();
  },

  async verifyStripeSession(sessionId: string, userId: string) {
    const res = await fetch(`/api/payments/stripe/verify-session/${sessionId}?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to verify Stripe session');
    return res.json();
  },

  // Payments: M-Pesa Daraja
  async initiateMpesaStk(data: {
    userId: string;
    phone: string;
    creditHours: number;
    amountKES: number;
  }) {
    const res = await fetch('/api/payments/mpesa/stkpush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to initiate M-Pesa STK Push');
    }
    return res.json();
  },

  async queryMpesaStk(checkoutRequestId: string, userId: string) {
    const res = await fetch(`/api/payments/mpesa/query/${checkoutRequestId}?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to query M-Pesa status');
    return res.json();
  },

  async simulateMpesaPin(checkoutRequestId: string) {
    const res = await fetch('/api/payments/mpesa/simulate-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutRequestId }),
    });
    if (!res.ok) throw new Error('Failed to simulate M-Pesa PIN approval');
    return res.json();
  },

  // Payments: PayPal v2
  async createPaypalOrder(data: {
    userId: string;
    creditHours: number;
    amountUSD: number;
  }) {
    const res = await fetch('/api/payments/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create PayPal order');
    }
    return res.json();
  },

  async capturePaypalOrder(orderId: string, userId: string) {
    const res = await fetch(`/api/payments/paypal/capture-order/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to capture PayPal order');
    return res.json();
  },

  // AI
  async getAiMatches(desire: string, userId: string) {
    const res = await fetch('/api/ai/match-skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desire, userId }),
    });
    if (!res.ok) throw new Error('Failed to get AI matches');
    return res.json();
  },

  async enhanceListing(title: string, category: string, description: string) {
    const res = await fetch('/api/ai/enhance-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, description }),
    });
    if (!res.ok) throw new Error('Failed to enhance listing with AI');
    return res.json();
  },

  async summarizeSession(data: {
    skillTitle: string;
    mentorName: string;
    learnerName: string;
    notes: string;
    milestones: Array<{ text: string; done: boolean }>;
    durationMinutes: number;
  }) {
    const res = await fetch('/api/ai/summarize-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to summarize session with AI');
    return res.json();
  },

  // Audit
  async runAudit(): Promise<{
    timestamp: string;
    overallStatus: 'healthy' | 'warnings' | 'critical';
    score: number;
    results: AuditCheckResult[];
    summary: string;
  }> {
    const res = await fetch('/api/audit/run');
    if (!res.ok) throw new Error('Failed to execute audit');
    return res.json();
  },

  // Email Notifications
  async getNotifications(userId?: string): Promise<EmailNotification[]> {
    const url = userId ? `/api/notifications?userId=${encodeURIComponent(userId)}` : '/api/notifications';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  async markAllNotificationsRead(userId: string): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json();
  },

  async deleteNotification(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete notification');
    return res.json();
  },

  async simulateTestEmail(params: {
    recipientUserId: string;
    category: string;
    customSubject?: string;
  }): Promise<{ success: boolean; notification: EmailNotification }> {
    const res = await fetch('/api/notifications/simulate-test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to send test simulation email');
    return res.json();
  },
};

