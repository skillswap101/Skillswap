import React, { useState } from 'react';
import {
  X,
  Repeat,
  Lock,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coins,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { SkillListing, UserProfile } from '../types';
import { api } from '../lib/api';

interface ProposeSwapModalProps {
  listing: SkillListing | null;
  currentUser: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
  onOpenCheckout: () => void;
}

export const ProposeSwapModal: React.FC<ProposeSwapModalProps> = ({
  listing,
  currentUser,
  onClose,
  onSuccess,
  onOpenCheckout,
}) => {
  const [hours, setHours] = useState(1);
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [goalsInput, setGoalsInput] = useState(
    listing?.syllabus && listing.syllabus.length > 0
      ? listing.syllabus.slice(0, 3).join('\n')
      : 'Initial skill baseline review\nPractical interactive exercise\nQ&A and next milestone plan'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!listing) return null;

  const totalCreditsRequired = Number((hours * listing.hourlyRateCredits).toFixed(1));
  const hasSufficientCredits = currentUser.timeCredits >= totalCreditsRequired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSufficientCredits) {
      setErrorMsg(`Insufficient credits. You need ${totalCreditsRequired} hrs but only have ${currentUser.timeCredits} hrs.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const learningGoals = goalsInput
      .split('\n')
      .map(g => g.trim().replace(/^[-*•\d.]\s*/, ''))
      .filter(Boolean);

    try {
      // 1. Create Swap Contract
      const swap = await api.createSwap({
        requesterId: currentUser.id,
        providerId: listing.userId,
        skillTitle: listing.title,
        category: listing.category,
        hours,
        scheduledDate: new Date(scheduledDate).toISOString(),
        learningGoals,
      });

      // 2. Lock required credits in Escrow
      await api.lockEscrow({
        swapId: swap.id,
        requesterId: currentUser.id,
        providerId: listing.userId,
        amountCredits: totalCreditsRequired,
      });

      setSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Propose Knowledge Swap</h3>
              <p className="text-xs text-indigo-200">With {listing.user.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Skill Details Snapshot */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
            <img
              src={listing.user.avatar}
              alt={listing.user.name}
              className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-300"
            />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {listing.category}
              </div>
              <h4 className="font-bold text-slate-900 text-xs truncate">{listing.title}</h4>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Rate: {listing.hourlyRateCredits} Credit/hour • Mentor: {listing.user.name} ({listing.user.rating}★)
              </div>
            </div>
          </div>

          {/* Hours & Escrow Lock Calculations */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Session Duration
              </label>
              <select
                value={hours}
                onChange={e => setHours(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value={1}>1.0 Hour</option>
                <option value={1.5}>1.5 Hours</option>
                <option value={2}>2.0 Hours</option>
                <option value={3}>3.0 Hours</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Preferred Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Goals / Agenda */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Learning Goals & Focus Topics (1 per line)
            </label>
            <textarea
              rows={3}
              value={goalsInput}
              onChange={e => setGoalsInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Escrow Lock Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            hasSufficientCredits
              ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-2.5">
              <Lock className={`w-5 h-5 ${hasSufficientCredits ? 'text-indigo-600' : 'text-amber-600'}`} />
              <div>
                <div className="font-bold text-xs">
                  Escrow Lock: {totalCreditsRequired} Time Credit{totalCreditsRequired > 1 ? 's' : ''}
                </div>
                <div className="text-[11px] opacity-80">
                  Your Available Balance: {(currentUser.timeCredits ?? 0).toFixed(1)} hrs
                </div>
              </div>
            </div>

            {!hasSufficientCredits && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCheckout();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0"
              >
                Buy Credits
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !hasSufficientCredits}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Locking Escrow & Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Lock & Send Proposal
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
