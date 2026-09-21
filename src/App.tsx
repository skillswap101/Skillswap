import React, { useState, useEffect } from 'react';
import { auth } from "./firebase";
import { AnimatePresence } from 'motion/react';
import { 
  Header 
} from './components/Header';
import { 
  SkillCard 
} from './components/SkillCard';
import { 
  SkillDetailModal 
} from './components/SkillDetailModal';
import { 
  ProposalModal 
} from './components/ProposalModal';
import { 
  AIMatchmaker 
} from './components/AIMatchmaker';
import { 
  MySwapsView 
} from './components/MySwapsView';
import { 
  SessionRoomModal 
} from './components/SessionRoomModal';
import { 
  ChatPortal 
} from './components/ChatPortal';
import { 
  CallActionModal 
} from './components/CallActionModal';
import { 
  AIAssistantDrawer 
} from './components/AIAssistantDrawer';
import { 
  SettingsHubModal 
} from './components/SettingsHubModal';
import { 
  TermsPrivacyModal 
} from './components/TermsPrivacyModal';
import { 
  StripeCheckoutModal 
} from './components/StripeCheckoutModal';
import { 
  AuthModal 
} from './components/AuthModal';
import { 
  networkNotifier 
} from './utils/networkNotifier';
import { 
  TimeCreditsView 
} from './components/TimeCreditsView';
import { 
  PostSkillModal 
} from './components/PostSkillModal';
import { 
  ProfileView 
} from './components/ProfileView';
import { 
  SkillPreviewModal 
} from './components/SkillPreviewModal';
import { 
  SkillRoadmap 
} from './components/SkillRoadmap';
import { 
  AvailabilityCalendar 
} from './components/AvailabilityCalendar';
import { 
  MentorSuccessStories 
} from './components/MentorSuccessStories';
import { 
  RequestedSkillsView 
} from './components/RequestedSkillsView';
import { 
  InviteFriendModal 
} from './components/InviteFriendModal';
import { 
  SuggestedForYouSection 
} from './components/SuggestedForYouSection';
import { 
  NearbySkillMapView 
} from './components/NearbySkillMapView';
import { 
  VoicePronunciationCoachModal 
} from './components/VoicePronunciationCoachModal';
import { 
  CalendarSyncModal 
} from './components/CalendarSyncModal';

// Newly integrated components from your directory checklist
import { EmailToastAlert } from './components/EmailToastAlert';
import { EmailNotificationsModal } from './components/EmailNotificationsModal';
import { GlobalNotificationListener } from './components/GlobalNotificationListener';
import { UnifiedCheckoutModal } from './components/UnifiedCheckoutModal';
import { AuditDashboardModal } from './components/AuditDashboardModal';
import { BadgesAndAchievementsModal } from './components/BadgesAndAchievementsModal';
import { GamificationBadges } from './components/GamificationBadges';
import { LearningAnalytics } from './components/LearningAnalytics';
import { PeerRatingsChart } from './components/PeerRatingsChart';
import { PortfolioShowcaseModal } from './components/PortfolioShowcaseModal';
import { SwapContractsView } from './components/SwapContractsView';

import { 
  Skill, 
  SkillCategory, 
  SwapProposal, 
  Session, 
  ChatMessage, 
  Review, 
  User 
} from './types';
import { Sparkles, Compass, Plus, ArrowRightLeft, Search, Clock, X, History, Award, ShieldCheck, Bookmark, Code2, Globe, Palette, Music, Dumbbell, Utensils, Layers, Briefcase, BarChart3, Calendar, Eye } from 'lucide-react';
import { useCloudStateBridge } from "./utils/cloudStateBridge";
import { useAuth } from './context/AuthContext';
import { api } from './lib/api';

const CATEGORIES: SkillCategory[] = [
  'All',
  'Tech & Dev',
  'Languages',
  'Design & Creative',
  'Music & Audio',
  'Fitness & Wellness',
  'Business & Marketing',
  'Crafts & Cooking',
];

