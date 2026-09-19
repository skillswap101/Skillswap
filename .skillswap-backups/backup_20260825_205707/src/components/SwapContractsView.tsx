import React, { useState } from 'react';
import {
  Repeat,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Video,
  Clock,
  Calendar,
  User,
  ArrowUpRight,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Check,
  Award,
  Scale,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SwapContract, UserProfile } from '../types';
import { EscrowManager } from '../lib/escrowManager';
import { CalendarScheduleModal } from './CalendarScheduleModal';
import { DisputeMediationModal } from './DisputeMediationModal';
import { SkillCertificateModal } from './SkillCertificateModal';

interface SwapContractsViewProps {
  swaps: SwapContract[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onEnterLiveStudio: (swap: SwapContract) => void;
  onOpenCheckout: () => void;
}

export const SwapContractsView: React.FC<SwapContractsViewProps> = ({
  swaps,
  currentUser,
  onRefresh,
  onEnterLiveStudio,
  onOpenCheckout,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [disputeModalSwap, setDisputeModalSwap] = useState<SwapContract | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Modals for extra capabilities
  const [activeCalendarSwap, setActiveCalendarSwap] = useState<SwapContract | null>(null);
  const [activeMediationSwap, setActiveMediationSwap] = useState<SwapContract | null>(null);
  const [activeCertSwap, setActiveCertSwap] = useState<SwapContract | null>(null);

  const userSwaps = swaps.filter(
    s => s.requesterId === currentUser.id || s.providerId === currentUser.id
  );

  const handleAcceptAndLock = async (swap: SwapContract) => {
    setProcessingId(swap.id);
    setErrorMsg(null);
    try {
      if (currentUser.timeCredits < swap.totalCredits) {
        throw new Error(
          `Insufficient credits (${currentUser.timeCredits} hrs available, ${swap.totalCredits} hrs required). Please top up your wallet.`
        );
      }
      await EscrowManager.acceptAndLock(swap, currentUser.id);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReleaseEscrow = async (swap: SwapContract) => {
    setProcessingId(swap.id);
    setErrorMsg(null);
    try {
      await EscrowManager.completeAndRelease(swap.id, currentUser.id);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefund = async (swap: SwapContract) => {
    setProcessingId(swap.id);
    setErrorMsg(null);
    try {
      await EscrowManager.cancelAndRefund(swap.id, 'Cancelled mutually by user request', currentUser.id);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeModalSwap || !disputeReason.trim()) return;
    setProcessingId(disputeModalSwap.id);
    try {
      await EscrowManager.raiseDispute(disputeModalSwap.id, currentUser.id, disputeReason);
      setDisputeModalSwap(null);
      setDisputeReason('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: SwapContract['status']) => {
    switch (status) {
      case 'proposed':
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Proposal Pending
          </span>
        );
      case 'accepted':
      case 'in_progress':
        return (
          <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-indigo-600" /> Locked in Escrow
          </span>
        );
      case 'settled':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled & Released
          </span>
        );
      case 'disputed':
        return (
          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> In Dispute Mediation
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> Cancelled & Refunded
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Your Swap Agreements & Escrow Contracts</h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {userSwaps.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Time credits are held in trust until both peers verify session completion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCheckout}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors"
          >
            + Buy Time Credits
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3.5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Swaps List */}
      <div className="space-y-4">
        {userSwaps.map(swap => {
          const isRequester = swap.requesterId === currentUser.id;
          const partnerName = isRequester ? swap.providerName : swap.requesterName;
          const partnerAvatar = isRequester ? swap.providerAvatar : swap.requesterAvatar;
          const myRole = isRequester ? 'Learner (Payer)' : 'Mentor (Provider)';
          const scheduledDateText = new Date(swap.scheduledDate).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={swap.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 transition-all hover:border-slate-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                
                {/* Partner Info & Skill */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={partnerAvatar}
                    alt={partnerName}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base">{swap.skillTitle}</h3>
                      {getStatusBadge(swap.status)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Partner: <strong>{partnerName}</strong></span>
                      <span>•</span>
                      <span>Your Role: <strong className="text-indigo-600">{myRole}</strong></span>
                      <span>•</span>
                      <span>Category: {swap.category}</span>
                    </div>
                  </div>
                </div>

                {/* Hours, Schedule & Escrow Amount */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveCalendarSwap(swap)}
                    className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                    title="View / Sync Schedule"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{scheduledDateText}</span>
                  </button>

                  <div className="bg-slate-50 rounded-xl p-2.5 px-3.5 border border-slate-200/80 flex items-center gap-3 shrink-0">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Duration</div>
                      <div className="text-xs font-bold text-slate-900">{swap.hours} hr{swap.hours > 1 ? 's' : ''}</div>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Escrow Value</div>
                      <div className="text-xs font-black text-indigo-700">{swap.totalCredits} Credits</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Learning Goals / Notes */}
              {swap.learningGoals && swap.learningGoals.length > 0 && (
                <div className="py-3.5 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    Agreed Session Goals:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                    {swap.learningGoals.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions Toolbar */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-400 font-mono">
                  Contract ID: {swap.id} • Created: {new Date(swap.createdAt).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-2">
                  
                  {/* Status: Settled -> View Certificate */}
                  {swap.status === 'settled' && (
                    <button
                      onClick={() => setActiveCertSwap(swap)}
                      className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      View Certificate
                    </button>
                  )}

                  {/* Status: Disputed -> Open Mediation Portal */}
                  {swap.status === 'disputed' && (
                    <button
                      onClick={() => setActiveMediationSwap(swap)}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Scale className="w-3.5 h-3.5 text-rose-600" />
                      Mediate & Resolve Dispute
                    </button>
                  )}

                  {/* Status: Proposed -> Accept & Lock */}
                  {swap.status === 'proposed' && (
                    <button
                      onClick={() => handleAcceptAndLock(swap)}
                      disabled={processingId === swap.id}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Accept & Lock {swap.totalCredits} Credits into Escrow
                    </button>
                  )}

                  {/* Status: Accepted / In Progress -> Enter Studio */}
                  {(swap.status === 'accepted' || swap.status === 'in_progress') && (
                    <>
                      <button
                        onClick={() => onEnterLiveStudio(swap)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Enter Live Studio Workspace
                      </button>

                      {isRequester && (
                        <button
                          onClick={() => handleReleaseEscrow(swap)}
                          disabled={processingId === swap.id}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center gap-1"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Release Escrow Now
                        </button>
                      )}

                      <button
                        onClick={() => setDisputeModalSwap(swap)}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors"
                      >
                        Raise Dispute
                      </button>
                    </>
                  )}

                  {/* Cancellable if proposed */}
                  {swap.status === 'proposed' && (
                    <button
                      onClick={() => handleRefund(swap)}
                      className="px-3 py-2 text-slate-500 hover:bg-slate-100 text-xs font-medium rounded-xl"
                    >
                      Cancel Proposal
                    </button>
                  )}

                </div>
              </div>

            </div>
          );
        })}

        {userSwaps.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Repeat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No active swap contracts</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Browse the skill marketplace to propose your first knowledge exchange!
            </p>
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      {disputeModalSwap && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-rose-600 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Open Escrow Dispute</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Explain why the session could not be completed for <strong>{disputeModalSwap.skillTitle}</strong>.
            </p>

            <textarea
              rows={3}
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              placeholder="e.g., Mentor was unavailable at scheduled time..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDisputeModalSwap(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDispute}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {activeCalendarSwap && (
        <CalendarScheduleModal
          swap={activeCalendarSwap}
          currentUser={currentUser}
          onClose={() => setActiveCalendarSwap(null)}
          onUpdateSchedule={newDate => {
            onRefresh();
          }}
        />
      )}

      {/* Dispute Mediation Modal */}
      {activeMediationSwap && (
        <DisputeMediationModal
          swap={activeMediationSwap}
          currentUser={currentUser}
          onClose={() => setActiveMediationSwap(null)}
          onResolved={() => onRefresh()}
        />
      )}

      {/* Certificate Modal */}
      {activeCertSwap && (
        <SkillCertificateModal
          swap={activeCertSwap}
          currentUser={currentUser}
          onClose={() => setActiveCertSwap(null)}
        />
      )}

    </div>
  );
};
