import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Clock, 
  MessageSquare, 
  Calendar, 
  User as UserIcon, 
  PlusCircle, 
  Compass, 
  Zap,
  BookOpen,
  Map,
  Award,
  HelpCircle,
  Gift,
  UserPlus,
  Wifi,
  WifiOff,
  Bot,
  Settings,
  CreditCard,
  MapPin,
  Mic
} from 'lucide-react';
import { User, SwapProposal, ChatMessage } from '../types';
import { networkNotifier } from '../utils/networkNotifier';
import { GlobalNotificationListener } from './GlobalNotificationListener';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  proposals: SwapProposal[];
  messages: ChatMessage[];
  onNewProposalSimulated?: (p: SwapProposal) => void;
  onNewMessageSimulated?: (m: ChatMessage) => void;
  showToast: (msg: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  onOpenPostSkill: () => void;
  onOpenInviteModal?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenSettings?: () => void;
  onOpenStripeCheckout?: () => void;
  pendingProposalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  proposals,
  messages,
  onNewProposalSimulated,
  onNewMessageSimulated,
  showToast,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onOpenPostSkill,
  onOpenInviteModal,
  onOpenAIAssistant,
  onOpenSettings,
  onOpenStripeCheckout,
  pendingProposalsCount,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(networkNotifier.isOnline);

  useEffect(() => {
    return networkNotifier.subscribe((online) => {
      setIsOnline(online);
    });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('explore')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                SkillSwap
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 ml-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Peer Exchange
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search skills (e.g., Spanish, React, Guitar, Photography)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Online / Offline Network Status Indicator Pill */}
            <div 
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                isOnline
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
              }`}
              title={isOnline ? 'Online — Cloud Escrow Synchronized' : 'Offline Mode — Local Storage Cache Active'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* AI Assistant Drawer Trigger Button */}
            {onOpenAIAssistant && (
              <button
                onClick={onOpenAIAssistant}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Open AI Skill Mentor & Assistant"
              >
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">AI Mentor</span>
              </button>
            )}

            {/* Time Credits Badge */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('credits')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  activeTab === 'credits'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                    : 'bg-slate-800 border-slate-700/60 text-slate-300 hover:border-amber-500/30 hover:text-amber-300'
                }`}
                title="Your Time Credit Balance (1 Credit = 1 Hour Taught)"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-amber-300">{currentUser.timeCredits}</span>
                <span className="hidden sm:inline text-slate-400">Credits</span>
              </button>

              {onOpenStripeCheckout && (
                <button
                  onClick={onOpenStripeCheckout}
                  className="p-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  title="Buy Time Credits via Stripe"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Buy</span>
                </button>
              )}
            </div>

            {/* Settings Hub Button */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-all cursor-pointer"
                title="Open Settings Hub & Account Preferences"
              >
                <Settings className="w-4 h-4 text-slate-300" />
              </button>
            )}

            {/* Global Notification Listener Bell & Real-time Engine */}
            <GlobalNotificationListener
              currentUser={currentUser}
              proposals={proposals}
              messages={messages}
              onNewProposalSimulated={onNewProposalSimulated}
              onNewMessageSimulated={onNewMessageSimulated}
              showToast={showToast}
              setActiveTab={setActiveTab}
            />

            {/* Invite Friends Button */}
            {onOpenInviteModal && (
              <button
                onClick={onOpenInviteModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Invite Friends & Earn +1 Credit"
              >
                <Gift className="w-3.5 h-3.5 text-indigo-400" />
                <span>Invite (+1 Cr)</span>
              </button>
            )}

            {/* Post Skill Button */}
            <button
              onClick={onOpenPostSkill}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Offer / Request Skill</span>
              <span className="sm:hidden">Post</span>
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`relative rounded-full p-0.5 transition-all ${
                activeTab === 'profile'
                  ? 'ring-2 ring-indigo-500'
                  : 'hover:ring-2 hover:ring-slate-600'
              }`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            </button>
          </div>
        </div>

        {/* Search Bar Mobile */}
        <div className="pb-3 pt-1 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search skills (Spanish, React, Guitar)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Navigation Bar Tabs */}
        <nav className="flex items-center justify-between border-t border-slate-800/80 overflow-x-auto scrollbar-none py-1.5 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'explore'
                  ? 'bg-slate-800 text-indigo-400 font-semibold'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </button>

            <button
              onClick={() => setActiveTab('requested')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'requested'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Requested Skills</span>
            </button>

            <button
              onClick={() => setActiveTab('matchmaker')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'matchmaker'
                  ? 'bg-indigo-950/60 text-indigo-300 font-semibold border border-indigo-800/50'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Smart Matchmaker</span>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.5 rounded-full border border-purple-500/30 font-bold">
                Smart
              </span>
            </button>

            <button
              onClick={() => setActiveTab('nearby')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'nearby'
                  ? 'bg-indigo-950/80 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Nearby Map</span>
            </button>

            <button
              onClick={() => setActiveTab('voiceCoach')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'voiceCoach'
                  ? 'bg-purple-950/80 text-purple-300 font-semibold border border-purple-500/30'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Mic className="w-4 h-4 text-purple-400" />
              <span>AI Voice Coach</span>
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'roadmap'
                  ? 'bg-slate-800 text-indigo-400 font-semibold'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Map className="w-4 h-4 text-indigo-400" />
              <span>Skill Roadmaps</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Availability Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('stories')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'stories'
                  ? 'bg-slate-800 text-purple-400 font-semibold'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Award className="w-4 h-4 text-purple-400" />
              <span>Success Stories</span>
            </button>

            <button
              onClick={() => setActiveTab('swaps')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap relative ${
                activeTab === 'swaps'
                  ? 'bg-slate-800 text-indigo-400 font-semibold'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>My Swaps & Sessions</span>
              {pendingProposalsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingProposalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-slate-800 text-indigo-400 font-semibold'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </button>

            <button
              onClick={() => setActiveTab('credits')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'credits'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Time Bank</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-slate-800 text-indigo-400 font-semibold'
                : 'hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>My Profile</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
