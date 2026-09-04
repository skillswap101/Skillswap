import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Video, 
  ArrowRightLeft, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Play
} from 'lucide-react';
import { SwapProposal, Session, User } from '../types';

interface MySwapsViewProps {
  currentUser: User;
  proposals: SwapProposal[];
  sessions: Session[];
  onAcceptProposal: (proposalId: string) => void;
  onDeclineProposal: (proposalId: string) => void;
  onOpenSessionRoom: (session: Session) => void;
  onOpenChat: (proposalId: string) => void;
  onOpenCalendarSync?: (session: Session) => void;
}

export const MySwapsView: React.FC<MySwapsViewProps> = ({
  currentUser,
  proposals,
  sessions,
  onAcceptProposal,
  onDeclineProposal,
  onOpenSessionRoom,
  onOpenChat,
  onOpenCalendarSync,
}) => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'sessions' | 'history'>('proposals');

  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const activeProposals = proposals.filter((p) => p.status === 'accepted');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title & Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-400" />
            <span>My Swaps & Scheduled Sessions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your incoming swap offers, active agreements, and live 1-on-1 teaching sessions.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-3 py-1.5 rounded-lg transition-colors relative ${
              activeTab === 'proposals'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:text-slate-200'
            }`}
          >
            <span>Proposals</span>
            {pendingProposals.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                {pendingProposals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'sessions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:text-slate-200'
            }`}
          >
            <span>Upcoming Sessions ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:text-slate-200'
            }`}
          >
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Proposals View */}
      {activeTab === 'proposals' && (
        <div className="space-y-6">
          
          {/* Pending Incoming / Outgoing Requests */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Pending Swap Requests ({pendingProposals.length})
            </h2>

            {pendingProposals.length === 0 ? (
              <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-2">
                <ArrowRightLeft className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No Pending Swap Requests</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Browse the marketplace or use the AI Matchmaker to find partners and send swap proposals!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProposals.map((prop) => {
                  const isRecipient = prop.recipientId === currentUser.id;
                  const otherPartyName = isRecipient ? prop.senderName : prop.recipientName;
                  const otherPartyAvatar = isRecipient ? prop.senderAvatar : prop.recipientAvatar;

                  return (
                    <div
                      key={prop.id}
                      className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-md space-y-4"
                    >
                      {/* Proposal Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={otherPartyAvatar}
                            alt={otherPartyName}
                            className="w-10 h-10 rounded-full object-cover border border-indigo-400"
                          />
                          <div>
                            <p className="text-xs text-slate-400">
                              {isRecipient ? 'Proposal received from' : 'Proposal sent to'}
                            </p>
                            <h3 className="text-sm font-bold text-white">{otherPartyName}</h3>
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-full w-fit">
                          Pending Approval
                        </span>
                      </div>

                      {/* Swap details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/50 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Offered Skill:</span>
                          <span className="font-bold text-indigo-300">{prop.offeredSkillTitle}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Requested Skill:</span>
                          <span className="font-bold text-purple-300">{prop.requestedSkillTitle}</span>
                        </div>
                        <div className="sm:col-span-2 pt-1 border-t border-slate-800 flex items-center gap-4 text-slate-300">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {prop.proposedDate} at {prop.proposedTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> {prop.durationMinutes} Minutes
                          </span>
                        </div>
                      </div>

                      {/* Pitch Message */}
                      <p className="text-xs text-slate-300 italic bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                        "{prop.pitchMessage}"
                      </p>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <button
                          onClick={() => onOpenChat(prop.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat Partner</span>
                        </button>

                        {isRecipient ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onDeclineProposal(prop.id)}
                              className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold rounded-xl transition-colors"
                            >
                              Decline
                            </button>

                            <button
                              onClick={() => onAcceptProposal(prop.id)}
                              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                            >
                              <Check className="w-4 h-4" />
                              <span>Accept & Schedule Session</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Waiting for {otherPartyName} to accept...</span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Accepted Active Agreements */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Confirmed Swap Agreements ({activeProposals.length})
            </h2>

            {activeProposals.map((prop) => (
              <div key={prop.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {prop.requestedSkillTitle} ↔ {prop.offeredSkillTitle}
                    </h3>
                    <p className="text-xs text-slate-400">
                      With {prop.senderId === currentUser.id ? prop.recipientName : prop.senderName} • Scheduled for {prop.proposedDate} at {prop.proposedTime}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenChat(prop.id)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open Chat</span>
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Tab 2: Sessions View */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No Scheduled Sessions</p>
              <p className="text-xs text-slate-500">Accept a swap proposal to schedule your first 1-on-1 video session!</p>
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/60 border border-indigo-700/50 rounded-3xl p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                  <div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                      Scheduled Live Session
                    </span>
                    <h2 className="text-lg font-bold text-white mt-2">{sess.title}</h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Mentor: <strong className="text-indigo-300">{sess.mentorName}</strong> | Learner: <strong className="text-purple-300">{sess.learnerName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-700 text-xs">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <div>
                      <p className="font-bold text-slate-200">{sess.date} at {sess.time}</p>
                      <p className="text-[10px] text-slate-400">{sess.durationMinutes} Minutes Duration</p>
                    </div>
                  </div>
                </div>

                {/* Agenda */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Session Agenda:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {sess.agenda.map((item, idx) => (
                      <div key={idx} className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50 text-slate-300">
                        • {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Join Live Session & Calendar Sync Action */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                  {onOpenCalendarSync && (
                    <button
                      onClick={() => onOpenCalendarSync(sess)}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                    >
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Sync Calendar</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenSessionRoom(sess)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Live Session Room</span>
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: History View */}
      {activeTab === 'history' && (
        <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">Completed Swap History</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            You have taught <strong>{currentUser.hoursTaught} hours</strong> and learned <strong>{currentUser.hoursLearned} hours</strong> in total on SkillSwap! Completed sessions grant Time Credits automatically to your Time Bank.
          </p>
        </div>
      )}

    </div>
  );
};
