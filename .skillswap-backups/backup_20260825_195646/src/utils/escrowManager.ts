import { EscrowTransaction, EscrowStatus } from '../types';

const ESCROW_STORAGE_KEY = 'skillswap_5_escrow_transactions';

const INITIAL_ESCROW_TXS: EscrowTransaction[] = [
  {
    id: 'escrow-101',
    proposalId: 'prop-1',
    sessionId: 'sess-1',
    learnerId: 'usr_me',
    learnerName: 'Alex Morgan',
    mentorId: 'usr_2',
    mentorName: 'Elena Rostova',
    skillTitle: 'Full-Stack React & Node.js Mentorship',
    creditsAmount: 1,
    status: 'LOCKED',
    lockedAt: 'Yesterday, 14:30',
    autoReleaseMinutes: 60,
  },
  {
    id: 'escrow-102',
    proposalId: 'prop-2',
    sessionId: 'sess-2',
    learnerId: 'usr_3',
    learnerName: 'Marcus Vance',
    mentorId: 'usr_me',
    mentorName: 'Alex Morgan',
    skillTitle: 'Conversational Spanish for Beginners',
    creditsAmount: 1,
    status: 'RELEASED',
    lockedAt: '3 days ago',
    releasedAt: '2 days ago',
  },
];

type EscrowChangeListener = (transactions: EscrowTransaction[]) => void;
const listeners: Set<EscrowChangeListener> = new Set();

export const getStoredEscrowTransactions = (): EscrowTransaction[] => {
  try {
    const raw = localStorage.getItem(ESCROW_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse escrow transactions:', e);
  }
  return INITIAL_ESCROW_TXS;
};

export const saveEscrowTransactions = (txs: EscrowTransaction[]) => {
  try {
    localStorage.setItem(ESCROW_STORAGE_KEY, JSON.stringify(txs));
    listeners.forEach((listener) => listener(txs));
  } catch (e) {
    console.error('Failed to save escrow transactions:', e);
  }
};

export const subscribeEscrowChanges = (listener: EscrowChangeListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Locks time credits into escrow for a scheduled swap proposal or video session.
 */
export const lockEscrowPoints = (
  proposalId: string,
  learnerId: string,
  learnerName: string,
  mentorId: string,
  mentorName: string,
  skillTitle: string,
  creditsAmount: number = 1
): EscrowTransaction => {
  const txs = getStoredEscrowTransactions();
  
  // Check if existing locked transaction exists
  const existing = txs.find((t) => t.proposalId === proposalId && t.status === 'LOCKED');
  if (existing) {
    return existing;
  }

  const newTx: EscrowTransaction = {
    id: `escrow-${Date.now()}`,
    proposalId,
    learnerId,
    learnerName,
    mentorId,
    mentorName,
    skillTitle,
    creditsAmount,
    status: 'LOCKED',
    lockedAt: 'Just now',
    autoReleaseMinutes: 60,
  };

  const updated = [newTx, ...txs];
  saveEscrowTransactions(updated);
  return newTx;
};

/**
 * Releases locked escrow points to the mentor upon completion of the learning session.
 */
export const releaseEscrowPoints = (escrowId: string): EscrowTransaction | null => {
  const txs = getStoredEscrowTransactions();
  let updatedTx: EscrowTransaction | null = null;

  const updated = txs.map((tx) => {
    if (tx.id === escrowId && tx.status === 'LOCKED') {
      updatedTx = {
        ...tx,
        status: 'RELEASED' as EscrowStatus,
        releasedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return updatedTx;
    }
    return tx;
  });

  if (updatedTx) {
    saveEscrowTransactions(updated);
  }
  return updatedTx;
};

/**
 * Refunds locked escrow points back to the learner if a session is cancelled or disputed.
 */
export const refundEscrowPoints = (escrowId: string): EscrowTransaction | null => {
  const txs = getStoredEscrowTransactions();
  let updatedTx: EscrowTransaction | null = null;

  const updated = txs.map((tx) => {
    if (tx.id === escrowId && (tx.status === 'LOCKED' || tx.status === 'DISPUTED')) {
      updatedTx = {
        ...tx,
        status: 'REFUNDED' as EscrowStatus,
        refundedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return updatedTx;
    }
    return tx;
  });

  if (updatedTx) {
    saveEscrowTransactions(updated);
  }
  return updatedTx;
};

/**
 * Marks an escrow transaction as disputed for automated resolution.
 */
export const disputeEscrowPoints = (escrowId: string): EscrowTransaction | null => {
  const txs = getStoredEscrowTransactions();
  let updatedTx: EscrowTransaction | null = null;

  const updated = txs.map((tx) => {
    if (tx.id === escrowId && tx.status === 'LOCKED') {
      updatedTx = {
        ...tx,
        status: 'DISPUTED' as EscrowStatus,
      };
      return updatedTx;
    }
    return tx;
  });

  if (updatedTx) {
    saveEscrowTransactions(updated);
  }
  return updatedTx;
};


export const getEscrowForProposal = (proposalId: string): EscrowTransaction | undefined => {
  const txs = getStoredEscrowTransactions();
  return txs.find((t) => t.proposalId === proposalId);
};
