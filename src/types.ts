export type SkillCategory =
  | 'All'
  | 'Tech & Dev'
  | 'Coding & Tech'
  | 'Languages'
  | 'Design & Creative'
  | 'Music & Audio'
  | 'Fitness & Wellness'
  | 'Health & Wellness'
  | 'Business & Marketing'
  | 'Business & Finance'
  | 'Crafts & Cooking'
  | 'Cooking & Culinary'
  | 'AI & Data Science';

export type DeliveryMode = 'Online' | 'In-Person' | 'Hybrid';
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type SwapType = 'Direct Swap' | 'Time Credits' | 'Flexible';
export type ListingType = 'offer' | 'request';
export type PaymentGateway = 'stripe' | 'paypal' | 'mpesa';
export type EmailNotificationCategory = string;

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  avatar: string;
  bio?: string;
  location?: string;
  rating: number;
  reviewCount?: number;
  userReviewCount?: number;
  hoursTaught?: number;
  hoursLearned?: number;
  timeCredits: number;
  escrowLockedCredits?: number;
  completedSessionsCount?: number;
  completedSwaps?: number;
  badges?: string[];
  responseTime?: string;
  memberSince?: string;
  joinedDate?: string;
  skillsOffered?: string[];
  skillsDesired?: string[];
  skillsNeeded?: string[];
  skillsWanted?: string[];
}

export type UserProfile = User;

export interface Review {
  id: string;
  skillId: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  comment: string;
  date: string;
  skillTitle: string;
}

export interface Skill {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  userRating?: number;
  userReviewCount?: number;
  userLocation?: string;
  user?: Partial<User>;
  category: SkillCategory | string;
  title: string;
  description: string;
  level?: SkillLevel;
  experienceLevel?: string;
  delivery?: DeliveryMode;
  swapType?: SwapType;
  type?: ListingType;
  hourlyRateCredits?: number;
  skillsDesiredInReturn?: string[];
  tags?: string[];
  image?: string;
  featured?: boolean;
  verified?: boolean;
  completedSessionsCount?: number;
  skillsExchanged?: number | string[];
  hoursOffered?: number;
  availability?: string[];
  learningObjectives?: string[];
  syllabus?: string[] | any;
  isActive?: boolean;
  progressPercent?: number;
  likesCount?: number;
  isLiked?: boolean;
  previewVideoUrl?: string;
  curriculumMilestones?: { title: string; duration: string; completed?: boolean }[];
  nextAvailableSlot?: string;
  previewAudioUrl?: string;
  previewSnippet?: string;
  createdAt?: string;
}

export type SkillListing = Skill;

export interface SwapProposal {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar: string;
  offeredSkillTitle: string;
  requestedSkillTitle: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'countered';
  proposedDate: string;
  proposedTime: string;
  durationMinutes: number;
  pitchMessage: string;
  useTimeCredits: boolean;
  timeCreditsAmount: number;
  createdAt: string;
  icebreakers?: string[];
}

export interface Session {
  id: string;
  swapProposalId: string;
  title: string;
  mentorName: string;
  mentorAvatar: string;
  learnerName: string;
  learnerAvatar: string;
  skillTitle: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  meetingUrl: string;
  agenda: string[];
  notes?: string;
  learnerRating?: number;
  learnerFeedback?: string;
  mentorId?: string;
  learnerId?: string;
  participantIds?: string[];
  escrowId?: string | null;
  timeCreditsEscrowed?: number;
}

export interface ChatMessage {
  id: string;
  swapProposalId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
  recipientId?: string;
  participantIds?: string[];
}

export interface SkillRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userLocation: string;
  category: SkillCategory;
  title: string;
  description: string;
  targetLevel: SkillLevel;
  delivery: DeliveryMode;
  offeredSkillOrCredits: string;
  preferredSchedule: string;
  offersReceivedCount: number;
  status: 'Open' | 'In Discussion' | 'Fulfilled';
  createdAt: string;
  tags: string[];
}

export type EscrowStatus =
  | 'LOCKED'
  | 'RELEASED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'locked'
  | 'released'
  | 'refunded'
  | 'disputed';

