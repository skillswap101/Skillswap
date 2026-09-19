import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Award, 
  ArrowUpRight, 
  ArrowDownLeft, 
  HelpCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Zap,
  BookOpen,
  Gift,
  UserPlus,
  Lock,
  Sparkles,
  CreditCard,
  Receipt,
  History
} from 'lucide-react';
import { User, EscrowTransaction } from '../types';
import { getStoredEscrowTransactions, subscribeEscrowChanges } from '../utils/escrowManager';
import { StripeTransaction } from './StripeCheckoutModal';

interface TimeCreditsViewProps {
  currentUser: User;
  onExploreSkills: () => void;
  onPostSkill: () => void;
  onOpenInviteModal?: () => void;
  onOpenUnifiedCheckout?: () => void;
  onOpenStripeCheckout?: () => void;
}

export const TimeCreditsView: React.FC<TimeCreditsViewProps> = ({
  currentUser,
  onExploreSkills,
  onPostSkill,
  onOpenInviteModal,
  onOpenUnifiedCheckout,
  onOpenStripeCheckout,
}) => {
  const [escrowTxs, setEscrowTxs] = useState<EscrowTransaction[]>(getStoredEscrowTransactions());
  const [stripeTxs, setStripeTxs] = useState<StripeTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('skillswap_stripe_transactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse stripe transactions', e);
    }
    return [
      {
        id: 'ch_3M89F20A',
        packageName: 'Standard Bundle (Save $3)',
        credits: 3,
        amount: 12,
        cardName: 'Alex Rivers',
        cardLast4: '4242',
        cardBrand: 'Visa',
        status: 'succeeded',
        date: '2026-08-01, 14:30:15',
      },
      {
        id: 'ch_3M71K98B',
        packageName: 'Single Session',
        credits: 1,
        amount: 5,
        cardName: 'Alex Rivers',
        cardLast4: '8812',
        cardBrand: 'Mastercard',
        status: 'succeeded',
        date: '2026-07-20, 09:12:44',
      },
    ];
  });

  useEffect(() => {
    return subscribeEscrowChanges((updated) => {
      setEscrowTxs(updated);
    });
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('skillswap_stripe_transactions');
        if (saved) setStripeTxs(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Credit Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 p-6 sm:p-8 border border-amber-500/40 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              Community Time Bank
            </span>

            <h1 className="text-3xl font-black text-white">Your Time Credit Vault</h1>
            
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Every 1 hour you spend teaching community members earns you <strong>1 Time Credit</strong>. You can spend your credits to learn ANY skill on SkillSwap — even if you don't have a direct reciprocal skill to offer!
            </p>
          </div>

          {/* Big Balance Meter */}
          <div className="bg-slate-900/90 border border-amber-500/40 p-6 rounded-3xl text-center space-y-3 shadow-xl shrink-0 w-full sm:w-auto">
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <Clock className="w-8 h-8" />
              <span className="text-4xl font-extrabold text-amber-300">{currentUser.timeCredits}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Time Credits Available</p>
              <p className="text-[11px] text-slate-400">1 Credit = 60 Mins 1-on-1 Mentorship</p>
            </div>

            {(onOpenUnifiedCheckout || onOpenStripeCheckout) && (
              <button
                type="button"
                onClick={onOpenUnifiedCheckout || onOpenStripeCheckout}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Buy Time Credits (Stripe / M-Pesa / PayPal)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invite Friends Referral Banner */}
      {onOpenInviteModal && (
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950/80 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-2xl shrink-0">
              <Gift className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Want More Free Time Credits?</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Invite friends to SkillSwap. You both earn <strong className="text-amber-300">+1 Time Credit</strong> as soon as they complete their first skill session!
              </p>
            </div>
          </div>

          <button
            onClick={onOpenInviteModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Friends</span>
          </button>
        </div>
      )}

      {/* How Time Banking Works Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="text-sm font-bold text-white">Teach & Earn</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Offer a skill you know well. Host a 1-on-1 session and receive 1 Time Credit directly upon session completion.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="text-sm font-bold text-white">Spend on Any Skill</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Want to learn French, Guitar, or Python? Use your credits to book sessions with top community mentors hassle-free.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            3
          </div>
          <h3 className="text-sm font-bold text-white">Equal Value for Everyone</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            1 hour of guitar lesson = 1 hour of coding lesson = 1 hour of language practice. Everyone's time is valued equally!
          </p>
        </div>
      </div>

      {/* Recent Ledger & Escrow Transactions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Escrow & Activity Ledger</span>
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Escrow Protected System 5.0
          </span>
        </h2>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden divide-y divide-slate-700/60">
          {/* Dynamic Escrow Transactions */}
          {escrowTxs.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.status === 'LOCKED'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : tx.status === 'RELEASED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {tx.status === 'LOCKED' ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">{tx.skillTitle}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      tx.status === 'LOCKED'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : tx.status === 'RELEASED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {tx.status === 'LOCKED' ? 'In Escrow' : tx.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Learner: {tx.learnerName} • Mentor: {tx.mentorName} • Locked {tx.lockedAt}
                  </p>
                </div>
              </div>

              <span className={`font-bold text-sm ${
                tx.status === 'LOCKED' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {tx.status === 'LOCKED' ? `🔒 ${tx.creditsAmount}.0 Held` : `✓ ${tx.creditsAmount}.0 Settled`}
              </span>
            </div>
          ))}

          <div className="p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Welcome Gift Bonus</p>
                <p className="text-slate-400 text-[11px]">Granted for joining SkillSwap community</p>
              </div>
            </div>
            <span className="font-bold text-indigo-300 text-sm">+5.0 Credits</span>
          </div>
        </div>
      </div>

      {/* Stripe Credit Point Purchase Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Stripe Point Purchases History Log</span>
          </h2>

          {(onOpenUnifiedCheckout || onOpenStripeCheckout) && (
            <button
              type="button"
              onClick={onOpenUnifiedCheckout || onOpenStripeCheckout}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Manage Purchases / Buy Credits</span>
            </button>
          )}
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden divide-y divide-slate-700/60">
          {stripeTxs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No point purchases recorded yet. Buy time credits via Stripe to top up your balance!
            </div>
          ) : (
            stripeTxs.map((stx) => (
              <div key={stx.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{stx.packageName}</p>
                      <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[9px] font-mono font-bold uppercase">
                        {stx.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Receipt {stx.id} • {stx.cardBrand} •••• {stx.cardLast4} • {stx.date}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-amber-300 text-sm">+{stx.credits} Time Credits</p>
                  <p className="text-slate-400 text-[11px]">${stx.amount}.00 USD</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
