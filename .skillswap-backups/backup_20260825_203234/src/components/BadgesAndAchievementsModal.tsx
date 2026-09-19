import React from 'react';
import {
  Award,
  Zap,
  Flame,
  ShieldCheck,
  Star,
  BookOpen,
  Code,
  Globe,
  X,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../types';

interface BadgesModalProps {
  user: UserProfile;
  onClose: () => void;
}

const ALL_ACHIEVEMENT_BADGES = [
  {
    id: 'pioneer',
    name: 'Pioneer Swapper',
    icon: Flame,
    color: 'from-amber-500 to-rose-500',
    description: 'Completed your first 1-on-1 bilateral skill swap.',
    unlocked: true,
    progress: '1/1 Swaps',
  },
  {
    id: 'code_artisan',
    name: 'Code Artisan',
    icon: Code,
    color: 'from-indigo-500 to-teal-500',
    description: 'Delivered 3+ sessions in Coding & Technology.',
    unlocked: true,
    progress: '3/3 Sessions',
  },
  {
    id: 'escrow_guardian',
    name: 'Escrow Guardian',
    icon: ShieldCheck,
    color: 'from-emerald-500 to-teal-500',
    description: 'Maintained 100% dispute-free escrow release rate.',
    unlocked: true,
    progress: '100% Clean Record',
  },
  {
    id: 'polyglot',
    name: 'Global Polyglot',
    icon: Globe,
    color: 'from-sky-500 to-indigo-500',
    description: 'Completed swaps across 2 or more diverse spoken languages.',
    unlocked: false,
    progress: '1/2 Languages',
  },
  {
    id: 'five_star_mentor',
    name: '5-Star Master Mentor',
    icon: Star,
    color: 'from-amber-400 to-amber-600',
    description: 'Received 5 consecutive 5.0 star reviews from peers.',
    unlocked: true,
    progress: '5/5 Perfect Reviews',
  },
  {
    id: 'time_banker',
    name: 'Time Banker Titan',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    description: 'Banked and exchanged over 20+ cumulative Time Credit hours.',
    unlocked: false,
    progress: '12.5/20 Hours',
  },
];

export const BadgesAndAchievementsModal: React.FC<BadgesModalProps> = ({ user, onClose }) => {
  const completedSwaps = user.completedSwaps || 4;
  const level = Math.floor(completedSwaps / 2) + 1;
  const levelProgress = ((completedSwaps % 2) / 2) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Reputation Badges & Skill Mastery</h3>
            <p className="text-xs text-slate-400">
              Gamified reputation scores for <strong className="text-slate-200">{user.name}</strong>
            </p>
          </div>
        </div>

        {/* Level Progression Card */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-950 to-slate-900 p-5 rounded-2xl border border-indigo-500/30 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 font-bold text-sm flex items-center justify-center text-white shadow-sm">
                L{level}
              </span>
              <div>
                <div className="font-bold text-sm text-white">Tier: Verified Master Swapper</div>
                <div className="text-[11px] text-slate-400">{completedSwaps} Verified Completed Swaps</div>
              </div>
            </div>
            <div className="text-xs text-indigo-300 font-mono font-bold">
              {levelProgress}% to Level {level + 1}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelProgress || 45}%` }}
            />
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
          {ALL_ACHIEVEMENT_BADGES.map(badge => {
            const IconComponent = badge.icon;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  badge.unlocked
                    ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${badge.color} flex items-center justify-center text-white shrink-0 shadow-md ${
                    !badge.unlocked && 'grayscale'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white">{badge.name}</h4>
                    {badge.unlocked ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{badge.description}</p>
                  <div className="text-[10px] text-indigo-300 font-mono mt-2 font-semibold">
                    {badge.progress}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Close Badges
          </button>
        </div>

      </div>
    </div>
  );
};
