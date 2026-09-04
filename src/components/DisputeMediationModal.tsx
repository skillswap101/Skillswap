import React, { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SwapContract, UserProfile } from '../types';
import { api } from '../lib/api';

interface DisputeMediationModalProps {
  swap: SwapContract;
  currentUser: UserProfile;
  onClose: () => void;
  onResolved: () => void;
}

export const DisputeMediationModal: React.FC<DisputeMediationModalProps> = ({
  swap,
  currentUser,
  onClose,
  onResolved,
}) => {
  const [resolutionType, setResolutionType] = useState<'refund_requester' | 'release_provider' | 'split_50_50'>(
    'split_50_50'
  );
  const [mediatorNotes, setMediatorNotes] = useState(
    `Mediation review concluded. Partial milestone delivery noted. 50/50 escrow split recommended.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleResolve = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.resolveDispute({
        swapId: swap.id,
        resolution: resolutionType,
        notes: mediatorNotes,
      });
      setIsSubmitting(false);
      onResolved();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to resolve dispute');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 text-slate-100 shadow-2xl overflow-hidden relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white">Escrow Dispute Mediation Portal</h3>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                Pillar 2 Escrow Protection
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Contract #{swap.id.slice(0, 8)} • <strong className="text-slate-200">{swap.skillTitle}</strong>
            </p>
          </div>
        </div>

        {/* Dispute Summary Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <div className="text-slate-400">
              Learner: <span className="text-white font-semibold">{swap.requesterName}</span>
            </div>
            <div className="text-slate-400">
              Mentor: <span className="text-white font-semibold">{swap.providerName}</span>
            </div>
            <div className="text-amber-300 font-mono font-bold">
              {swap.totalCredits} Credits In Lock
            </div>
          </div>

          <div className="bg-rose-950/30 border border-rose-900/50 p-3 rounded-xl text-xs text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-300">Dispute Claim:</div>
              <div>{swap.sessionNotes || 'Dispute opened regarding session milestones delivery or attendance.'}</div>
            </div>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="space-y-3 mb-5">
          <label className="block text-xs font-semibold text-slate-300">
            Select Mediation Settlement Decision
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Option 1: 100% Refund to Learner */}
            <div
              onClick={() => {
                setResolutionType('refund_requester');
                setMediatorNotes(`Full refund awarded to learner (${swap.requesterName}). Session canceled.`);
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                resolutionType === 'refund_requester'
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs text-white">Full Refund</span>
              </div>
              <p className="text-[11px] text-slate-400">
                100% ({swap.totalCredits} credits) returned to {swap.requesterName}.
              </p>
            </div>

            {/* Option 2: 50/50 Split */}
            <div
              onClick={() => {
                setResolutionType('split_50_50');
                setMediatorNotes(`Mediation settlement: 50/50 split (${swap.totalCredits / 2} credits each).`);
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                resolutionType === 'split_50_50'
                  ? 'bg-amber-950/60 border-amber-500 shadow-md ring-1 ring-amber-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-white">50 / 50 Split</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {(swap.totalCredits / 2).toFixed(1)} credits to mentor, {(swap.totalCredits / 2).toFixed(1)} returned to learner.
              </p>
            </div>

            {/* Option 3: 100% Release to Mentor */}
            <div
              onClick={() => {
                setResolutionType('release_provider');
                setMediatorNotes(`Full escrow released to mentor (${swap.providerName}). Learning objectives verified.`);
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                resolutionType === 'release_provider'
                  ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-white">Full Release</span>
              </div>
              <p className="text-[11px] text-slate-400">
                100% ({swap.totalCredits} credits) credited to {swap.providerName}.
              </p>
            </div>
          </div>
        </div>

        {/* Mediator Notes */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Mediation Audit Justification & Notes
          </label>
          <textarea
            rows={2}
            value={mediatorNotes}
            onChange={e => setMediatorNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 mb-4 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800">
            {errorMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Scale className="w-4 h-4" />
            <span>{isSubmitting ? 'Executing Settlement...' : 'Execute Mediation Resolution'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
