import React, { useState } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Star, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Medal,
  Clock,
  Users,
  BookOpen,
  Gift,
  HelpCircle
} from 'lucide-react';

export interface GamificationBadgeItem {
  id: string;
  title: string;
  category: 'teaching' | 'learning' | 'escrow' | 'community';
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  progressPercent: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  iconName: string;
  rewardText: string;
}

const GAMIFICATION_BADGES: GamificationBadgeItem[] = [
  {
    id: 'b1',
    title: 'Master Mentor',
    category: 'teaching',
    tier: 'Gold',
    description: 'Complete over 20 hours of verified 1-on-1 peer teaching sessions.',
    unlocked: true,
    unlockedAt: 'Aug 1, 2026',
    progressPercent: 100,
    currentValue: 48,
    targetValue: 20,
    unit: 'hours',
    iconName: 'Award',
    rewardText: 'Unlocked Gold Profile Frame & Priority Search Ranking'
  },
  {
    id: 'b2',
    title: 'Escrow Sentinel 5.0',
    category: 'escrow',
    tier: 'Platinum',
    description: 'Settle 15 time credit escrow transactions with zero disputes.',
    unlocked: true,
    unlockedAt: 'Jul 28, 2026',
    progressPercent: 100,
    currentValue: 15,
    targetValue: 15,
    unit: 'swaps',
    iconName: 'ShieldCheck',
    rewardText: 'Instant Escrow Auto-Release Privileges'
  },
  {
    id: 'b3',
    title: '5-Star Quality Anchor',
    category: 'teaching',
    tier: 'Platinum',
    description: 'Maintain an average rating above 4.8 across 10 consecutive reviews.',
    unlocked: true,
    unlockedAt: 'Aug 3, 2026',
    progressPercent: 100,
    currentValue: 4.9,
    targetValue: 4.8,
    unit: 'stars',
    iconName: 'Star',
    rewardText: 'Verified Quality Badge on all posted skills'
  },
  {
    id: 'b4',
    title: 'Swap Streak Master',
    category: 'community',
    tier: 'Silver',
    description: 'Complete at least 1 skill swap every week for 4 consecutive weeks.',
    unlocked: false,
    progressPercent: 75,
    currentValue: 3,
    targetValue: 4,
    unit: 'weeks',
    iconName: 'Flame',
    rewardText: '+2 Bonus Time Credits upon unlock'
  },
  {
    id: 'b5',
    title: 'Polymath Scholar',
    category: 'learning',
    tier: 'Gold',
    description: 'Learn skills from 3 entirely different categories (e.g. Code, Music, Language).',
    unlocked: false,
    progressPercent: 66,
    currentValue: 2,
    targetValue: 3,
    unit: 'categories',
    iconName: 'BookOpen',
    rewardText: 'Scholar Title & Special Diploma Badge'
  },
  {
    id: 'b6',
    title: 'Community Pioneer',
    category: 'community',
    tier: 'Bronze',
    description: 'Successfully invite 3 friends to join SkillSwap.',
    unlocked: false,
    progressPercent: 33,
    currentValue: 1,
    targetValue: 3,
    unit: 'invites',
    iconName: 'Users',
    rewardText: '+3 Bonus Time Credits'
  }
];

export const GamificationBadges: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<GamificationBadgeItem | null>(null);

  const filteredBadges = GAMIFICATION_BADGES.filter((b) => {
    if (filterCategory === 'unlocked') return b.unlocked;
    if (filterCategory === 'locked') return !b.unlocked;
    return true;
  });

  const totalUnlocked = GAMIFICATION_BADGES.filter((b) => b.unlocked).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-indigo-600 text-white rounded-xl shadow-md">
              <Medal className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Gamification & Reputation Badges
            </h2>
            <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] font-extrabold rounded-full border border-indigo-800">
              {totalUnlocked} of {GAMIFICATION_BADGES.length} Unlocked
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Earn badges, level up your profile prestige, and unlock platform perks through active peer skill exchanges.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Badges
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('unlocked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterCategory === 'unlocked'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unlocked ({totalUnlocked})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('locked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterCategory === 'locked'
                ? 'bg-slate-800 text-slate-200 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            In Progress
          </button>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => (
          <div
            key={badge.id}
            onClick={() => setSelectedBadge(badge)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              badge.unlocked
                ? 'bg-gradient-to-br from-slate-900 to-indigo-950/40 border-indigo-500/40 hover:border-indigo-400 shadow-md hover:shadow-indigo-500/10'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-80 hover:opacity-100'
            }`}
          >
            {/* Tier Indicator Pill */}
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                badge.tier === 'Gold'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : badge.tier === 'Platinum'
                  ? 'bg-purple-950 text-purple-300 border-purple-800'
                  : badge.tier === 'Silver'
                  ? 'bg-slate-800 text-slate-300 border-slate-600'
                  : 'bg-orange-950 text-orange-300 border-orange-800'
              }`}>
                {badge.tier} Tier
              </span>

              {badge.unlocked ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Unlocked
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  {badge.progressPercent}%
                </span>
              )}
            </div>

            {/* Icon + Title */}
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-2xl shrink-0 flex items-center justify-center ${
                badge.unlocked
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {badge.iconName === 'Award' && <Award className="w-6 h-6" />}
                {badge.iconName === 'ShieldCheck' && <ShieldCheck className="w-6 h-6" />}
                {badge.iconName === 'Star' && <Star className="w-6 h-6 fill-current text-amber-400" />}
                {badge.iconName === 'Flame' && <Flame className="w-6 h-6 text-amber-500" />}
                {badge.iconName === 'BookOpen' && <BookOpen className="w-6 h-6" />}
                {badge.iconName === 'Users' && <Users className="w-6 h-6" />}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                  {badge.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {badge.description}
                </p>
              </div>
            </div>

            {/* Progress Bar for Locked Badges */}
            {!badge.unlocked && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>Progress</span>
                  <span>{badge.currentValue} / {badge.targetValue} {badge.unit}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${badge.progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Unlock Perk Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <Gift className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">{badge.rewardText}</span>
            </div>

          </div>
        ))}
      </div>

      {/* Badge Details Modal / Popup */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Badge Detail & Perks
              </span>
              <button
                onClick={() => setSelectedBadge(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-3 py-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-xl">
                <Award className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-extrabold text-white">{selectedBadge.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                {selectedBadge.description}
              </p>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-left space-y-1.5 text-xs">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  Unlocked Perk:
                </p>
                <p className="text-slate-200">{selectedBadge.rewardText}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