export interface EscrowTransaction {
  id: string;
  swapId?: string;
  proposalId?: string;
  contractId?: string;
  sessionId?: string;
  learnerId?: string;
  learnerName?: string;
  mentorId?: string;
  mentorName?: string;
  requesterId?: string;
  providerId?: string;
  payerId?: string;
  recipientId?: string;
  skillTitle?: string;
  creditsAmount?: number;
  amountCredits?: number;
  status: EscrowStatus;
  lockedAt: string;
  releasedAt?: string;
  refundedAt?: string;
  autoReleaseMinutes?: number;
  disputeReason?: string;
}

export type EscrowRecord = EscrowTransaction;

export interface SwapContract {
  id: string;
  proposalId?: string;
  escrowId?: string;
  initiatorId?: string;
  initiatorName?: string;
  initiatorAvatar?: string;
  partnerId?: string;
  partnerName?: string;
  partnerAvatar?: string;
  requesterId?: string;
  requesterName?: string;
  requesterAvatar?: string;
  providerId?: string;
  providerName?: string;
  providerAvatar?: string;
  skillTitle?: string;
  skillOffered?: string;
  skillRequested?: string;
  category?: string;
  hours?: number;
  totalCredits?: number;
  timeCreditsEscrowed?: number;
  status:
    | 'DRAFT'
    | 'ACTIVE'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'DISPUTED'
    | 'proposed'
    | 'accepted'
    | 'in_progress'
    | 'settled'
    | 'disputed'
    | 'cancelled';
  scheduledDate?: string;
  sessionDate?: string;
  durationMinutes?: number;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  escrowStatus?: EscrowStatus;
  agreedTerms?: boolean;
  learningGoals?: string[];
  sessionNotes?: string;
}

export interface TimeCreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type:
    | 'EARNED'
    | 'SPENT'
    | 'PURCHASED'
    | 'ESCROW_LOCK'
    | 'ESCROW_RELEASE'
    | 'BONUS'
    | 'purchase'
    | 'earned'
    | 'spent'
    | 'refund'
    | 'bonus'
    | 'escrow_lock'
    | 'escrow_release'
    | 'escrow_refund'
    | 'swap_earned';
  description: string;
  timestamp: string;
  balanceAfter?: number;
  relatedSessionId?: string;
  gateway?: PaymentGateway | string;
  referenceId?: string;
}

export interface AuditCheckResult {
  id?: string;
  category?: 'SECURITY' | 'INTEGRATION' | 'FIREBASE' | 'PAYMENTS' | 'ARCHITECTURE' | string;
  title?: string;
  name?: string;
  pillar?: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'passed' | 'warning' | 'failed';
  detail?: string;
  details?: string;
  recommendation?: string;
  timestamp?: string;
  latencyMs?: number;
}

export interface PaymentOrder {
  id: string;
  userId: string;
  amount?: number;
  amountUSD?: number;
  amountKES?: number;
  credits?: number;
  creditHours?: number;
  currency?: string;
  gateway: string;
  gatewayTransactionId?: string;
  gatewayReceipt?: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface EmailNotification {
  id: string;
  recipientUserId?: string;
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  senderEmail?: string;
  swapId?: string;
  actionLabel?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  category?: EmailNotificationCategory | string;
  subject: string;
  previewText?: string;
  body?: string;
  htmlBody?: string;
  timestamp?: string;
  createdAt?: string;
  type?:
    | 'PROPOSAL_RECEIVED'
    | 'PROPOSAL_ACCEPTED'
    | 'ESCROW_SETTLED'
    | 'SESSION_REMINDER'
    | 'PAYMENT_SUCCESS'
    | string;
  read?: boolean;
  isRead?: boolean;
}

export interface SessionNote {
  id: string;
  proposalId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  type: 'code' | 'note' | 'action_item';
  language?: string;
}

export interface SkillBadge {
  id: string;
  title: string;
  category: string;
  issuedBy: string;
  verifiedAt: string;
  score: number;
  iconName: string;
}