const CATEGORY_CONFIG: Partial<Record<SkillCategory, { icon: React.ReactNode; color: string; border: string; bg: string }>> = {
  'All': { icon: <Layers className="w-5 h-5" />, color: 'text-indigo-400', border: 'hover:border-indigo-500/60', bg: 'bg-indigo-500/10' },
  'Tech & Dev': { icon: <Code2 className="w-5 h-5" />, color: 'text-cyan-400', border: 'hover:border-cyan-500/60', bg: 'bg-cyan-500/10' },
  'Coding & Tech': { icon: <Code2 className="w-5 h-5" />, color: 'text-cyan-400', border: 'hover:border-cyan-500/60', bg: 'bg-cyan-500/10' },
  'Languages': { icon: <Globe className="w-5 h-5" />, color: 'text-emerald-400', border: 'hover:border-emerald-500/60', bg: 'bg-emerald-500/10' },
  'Design & Creative': { icon: <Palette className="w-5 h-5" />, color: 'text-purple-400', border: 'hover:border-purple-500/60', bg: 'bg-purple-500/10' },
  'Music & Audio': { icon: <Music className="w-5 h-5" />, color: 'text-amber-400', border: 'hover:border-amber-500/60', bg: 'bg-amber-500/10' },
  'Fitness & Wellness': { icon: <Dumbbell className="w-5 h-5" />, color: 'text-rose-400', border: 'hover:border-rose-500/60', bg: 'bg-rose-500/10' },
  'Health & Wellness': { icon: <Dumbbell className="w-5 h-5" />, color: 'text-rose-400', border: 'hover:border-rose-500/60', bg: 'bg-rose-500/10' },
  'Business & Marketing': { icon: <Briefcase className="w-5 h-5" />, color: 'text-blue-400', border: 'hover:border-blue-500/60', bg: 'bg-blue-500/10' },
  'Business & Finance': { icon: <Briefcase className="w-5 h-5" />, color: 'text-blue-400', border: 'hover:border-blue-500/60', bg: 'bg-blue-500/10' },
  'Crafts & Cooking': { icon: <Utensils className="w-5 h-5" />, color: 'text-orange-400', border: 'hover:border-orange-500/60', bg: 'bg-orange-500/10' },
  'Cooking & Culinary': { icon: <Utensils className="w-5 h-5" />, color: 'text-orange-400', border: 'hover:border-orange-500/60', bg: 'bg-orange-500/10' },
  'AI & Data Science': { icon: <Sparkles className="w-5 h-5" />, color: 'text-violet-400', border: 'hover:border-violet-500/60', bg: 'bg-violet-500/10' },
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [isUnifiedCheckoutOpen, setIsUnifiedCheckoutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [savedOnly, setSavedOnly] = useState<boolean>(false);

  // Additional Modals state toggles for newly imported features
  const [isEmailNotificationsOpen, setIsEmailNotificationsOpen] = useState<boolean>(false);
  const [isAuditDashboardOpen, setIsAuditDashboardOpen] = useState<boolean>(false);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState<boolean>(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState<boolean>(false);

  // Bookmarks state
  const [bookmarkedSkillIds, setBookmarkedSkillIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('skillswap_bookmarked_skills');
    return saved ? JSON.parse(saved) : ['skill-1', 'skill-5'];
  });

  // Recent Searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('skillswap_recent_searches');
    return saved ? JSON.parse(saved) : ['Spanish', 'React', 'Photography', 'Guitar', 'Python'];
  });

  // Data state
  const {
    currentUser: firebaseAuthUser,
    loading: authLoading,
    error: authError,
    getToken,
    logout,
  } = useAuth();

  const {
    currentUser,
    setCurrentUser,
    skills,
    setSkills,
    proposals,
    setProposals,
    sessions,
    setSessions,
    messages,
    setMessages,
    reviews,
    setReviews,
    loading: cloudLoading,
    authenticated: cloudAuthenticated,
    error: cloudError,
    addSkillToCloud,
    addProposalToCloud,
    addMessageToCloud,
  } = useCloudStateBridge();

  // Modal controls
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);
  const [previewSkill, setPreviewSkill] = useState<Skill | null>(null);
  const [proposalTargetSkill, setProposalTargetSkill] = useState<Skill | null>(null);
  const [activeSessionRoom, setActiveSessionRoom] = useState<Session | null>(null);
  const [selectedProposalChatId, setSelectedProposalChatId] = useState<string | null>(null);
  const [isPostSkillOpen, setIsPostSkillOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTermsPrivacyOpen, setIsTermsPrivacyOpen] = useState<boolean>(false);
  const [isStripeCheckoutOpen, setIsStripeCheckoutOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [calendarSyncSession, setCalendarSyncSession] = useState<Session | null>(null);
  const [isVoiceCoachOpen, setIsVoiceCoachOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<{
    isOpen: boolean;
    proposalId?: string;
    peerName: string;
    peerAvatar: string;
    skillTitle: string;
    callType: 'video' | 'audio';
  } | null>(null);

  // Network Connectivity Notification Subscription
  useEffect(() => {
    let initialRender = true;
    return networkNotifier.subscribe((isOnline) => {
      if (initialRender) {
        initialRender = false;
        return;
      }
      if (isOnline) {
        setToastMessage('📶 Network restored: Cloud Escrow & WebRTC sync active.');
      } else {
        setToastMessage('⚡ You are offline: Changes saved locally in preview mode.');
      }
    });
  }, []);

  // Persistent user identity is owned by Firebase Auth/Firestore.
  // Do not store skillswap_user as an authoritative identity cache.

  useEffect(() => {
    localStorage.setItem('skillswap_skills', JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    localStorage.setItem('skillswap_proposals', JSON.stringify(proposals));
  }, [proposals]);

  useEffect(() => {
    localStorage.setItem('skillswap_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('skillswap_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('skillswap_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem('skillswap_bookmarked_skills', JSON.stringify(bookmarkedSkillIds));
  }, [bookmarkedSkillIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handles the redirect back from PayPal's approval page. PayPal no
  // longer gets captured immediately at order-creation time (that skipped
  // the buyer ever actually approving the payment) - now we only capture
  // once PayPal sends the buyer back here with the order id. The actual
  // credit is added server-side inside capturePaypalOrder's real capture
  // check; this effect just triggers that call and gives UI feedback.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paypal_return') !== 'true') return;

    const orderId = params.get('token');
    // Clean the URL immediately so a refresh doesn't re-trigger capture.
    window.history.replaceState({}, '', window.location.pathname);

    if (!orderId) return;
    api.capturePaypalOrder(orderId)
      .then(() => showToast('Payment confirmed! Your credits will appear shortly.'))
      .catch((err) => showToast(err.message || 'Could not confirm your PayPal payment.'));
  }, []);

  // Stripe redirects back here after its own hosted checkout. This is
  // purely a UX confirmation - the actual credit was already (or will
  // shortly be) added by Stripe's signed webhook, never by this redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_success') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      showToast('Payment successful! Your credits will appear shortly.');
    } else if (params.get('stripe_cancel') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      showToast('Checkout cancelled - no charge was made.');
    }
  }, []);

  const handleToggleBookmark = (skillId: string) => {
    setBookmarkedSkillIds((prev) => {
      const isBookmarked = prev.includes(skillId);
      if (isBookmarked) {
        showToast('Removed skill from Saved Listings');
        return prev.filter((id) => id !== skillId);
      } else {
        showToast('Saved skill to your bookmarks!');
        return [...prev, skillId];
      }
    });
  };

  const handleSearchSubmit = (query: string) => {
    const trimmed = query.trim();
    setSearchQuery(query);
    if (trimmed) {
      setRecentSearches((prev) => {
        const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
        return [trimmed, ...filtered].slice(0, 5);
      });
    }
  };

  const handleRemoveRecentSearch = (queryToRemove: string) => {
    setRecentSearches((prev) => prev.filter((q) => q !== queryToRemove));
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleSelectRecentSearch = (query: string) => {
    setSearchQuery(query);
    handleSearchSubmit(query);
  };

  const handleSelectTag = (tag: string) => {
    setActiveTab('explore');
    setSavedOnly(false);
    handleSearchSubmit(tag);
    showToast(`Filtering marketplace for "${tag}"`);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  // Filter skills
  const filteredSkills = skills.filter((skill) => {
    const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || skill.level === selectedDifficulty;
    const matchesAvailability =
      selectedAvailability === 'All' ||
      skill.availability.some((a) => a.toLowerCase().includes(selectedAvailability.toLowerCase())) ||
      (skill.nextAvailableSlot && skill.nextAvailableSlot.toLowerCase().includes(selectedAvailability.toLowerCase()));

    const matchesSearch =
      !searchQuery ||
      skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const isVerifiedMentor = (skill.completedSessionsCount ?? skill.userReviewCount) > 5;
    const matchesVerified = !verifiedOnly || isVerifiedMentor;

    const isBookmarked = bookmarkedSkillIds.includes(skill.id);
    const matchesSaved = !savedOnly || isBookmarked;

    return matchesCategory && matchesDifficulty && matchesAvailability && matchesSearch && matchesVerified && matchesSaved;
  });

  // Handlers
  const handleOpenProposeModal = (skill: Skill) => {
    setProposalTargetSkill(skill);
  };

  const handleSendProposal = (newPropData: Omit<SwapProposal, 'id' | 'createdAt'>) => {
    const newProp: SwapProposal = {
      ...newPropData,
      id: `prop_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setProposals([newProp, ...proposals]);
    addProposalToCloud(newProp).catch((err) => console.warn('[App] Proposal cloud save warning:', err));
    showToast(`Proposal sent to ${newProp.recipientName}!`);

    // Add initial message
    const initialMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      swapProposalId: newProp.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      message: newProp.pitchMessage,
      timestamp: 'Just now',
    };
    setMessages((prev) => [...prev, initialMsg]);
    addMessageToCloud(initialMsg).catch((err) => console.warn('[App] Initial message cloud save warning:', err));
  };

  const handleAcceptProposal = async (proposalId: string) => {
    // Previously this built the Session object entirely client-side (and
    // never actually set mentorId/learnerId on it - only names - which
    // would have made the session invisible to the Firestore-scoped
    // listeners). It also never moved any credits into escrow. Now the
    // server does all of it atomically: locks the learner's credits (if
    // the swap uses time credits), creates the session with correct
    // participant ids, and updates the proposal status. The Firestore
    // listeners in useCloudStateBridge pick up the new/changed documents
    // automatically - no local state mutation needed here.
    try {
      const token = await getToken();
      if (!token) {
        showToast('Please sign in again to accept this proposal.');
        return;
      }
      const res = await fetch(`/api/proposals/${proposalId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Could not accept this proposal.');
        return;
      }
      showToast('Swap agreement confirmed! Session added to your schedule.');
    } catch (err) {
      console.error('[App] Failed to accept proposal:', err);
      showToast('Something went wrong accepting this proposal. Please try again.');
    }
  };

  const handleDeclineProposal = async (proposalId: string) => {
    // Previously this permanently removed the proposal from local state -
    // both parties would lose all record it ever existed, and there was
    // no server-side check that the decliner was actually the recipient.
    // Now it's a status change, enforced server-side.
    try {
      const token = await getToken();
      if (!token) {
        showToast('Please sign in again.');
        return;
      }
      const res = await fetch(`/api/proposals/${proposalId}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Could not decline this proposal.');
        return;
      }
      showToast('Swap proposal declined.');
    } catch (err) {
      console.error('[App] Failed to decline proposal:', err);
      showToast('Something went wrong declining this proposal. Please try again.');
    }
  };

  const handleSendMessage = (proposalId: string, text: string) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      swapProposalId: proposalId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      message: text,
      timestamp: 'Just now',
    };
    setMessages([...messages, newMsg]);
    addMessageToCloud(newMsg).catch((err) => console.warn('[App] Message cloud save warning:', err));
  };

  const handleAddSkill = (newSkill: Skill) => {
    setSkills([newSkill, ...skills]);
    addSkillToCloud(newSkill).catch((err) => console.warn('[App] Skill cloud save warning:', err));
    setCurrentUser({
      ...currentUser,
      skillsOffered: [...currentUser.skillsOffered, newSkill.title],
    });
    showToast('New skill listing published to community marketplace!');
  };

  const handleCompleteSession = async (sessionId: string, ratingVal: number, feedbackVal: string) => {
    // Previously this incremented currentUser.timeCredits directly in React
    // state - anyone could trigger this handler (or just call setCurrentUser
    // from devtools) to give themselves unlimited credits. Now the server
    // verifies the caller is an actual participant in the session, releases
    // any escrowed credits to the mentor in a single transaction, and marks
    // the session completed - guarded so it can only ever happen once per
    // session. The updated balance arrives via the user document listener.
    try {
      const token = await getToken();
      if (!token) {
        showToast('Please sign in again.');
        return;
      }
      const res = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: ratingVal, feedback: feedbackVal }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Could not complete this session.');
        return;
      }
      showToast('Session marked complete! Time credits have been settled.');
    } catch (err) {
      console.error('[App] Failed to complete session:', err);
      showToast('Something went wrong completing this session. Please try again.');
    }
  };

  const pendingCount = currentUser
    ? proposals.filter((p) => p.status === 'pending' && p.recipientId === currentUser.id).length
    : 0;

  // ------------------------------------------------------------------
  // PHASE 3 AUTHENTICATION GATE
  //
  // Firebase Auth is the only source of authenticated identity.
  // Never render the protected marketplace with a null user.
  // ------------------------------------------------------------------

  if (authLoading || cloudLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
          </div>

          <div>
            <h1 className="text-xl font-black text-white">
              Loading SkillSwap
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Restoring your secure Firebase session and synchronizing your profile…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseAuthUser || !cloudAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl text-center space-y-5">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white">
                Sign in to SkillSwap
              </h1>

              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Your SkillSwap profile, swaps, messages, sessions and time
                credits are protected by Firebase Authentication.
              </p>
            </div>

            {(authError || cloudError) && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                {authError || cloudError}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              Sign In / Create Account
            </button>
          </div>

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => {
              setIsAuthModalOpen(false);
              showToast('Authentication successful. Welcome to SkillSwap!');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Global Real-time Notification Listener & Email Alert Triggers */}
      <GlobalNotificationListener
        currentUser={currentUser}
        proposals={proposals}
        messages={messages}
        showToast={showToast}
        setActiveTab={setActiveTab}
      />
      <EmailToastAlert />

      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        proposals={proposals}
        messages={messages}
        onNewProposalSimulated={(p) => setProposals((prev) => [p, ...prev])}
        onNewMessageSimulated={(m) => setMessages((prev) => [...prev, m])}
        showToast={showToast}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onOpenPostSkill={() => setIsPostSkillOpen(true)}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStripeCheckout={() => setIsUnifiedCheckoutOpen(true)}
        onOpenCheckout={() => setIsUnifiedCheckoutOpen(true)}
        pendingProposalsCount={pendingCount}
      />

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl border border-indigo-400/50 animate-in slide-in-from-bottom-5 duration-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab 1: Explore Marketplace */}
        {activeTab === 'explore' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 border border-slate-800 shadow-2xl">
              <div className="max-w-2xl space-y-3 relative z-10">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30 uppercase tracking-wider">
                  Peer-To-Peer Knowledge Sharing
                </span>
                
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Swap What You Know. <br />
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                    Learn What You Love.
                  </span>
                </h1>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Connect with passionate community mentors to exchange skills 1-on-1. Teach coding, guitar, or photography — and learn languages, baking, or fitness in return!
                </p>

                <div className="pt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('matchmaker')}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span>Find My AI Skill Twin</span>
                  </button>

                  <button
                    onClick={() => setIsPostSkillOpen(true)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
                  >
                    Offer a Skill to Teach
                  </button>
                </div>
              </div>
            </div>

            {/* AI Suggested For You Section */}
            <SuggestedForYouSection
              currentUser={currentUser}
              skills={skills}
              onViewDetail={(s) => setDetailSkill(s)}
              onOpenPreview={(s) => setPreviewSkill(s)}
              onProposeSwap={(s) => handleOpenProposeModal(s)}
              bookmarkedSkillIds={bookmarkedSkillIds}
              onToggleBookmark={handleToggleBookmark}
            />

            {/* Visual Skill Categories Browse Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-100 tracking-tight">
                    Browse Skill Categories
                  </h2>
                </div>
                {selectedCategory !== 'All' && (
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                  >
                    <span>Show All Categories</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {CATEGORIES.map((cat) => {
                  const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['All'];
                  const isSelected = selectedCategory === cat;
                  const catCount = skills.filter((s) => cat === 'All' || s.category === cat).length;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        if (savedOnly) setSavedOnly(false);
                      }}
                      className={`group relative flex flex-col items-center justify-between p-3.5 rounded-2xl border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/40'
                          : `bg-slate-900/80 hover:bg-slate-800/80 border-slate-800/90 ${config.border}`
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${config.bg} ${config.color} mb-2.5 group-hover:scale-110 transition-transform`}>
                        {config.icon}
                      </div>

                      <div className="space-y-0.5">
                        <span className={`block text-xs font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                          {cat}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-400">
                          {catCount} {catCount === 1 ? 'skill' : 'skills'}
                        </span>
                      </div>

                      {isSelected && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Marketplace Search & Recent Searches Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
              <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(searchQuery); }} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" />
                  <input
                    type="text"
                    placeholder="Search marketplace skills (e.g. Spanish, React, Guitar, Photography, Cooking)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Clear text"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </form>

              {/* Recent Searches Horizontal Scrollable List */}
              {recentSearches.length > 0 && (
                <div className="pt-1 flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 shrink-0 mr-1 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Recent Searches:</span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                    {recentSearches.map((query) => (
                      <div
                        key={query}
                        className={`group flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all shrink-0 cursor-pointer ${
                          searchQuery.toLowerCase() === query.toLowerCase()
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white hover:border-slate-600'
                        }`}
                        onClick={() => handleSelectRecentSearch(query)}
                      >
                        <span className="hover:underline">{query}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRecentSearch(query);
                          }}
                          className="p-0.5 rounded-full text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"
                          title={`Remove "${query}"`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleClearRecentSearches}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 shrink-0"
                      title="Clear all recent searches"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Category, Difficulty & Availability Filters */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              {/* Category Filter Pills */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                    Category:
                  </span>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSavedOnly(!savedOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                      savedOnly
                        ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-md shadow-amber-900/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? 'text-amber-400 fill-current' : 'text-slate-500'}`} />
                    <span>Saved ({bookmarkedSkillIds.length})</span>
                    {savedOnly && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                      verifiedOnly
                        ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-900/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Award className={`w-3.5 h-3.5 ${verifiedOnly ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>Verified Mentors</span>
                    <span className={`w-2 h-2 rounded-full ${verifiedOnly ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  </button>
                </div>
              </div>

              {/* Secondary Filters: Difficulty & Availability */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                {/* Difficulty filter */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    Difficulty:
                  </span>
                  {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedDifficulty(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedDifficulty === lvl
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                {/* Availability filter */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Availability:
                  </span>
                  {['All', 'Weekend', 'Evening', 'Weekday'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedAvailability(slot)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedAvailability === slot
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {slot === 'All' ? 'Any Time' : slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Skill Cards Grid */}
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onViewDetail={(s) => setDetailSkill(s)}
                    onOpenPreview={(s) => setPreviewSkill(s)}
                    onProposeSwap={(s) => handleOpenProposeModal(s)}
                    isBookmarked={bookmarkedSkillIds.includes(skill.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onSelectTag={handleSelectTag}
                  />
                ))}
              </div>
            </AnimatePresence>

            {filteredSkills.length === 0 && (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                {savedOnly ? (
                  <>
                    <Bookmark className="w-10 h-10 text-amber-400/80 mx-auto" />
                    <h3 className="text-base font-bold text-slate-200">No Saved Listings</h3>
                    <p className="text-xs text-slate-400">Click the bookmark icon on any skill card to save listings for quick access.</p>
                    <button
                      onClick={() => setSavedOnly(false)}
                      className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                    >
                      Show All Skills
                    </button>
                  </>
                ) : skills.length === 0 ? (
                  <>
                    <Compass className="w-12 h-12 text-indigo-400/80 mx-auto" />
                    <h3 className="text-base font-bold text-slate-200">No Skills in Community Yet</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Your live database is connected and ready. Share your knowledge or offer a skill to get the marketplace started!
                    </p>
                    <button
                      onClick={() => setIsPostSkillOpen(true)}
                      className="mt-3 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Post the First Skill
                    </button>
                  </>
                ) : (
                  <>
                    <Compass className="w-10 h-10 text-slate-600 mx-auto" />
                    <h3 className="text-base font-bold text-slate-200">No Matching Skills Found</h3>
                    <p className="text-xs text-slate-400">Try adjusting your search query or selected category filter.</p>
                  </>
                )}
              </div>
            )}

          </div>
        )}

        {/* Tab 2: AI Smart Matchmaker */}
        {activeTab === 'requested' && (
          <RequestedSkillsView
            currentUser={currentUser}
            skills={skills}
            onProposeSwap={(s) => handleOpenProposeModal(s)}
            showToast={showToast}
          />
        )}

        {/* Tab 2: AI Smart Matchmaker */}
        {activeTab === 'matchmaker' && (
          <AIMatchmaker
            currentUser={currentUser}
            skills={skills}
            onProposeSwap={(s) => handleOpenProposeModal(s)}
            onViewDetail={(s) => setDetailSkill(s)}
          />
        )}

        {/* Tab: Nearby Map Discovery */}
        {activeTab === 'nearby' && (
          <NearbySkillMapView
            skills={skills}
            currentUser={currentUser}
            onSelectSkill={(s) => setDetailSkill(s)}
            onProposeSwap={(s) => handleOpenProposeModal(s)}
          />
        )}

        {/* Tab: AI Voice & Pronunciation Coach */}
        {activeTab === 'voiceCoach' && (
          <VoicePronunciationCoachModal
            isOpen={true}
            onClose={() => setActiveTab('explore')}
          />
        )}

        {/* Tab 3: Skill Roadmaps */}
        {activeTab === 'roadmap' && (
          <SkillRoadmap
            skills={skills}
            onProposeSwap={(s) => handleOpenProposeModal(s)}
            onViewDetail={(s) => setDetailSkill(s)}
          />
        )}

        {/* Tab 4: Availability Calendar */}
        {activeTab === 'calendar' && (
          <AvailabilityCalendar
            skills={skills}
            onProposeSwap={(s) => handleOpenProposeModal(s)}
            showToast={showToast}
          />
        )}

        {/* Tab 5: Mentor Success Stories */}
        {activeTab === 'stories' && (
          <MentorSuccessStories />
        )}

        {/* Tab 3: My Swaps & Sessions */}
        {activeTab === 'swaps' && (
          <MySwapsView
            currentUser={currentUser}
            proposals={proposals}
            sessions={sessions.filter((s) => s.status !== 'completed' && s.status !== 'cancelled')}
            onAcceptProposal={handleAcceptProposal}
            onDeclineProposal={handleDeclineProposal}
            onOpenSessionRoom={(sess) => setActiveSessionRoom(sess)}
            onOpenChat={(propId) => {
              setSelectedProposalChatId(propId);
              setActiveTab('chat');
            }}
            onOpenCalendarSync={(sess) => setCalendarSyncSession(sess)}
          />
        )}

        {/* Tab 4: Messages */}
        {activeTab === 'chat' && (
          <ChatPortal
            currentUser={currentUser}
            proposals={proposals}
            messages={messages}
            selectedProposalId={selectedProposalChatId}
            onSelectProposal={(propId) => setSelectedProposalChatId(propId)}
            onSendMessage={handleSendMessage}
            onStartCall={(proposalId, callType, peerName, peerAvatar, skillTitle) => {
              setActiveCall({
                isOpen: true,
                proposalId,
                peerName,
                peerAvatar,
                skillTitle,
                callType,
              });
            }}
            showToast={showToast}
          />
        )}

        {/* Tab 5: Time Credit Bank */}
        {activeTab === 'credits' && (
          <TimeCreditsView
            currentUser={currentUser}
            onExploreSkills={() => setActiveTab('explore')}
            onPostSkill={() => setIsPostSkillOpen(true)}
            onOpenInviteModal={() => setIsInviteModalOpen(true)}
            onOpenStripeCheckout={() => setIsUnifiedCheckoutOpen(true)}
            onOpenCheckout={() => setIsUnifiedCheckoutOpen(true)}
          />
        )}

        {/* Tab 6: User Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <ProfileView
              currentUser={currentUser}
              onUpdateUser={setCurrentUser}
              userSkills={skills.filter((s) => s.userId === currentUser.id)}
              reviews={reviews}
              onOpenPostSkill={() => setIsPostSkillOpen(true)}
              showToast={showToast}
            />
            {/* Gamification Badges & Learning Analytics Integration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GamificationBadges currentUser={currentUser} />
              <LearningAnalytics currentUser={currentUser} sessions={sessions} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PeerRatingsChart reviews={reviews} />
              {/*
                SwapContractsView expects a `swaps: SwapContract[]` prop
                plus onRefresh/onEnterLiveStudio/onOpenCheckout - none of
                which were ever passed here. `swaps` was `undefined`, so
                `swaps.filter(...)` inside the component threw immediately
                on render - this tab crashed for every real user who
                opened it. The SwapContract data model it's built around
                (formal contracts, multi-stage escrow with dispute
                mediation, calendar sync, certificates) has no backend
                anywhere in this project - unlike Session/SwapProposal,
                which now has real, working escrow (see Session
                management flow above). Passing an empty array here stops
                the crash and shows a real (accurate) empty state instead
                of fabricating data. Building the SwapContract feature out
                for real is a separate, sizable feature addition - it
                should NOT be done as a quick patch alongside a
                security/correctness pass.
              */}
              <SwapContractsView
                currentUser={currentUser}
                swaps={[]}
                onRefresh={() => {}}
                onEnterLiveStudio={() => showToast('Live studio is not available yet.')}
                onOpenCheckout={() => setIsUnifiedCheckoutOpen(true)}
              />
            </div>
          </div>
        )}

      </main>

      {/* Floating Action Button for Saved Listings */}
      {bookmarkedSkillIds.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setActiveTab('explore');
            setSavedOnly(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-3 rounded-full shadow-2xl shadow-amber-500/20 flex items-center gap-2 border border-amber-300 transition-all active:scale-95 group"
          title="View Saved Listings"
        >
          <Bookmark className="w-5 h-5 fill-current text-slate-950 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-extrabold uppercase tracking-wide">Saved ({bookmarkedSkillIds.length})</span>
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SkillSwap 5.0 Community Platform. Empowering peer-to-peer knowledge exchange.</p>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <button onClick={() => setActiveTab('explore')} className="hover:text-indigo-400">Marketplace</button>
            <button onClick={() => setActiveTab('matchmaker')} className="hover:text-indigo-400">AI Matchmaker</button>
            <button onClick={() => setActiveTab('credits')} className="hover:text-indigo-400">Time Bank</button>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-indigo-400">Settings Hub</button>
            <button onClick={() => setIsTermsPrivacyOpen(true)} className="hover:text-indigo-400">Terms & Privacy</button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {detailSkill && (
        <SkillDetailModal
          skill={detailSkill}
          reviews={reviews}
          onClose={() => setDetailSkill(null)}
          onProposeSwap={(s) => handleOpenProposeModal(s)}
          onOpenPreview={(s) => setPreviewSkill(s)}
        />
      )}

      {previewSkill && (
        <SkillPreviewModal
          skill={previewSkill}
          isOpen={!!previewSkill}
          onClose={() => setPreviewSkill(null)}
          onProposeSwap={(s) => handleOpenProposeModal(s)}
          isBookmarked={bookmarkedSkillIds.includes(previewSkill.id)}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      <AnimatePresence>
        {proposalTargetSkill && (
          <ProposalModal
            targetSkill={proposalTargetSkill}
            currentUser={currentUser}
            onClose={() => setProposalTargetSkill(null)}
            onSubmitProposal={handleSendProposal}
          />
        )}
      </AnimatePresence>

      {activeSessionRoom && (
        <SessionRoomModal
          session={activeSessionRoom}
          currentUser={currentUser}
          onClose={() => setActiveSessionRoom(null)}
          onCompleteSession={handleCompleteSession}
        />
      )}

      {isPostSkillOpen && (
        <PostSkillModal
          currentUser={currentUser}
          onClose={() => setIsPostSkillOpen(false)}
          onAddSkill={handleAddSkill}
        />
      )}

      <InviteFriendModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        currentUser={currentUser}
        showToast={showToast}
      />

      {activeCall && activeCall.isOpen && (
        <CallActionModal
          isOpen={activeCall.isOpen}
          onClose={() => setActiveCall(null)}
          proposalId={activeCall.proposalId}
          peerName={activeCall.peerName}
          peerAvatar={activeCall.peerAvatar}
          skillTitle={activeCall.skillTitle}
          callType={activeCall.callType}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        currentUser={currentUser}
        skills={skills}
        onOpenRoadmap={(skillTitle) => {
          setActiveTab('roadmap');
          setIsAIAssistantOpen(false);
        }}
        showToast={showToast}
      />

      <SettingsHubModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser((prev) => ({ ...prev, ...updated }));
        }}
        onOpenTermsPrivacy={() => setIsTermsPrivacyOpen(true)}
        onLogout={() => {
          logout().catch((err) => console.error('[App] Logout failed:', err));
        }}
        showToast={showToast}
      />

      <TermsPrivacyModal
        isOpen={isTermsPrivacyOpen}
        onClose={() => setIsTermsPrivacyOpen(false)}
      />

      <StripeCheckoutModal
        isOpen={isStripeCheckoutOpen}
        onClose={() => setIsStripeCheckoutOpen(false)}
        currentUser={currentUser}
        onAddCredits={(amount) => {
          setCurrentUser((prev) => ({
            ...prev,
            timeCredits: (prev.timeCredits || 0) + amount,
          }));
        }}
        showToast={showToast}
      />

      <UnifiedCheckoutModal
        isOpen={isUnifiedCheckoutOpen}
        onClose={() => setIsUnifiedCheckoutOpen(false)}
        currentUser={currentUser}
        onSuccess={(amount) => {
          setCurrentUser((prev) => ({
            ...prev,
            timeCredits: (prev.timeCredits || 0) + amount,
          }));
        }}
        showToast={showToast}
      />

      <EmailNotificationsModal
        isOpen={isEmailNotificationsOpen}
        onClose={() => setIsEmailNotificationsOpen(false)}
        currentUser={currentUser}
        showToast={showToast}
      />

      <AuditDashboardModal
        isOpen={isAuditDashboardOpen}
        onClose={() => setIsAuditDashboardOpen(false)}
      />

      {isBadgesModalOpen && (
        <BadgesAndAchievementsModal
          onClose={() => setIsBadgesModalOpen(false)}
          user={currentUser}
        />
      )}

      {isPortfolioModalOpen && (
        <PortfolioShowcaseModal
          onClose={() => setIsPortfolioModalOpen(false)}
          user={currentUser}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => showToast('✨ Authentication successful! Profile synchronized with Firestore.')}
      />

      {calendarSyncSession && (
        <CalendarSyncModal
          session={calendarSyncSession}
          currentUser={currentUser}
          onClose={() => setCalendarSyncSession(null)}
          onConfirmSchedule={(d, t) => {
            showToast(`📅 Session schedule updated for ${d} at ${t}`);
          }}
        />
      )}

    </div>
  );
}
