import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Coins,
  Repeat,
  Compass,
  Video,
  PlusCircle,
  Activity,
  Lock,
  ChevronDown,
  UserCheck,
  Layers,
  Award,
  FolderGit2,
  Mail,
  Sun,
  Moon,
} from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeTab: 'marketplace' | 'swaps' | 'live_room' | 'wallet' | 'audit';
  setActiveTab: (tab: 'marketplace' | 'swaps' | 'live_room' | 'wallet' | 'audit') => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (userId: string) => void;
  onOpenCreateListing: () => void;
  onOpenCheckout: () => void;
  onOpenAudit: () => void;
  onOpenBadges: () => void;
  onOpenPortfolio: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  activeSwapCount: number;
  liveSessionSwapId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenCreateListing,
  onOpenCheckout,
  onOpenAudit,
  onOpenBadges,
  onOpenPortfolio,
  onOpenNotifications,
  unreadNotificationCount = 0,
  activeSwapCount,
  liveSessionSwapId,
}) => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('marketplace')}
              className="flex items-center gap-2 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">SkillSwap</span>
                  <span className="bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/80">
                    5.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">P2P Escrow & Multi-Gateway Time Bank</p>
              </div>
            </button>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'marketplace'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              Marketplace
            </button>

            <button
              onClick={() => setActiveTab('swaps')}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'swaps'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Repeat className="w-4 h-4" />
              Swaps & Contracts
              {activeSwapCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {activeSwapCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('live_room')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'live_room'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="relative">
                <Video className="w-4 h-4" />
                {liveSessionSwapId && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                )}
              </div>
              Live Studio
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'wallet'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Coins className="w-4 h-4" />
              Time Wallet
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'audit'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                  : 'text-teal-700 dark:text-teal-400 bg-teal-50/80 dark:bg-teal-950/40 hover:bg-teal-100/80 dark:hover:bg-teal-900/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Audit
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Badges & Portfolio Quick Buttons */}
            <button
              onClick={onOpenBadges}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/80 rounded-lg transition-colors"
              title="View Reputation Badges & Mastery Level"
            >
              <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Badges</span>
            </button>

            <button
              onClick={onOpenPortfolio}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
              title="View Portfolio & Proof of Work"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Portfolio</span>
            </button>

            {/* Mail & Email Notifications Center */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-all shadow-sm focus:outline-none"
                title="Open Simulated Email Inbox & Contract Alerts"
              >
                <Mail className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-900 animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Global Theme Toggle Button (Light / Dark Mode) */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="relative p-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-all shadow-sm focus:outline-none"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
              )}
            </button>

            {/* Post Skill Button */}
            <button
              onClick={onOpenCreateListing}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Post Skill
            </button>

            {/* Time Credit Wallet Badge & Quick Buy */}
            <div className="flex items-center bg-slate-900 dark:bg-slate-950 text-white rounded-xl p-1 shadow-sm border border-transparent dark:border-slate-800">
              <button
                onClick={() => setActiveTab('wallet')}
                className="flex items-center gap-2 px-2.5 py-1 hover:bg-slate-800 dark:hover:bg-slate-900 rounded-lg transition-colors"
                title="View your time banking balance & escrow ledger"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <div className="text-xs font-bold leading-none text-amber-300">
                    {currentUser.timeCredits.toFixed(1)} hrs
                  </div>
                  {currentUser.escrowLockedCredits > 0 && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-0.5 leading-none mt-0.5">
                      <Lock className="w-2.5 h-2.5 text-indigo-400" />
                      {currentUser.escrowLockedCredits.toFixed(1)} locked
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={onOpenCheckout}
                className="ml-1 px-2 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-inner flex items-center gap-1"
                title="Buy Time Credits via Stripe, M-Pesa, or PayPal"
              >
                <PlusCircle className="w-3 h-3" />
                Top Up
              </button>
            </div>

            {/* User Switcher Dropdown (for testing P2P interactions) */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 transition-colors focus:outline-none"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
                <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[80px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Test User (P2P Simulator)
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {allUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u.id);
                          setUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition-colors ${
                          u.id === currentUser.id ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{u.title}</p>
                        </div>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-medium text-slate-700 dark:text-slate-300">
                          {u.timeCredits.toFixed(1)}h
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 px-2 space-y-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenBadges();
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg flex items-center gap-2"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      View Reputation Badges
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenPortfolio();
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg flex items-center gap-2"
                    >
                      <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                      View Portfolio Showcase
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex flex-col items-center py-1 ${activeTab === 'marketplace' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Compass className="w-4 h-4 mb-0.5" />
            Market
          </button>
          <button
            onClick={() => setActiveTab('swaps')}
            className={`flex flex-col items-center py-1 relative ${activeTab === 'swaps' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Repeat className="w-4 h-4 mb-0.5" />
            Swaps
            {activeSwapCount > 0 && (
              <span className="absolute top-0 right-1 w-2 h-2 bg-indigo-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('live_room')}
            className={`flex flex-col items-center py-1 ${activeTab === 'live_room' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Video className="w-4 h-4 mb-0.5" />
            Studio
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center py-1 ${activeTab === 'wallet' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Coins className="w-4 h-4 mb-0.5" />
            Wallet
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex flex-col items-center py-1 ${activeTab === 'audit' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <ShieldCheck className="w-4 h-4 mb-0.5" />
            Audit
          </button>
        </div>

      </div>
    </header>
  );
};

