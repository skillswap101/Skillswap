import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Video, 
  Phone, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Mic, 
  Paperclip, 
  Calendar, 
  Clock, 
  ArrowRightLeft,
  FileText,
  Play,
  Volume2,
  Loader2
} from 'lucide-react';
import { ChatMessage, SwapProposal, User, EscrowTransaction } from '../types';
import { auth } from '../firebase';
import { usePresence } from '../context/PresenceContext';

interface ChatPortalProps {
  currentUser: User;
  proposals: SwapProposal[];
  messages: ChatMessage[];
  selectedProposalId: string | null;
  onSelectProposal: (proposalId: string) => void;
  onSendMessage: (proposalId: string, text: string) => Promise<boolean> | void;
  onStartCall: (proposalId: string, callType: 'video' | 'audio', peerName: string, peerAvatar: string, skillTitle: string) => void;
  showToast: (msg: string) => void;
  onMarkMessageRead?: (messageId: string) => void;
}

export const ChatPortal: React.FC<ChatPortalProps> = ({
  currentUser,
  proposals,
  messages,
  selectedProposalId,
  onSelectProposal,
  onSendMessage,
  onStartCall,
  showToast,
  onMarkMessageRead,
}) => {
  const { isUserOnline, getUserPresenceLabel } = usePresence();
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isRecordingAudioNote, setIsRecordingAudioNote] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [escrowTx, setEscrowTx] = useState<EscrowTransaction | null>(null);

  const activeProposalId = selectedProposalId || proposals[0]?.id;
  const currentProposal = proposals.find((p) => p.id === activeProposalId) || proposals[0];
  const currentMessages = messages.filter((m) => m.swapProposalId === activeProposalId);

  // Automatically mark incoming unread messages for the active conversation as read
  useEffect(() => {
    if (!currentUser?.id || !onMarkMessageRead || !activeProposalId) return;
    const unreadMessages = currentMessages.filter(
      (m) =>
        (m.recipientId === currentUser.id ||
          (!m.recipientId && m.senderId !== currentUser.id) ||
          (m.participantIds?.includes(currentUser.id) && m.senderId !== currentUser.id)) &&
        !m.read
    );
    unreadMessages.forEach((m) => {
      onMarkMessageRead(m.id);
    });
  }, [currentMessages, currentUser?.id, onMarkMessageRead, activeProposalId]);

  useEffect(() => {
    if (!currentProposal) return;

    if (currentProposal.status === 'accepted') {
      setEscrowTx({
        id: `escrow-${currentProposal.id}`,
        proposalId: currentProposal.id,
        sessionId: currentProposal.id,
        learnerId: currentProposal.senderId,
        learnerName: currentProposal.senderName,
        mentorId: currentProposal.recipientId,
        mentorName: currentProposal.recipientName,
        skillTitle: currentProposal.requestedSkillTitle,
        creditsAmount: currentProposal.timeCreditsAmount || 1,
        status: 'LOCKED',
        lockedAt: 'Active Escrow',
      });
    } else {
      setEscrowTx(null);
    }
  }, [currentProposal?.id, currentProposal?.status]);

  if (!currentProposal) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
        <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Active Conversations Yet</h2>
        <p className="text-xs text-slate-400">Propose a swap or accept an incoming request to start chatting!</p>
      </div>
    );
  }

  const isRecipient = currentProposal.recipientId === currentUser.id;
  const partnerId = isRecipient ? currentProposal.senderId : currentProposal.recipientId;
  const partnerName = isRecipient ? currentProposal.senderName : currentProposal.recipientName;
  const partnerAvatar = isRecipient ? currentProposal.senderAvatar : currentProposal.recipientAvatar;
  const isPartnerOnline = isUserOnline(partnerId);
  const partnerPresenceLabel = getUserPresenceLabel(partnerId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !activeProposalId || isSending) return;

    setIsSending(true);
    try {
      const res = await onSendMessage(activeProposalId, text);
      if (res !== false) {
        setInputText('');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleRecordVoiceNote = () => {
    if (isRecordingAudioNote) {
      setIsRecordingAudioNote(false);
      onSendMessage(activeProposalId, '🎙️ Voice note recorded (0:08s)');
      showToast('Voice note attached and sent!');
      setRecordingSeconds(0);
    } else {
      setIsRecordingAudioNote(true);
      showToast('Recording voice note... Click again to stop & send.');
    }
  };

  const handleReleaseEscrow = async () => {
    if (!escrowTx) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/escrow/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ swapId: currentProposal.id }),
      });
      if (res.ok) {
        setEscrowTx((prev) => prev ? { ...prev, status: 'RELEASED' } : null);
        showToast(`Escrow released! Time Credits transferred to ${partnerName}.`);
      } else {
        const data = await res.json().catch(() => ({ error: 'Release failed' }));
        showToast(data.error || 'Failed to release escrow');
      }
    } catch (e: any) {
      showToast(e.message || 'Error releasing escrow');
    }
  };

  return (
    <div className="h-[80dvh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in duration-300">
      
      {/* Thread List Sidebar */}
      <div className="w-full md:w-80 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Chat Portal & Swaps</span>
          </h2>
          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-md text-[10px] font-bold">
            5.0 Core
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
          {proposals.map((prop) => {
            const isRec = prop.recipientId === currentUser.id;
            const pName = isRec ? prop.senderName : prop.recipientName;
            const pAvatar = isRec ? prop.senderAvatar : prop.recipientAvatar;
            const isSelected = prop.id === activeProposalId;

            return (
              <div
                key={prop.id}
                onClick={() => onSelectProposal(prop.id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-indigo-950/60 border-l-4 border-indigo-500' : 'hover:bg-slate-900/80'
                }`}
              >
                <img src={pAvatar} alt={pName} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 truncate">{pName}</h3>
                    <span className="text-[10px] text-slate-500 capitalize">{prop.status}</span>
                  </div>
                  <p className="text-[11px] text-indigo-300 truncate mt-0.5">{prop.requestedSkillTitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Conversation Canvas */}
      <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={partnerAvatar} alt={partnerName} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500" />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
                  isPartnerOnline ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
                title={partnerPresenceLabel}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">{partnerName}</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                  isPartnerOnline 
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}>
                  {partnerPresenceLabel}
                </span>
              </div>
              <p className="text-xs text-indigo-300 font-medium">
                {currentProposal.requestedSkillTitle} ↔ {currentProposal.offeredSkillTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct WebRTC Call Triggers */}
            <button
              type="button"
              onClick={() => onStartCall(currentProposal.id, 'audio', partnerName, partnerAvatar, currentProposal.requestedSkillTitle)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Start Audio Call"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Voice Call</span>
            </button>

            <button
              type="button"
              onClick={() => onStartCall(currentProposal.id, 'video', partnerName, partnerAvatar, currentProposal.requestedSkillTitle)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Start HD Video Call"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Session</span>
            </button>
          </div>
        </div>

        {/* Escrow Points Status Banner */}
        {escrowTx && (
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200">
                  Escrow Status: {escrowTx.status === 'RELEASED' ? 'Credit Released' : '1 Time Credit Locked'}
                </span>
                <span className="text-[10px] text-slate-400 block sm:inline sm:ml-2">
                  {escrowTx.status === 'RELEASED' ? 'Transferred to mentor' : 'Held safely until session completion'}
                </span>
              </div>
            </div>

            {escrowTx.status === 'LOCKED' && (
              <button
                type="button"
                onClick={handleReleaseEscrow}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow transition-all cursor-pointer shrink-0 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Release Credit</span>
              </button>
            )}
          </div>
        )}

        {/* Message Thread Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/50 custom-scrollbar">
          {currentMessages.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
              <p className="text-xs text-slate-400">
                You are connected with {partnerName}! Message them to confirm your session schedule or start a live video call.
              </p>
            </div>
          ) : (
            currentMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <img src={msg.senderAvatar} alt={msg.senderName} className="w-7 h-7 rounded-full object-cover" />
                  )}

                  <div className={`max-w-md p-3 rounded-2xl text-xs space-y-1 ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}>
                    <p className="leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'} text-right`}>
                      {msg.timestamp}
                    </p>
                  </div>

                  {isMe && (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Icebreakers Carousel */}
        {currentProposal.icebreakers && currentProposal.icebreakers.length > 0 && (
          <div className="px-4 py-2 bg-indigo-950/30 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[11px] font-bold text-indigo-300 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> Icebreakers:
            </span>
            {currentProposal.icebreakers.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(q)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-800/50 rounded-lg text-[11px] whitespace-nowrap transition-colors cursor-pointer"
              >
                "{q}"
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Toolbar */}
        <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRecordVoiceNote}
            className={`p-2.5 rounded-xl transition-all ${
              isRecordingAudioNote
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Record Voice Note"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder={isRecordingAudioNote ? 'Recording voice note...' : 'Type message or session notes...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
