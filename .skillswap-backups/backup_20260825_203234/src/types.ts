export type SkillCategory =
  | 'All'
  | 'Tech & Dev'
  | 'Languages'
  | 'Design & Creative'
  | 'Music & Audio'
  | 'Fitness & Wellness'
  | 'Business & Marketing'
  | 'Crafts & Cooking';

export type DeliveryMode = 'Online' | 'In-Person' | 'Hybrid';
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type SwapType = 'Direct Swap' | 'Time Credits' | 'Flexible';

export interface User {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  location: string;
  rating: number;
  reviewCount: number;
  hoursTaught: number;
  hoursLearned: number;
  timeCredits: number;
  completedSessionsCount?: number;
  badges: string[];
  responseTime: string;
  memberSince: string;
  skillsOffered: string[];
  skillsDesired: string[];
}

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
  userName: string;
  userAvatar: string;
  userRating: number;
  userReviewCount: number;
  userLocation: string;
  category: SkillCategory;
  title: string;
  description: string;
  level: SkillLevel;
  delivery: DeliveryMode;
  swapType: SwapType;
  skillsDesiredInReturn: string[];
  tags: string[];
  image: string;
  featured?: boolean;
  verified?: boolean;
  completedSessionsCount?: number;
  hoursOffered: number;
  availability: string[];
  learningObjectives: string[];
  progressPercent?: number;
  likesCount?: number;
  isLiked?: boolean;
  previewVideoUrl?: string;
  curriculumMilestones?: { title: string; duration: string; completed?: boolean }[];
  nextAvailableSlot?: string;
  previewAudioUrl?: string;
  previewSnippet?: string;
}

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

export type EscrowStatus = 'LOCKED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';

export interface EscrowTransaction {
  id: string;
  proposalId: string;
  sessionId?: string;
  learnerId: string;
  learnerName: string;
  mentorId: string;
  mentorName: string;
  skillTitle: string;
  creditsAmount: number;
  status: EscrowStatus;
  lockedAt: string;
  releasedAt?: string;
  refundedAt?: string;
  autoReleaseMinutes?: number;
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

