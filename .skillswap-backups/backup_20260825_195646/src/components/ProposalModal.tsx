import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  ArrowRightLeft, 
  Clock, 
  Calendar, 
  Send, 
  Check, 
  AlertCircle,
  Loader2,
  Wand2
} from 'lucide-react';
import { Skill, User, SwapProposal } from '../types';

interface ProposalModalProps {
  targetSkill: Skill | null;
  currentUser: User;
  onClose: () => void;
  onSubmitProposal: (proposal: Omit<SwapProposal, 'id' | 'createdAt'>) => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  targetSkill,
  currentUser,
  onClose,
  onSubmitProposal,
}) => {
  if (!targetSkill) return null;

  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState<string>(
    currentUser.skillsOffered[0] || 'Time Credits'
  );
  const [useTimeCredits, setUseTimeCredits] = useState<boolean>(false);
  const [proposedDate, setProposedDate] = useState<string>('2026-08-10');
  const [proposedTime, setProposedTime] = useState<string>('17:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [pitchMessage, setPitchMessage] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiIcebreakers, setAiIcebreakers] = useState<string[]>([]);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const handleGenerateAIPitch = async () => {
    setIsGeneratingAI(true);
    setAiNotice(null);
    try {
      const res = await fetch('/api/ai/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mySkill: useTimeCredits ? '1 Time Credit' : selectedOfferedSkill,
          targetSkill: targetSkill.title,
          targetUserName: targetSkill.userName,
          tone: 'friendly, collaborative and enthusiastic',
          customMessage: pitchMessage,
        }),
      });

      if (!res.ok) throw new Error('AI pitch generation failed');
      const data = await res.json();
      setPitchMessage(data.proposal || '');
      if (data.icebreakers && data.icebreakers.length > 0) {
        setAiIcebreakers(data.icebreakers);
      }
      setAiNotice('✨ AI pitch draft created! Feel free to edit before sending.');
    } catch (err) {
      console.error(err);
      // Fallback proposal
      setPitchMessage(
        `Hi ${targetSkill.userName}! I would love to connect for a 1-on-1 swap session. I want to learn ${targetSkill.title} from you, and in return I can share my experience in ${useTimeCredits ? 'Time Credits' : selectedOfferedSkill}. Let me know if ${proposedDate} works!`
      );
      setAiNotice('Generated quick pitch template.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitProposal({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      recipientId: targetSkill.userId,
      recipientName: targetSkill.userName,
      recipientAvatar: targetSkill.userAvatar,
      offeredSkillTitle: useTimeCredits ? '1 Time Credit (1 hr)' : selectedOfferedSkill,
      requestedSkillTitle: targetSkill.title,
      status: 'pending',
      proposedDate,
      proposedTime,
      durationMinutes,
      pitchMessage: pitchMessage || `Hi ${targetSkill.userName}, I'd love to swap skills with you!`,
      useTimeCredits,
      timeCreditsAmount: useTimeCredits ? Math.ceil(durationMinutes / 60) : 0,
      icebreakers: aiIcebreakers,
    });
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl my-8 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Propose Skill Swap</h2>
              <p className="text-xs text-slate-400">
                To: <span className="font-semibold text-slate-200">{targetSkill.userName}</span> • {targetSkill.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Step 1: Select What You Offer */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>1. What Will You Offer in Exchange?</span>
              <span className="text-[11px] text-indigo-400 font-normal">Choose 1 option</span>
            </label>

            <div className="space-y-2">
              {currentUser.skillsOffered.map((skill, idx) => (
                <label
                  key={idx}
                  onClick={() => {
                    setUseTimeCredits(false);
                    setSelectedOfferedSkill(skill);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    !useTimeCredits && selectedOfferedSkill === skill
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      !useTimeCredits && selectedOfferedSkill === skill
                        ? 'border-indigo-400 bg-indigo-500 text-white'
                        : 'border-slate-500'
                    }`}>
                      {!useTimeCredits && selectedOfferedSkill === skill && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm font-semibold">{skill}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700">
                    Direct Skill
                  </span>
                </label>
              ))}

              {/* Option to use Time Credits */}
              <label
                onClick={() => {
                  setUseTimeCredits(true);
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  useTimeCredits
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    useTimeCredits ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-500'
                  }`}>
                    {useTimeCredits && <Check className="w-3 h-3 font-bold" />}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Use 1 Time Credit
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      You have <strong>{currentUser.timeCredits} credits</strong> available in your Time Bank.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Time Bank
                </span>
              </label>
            </div>
          </div>

          {/* Step 2: Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Proposed Date
              </label>
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Proposed Time
              </label>
              <input
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Session Length
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (Standard)</option>
                <option value={90}>90 Minutes (Deep Dive)</option>
              </select>
            </div>
          </div>

          {/* Step 3: Pitch Message with AI Assistant */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Introduce Yourself & Pitch Your Swap
              </label>

              <button
                type="button"
                onClick={handleGenerateAIPitch}
                disabled={isGeneratingAI}
                className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Writing Pitch...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>AI Pitch Writer</span>
                  </>
                )}
              </button>
            </div>

            {aiNotice && (
              <p className="text-xs text-purple-300 bg-purple-950/60 p-2 rounded-lg border border-purple-800/50">
                {aiNotice}
              </p>
            )}

            <textarea
              rows={4}
              placeholder="Hi! I saw your skill listing and would love to swap. I am interested in learning..."
              value={pitchMessage}
              onChange={(e) => setPitchMessage(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          {/* AI Generated Icebreaker Prompts */}
          {aiIcebreakers.length > 0 && (
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/50 rounded-xl space-y-1.5">
              <p className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Suggested Icebreakers for Chat:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-indigo-200/90">
                {aiIcebreakers.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Controls */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Send Swap Proposal</span>
            </button>
          </div>

        </form>
      </motion.div>
    </motion.div>
  );
};
