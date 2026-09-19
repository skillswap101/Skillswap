import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Copy, 
  Check, 
  Send, 
  Gift, 
  Share2, 
  Sparkles, 
  Mail, 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Twitter,
  Linkedin
} from 'lucide-react';
import { User } from '../types';

interface InviteFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  showToast: (message: string) => void;
}

interface ReferralHistoryItem {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'Completed' | 'Pending First Session' | 'Invited';
  rewardEarned: number;
  date: string;
}

const INITIAL_REFERRALS: ReferralHistoryItem[] = [
  {
    id: 'ref-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'Completed',
    rewardEarned: 1,
    date: '3 days ago',
  },
  {
    id: 'ref-2',
    name: 'David Chen',
    email: 'david.chen@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'Pending First Session',
    rewardEarned: 0,
    date: '1 day ago',
  },
  {
    id: 'ref-3',
    name: 'Maya Lin',
    email: 'maya.lin@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'Completed',
    rewardEarned: 1,
    date: '1 week ago',
  },
];

export const InviteFriendModal: React.FC<InviteFriendModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  showToast,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  
  // Email Invite Form
  const [friendEmail, setFriendEmail] = useState<string>('');
  const [friendName, setFriendName] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('Hey! I use SkillSwap to exchange skills like Spanish, React, and Guitar for free. Join using my referral link and we both get 1 free Time Credit!');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Referral list
  const [referrals, setReferrals] = useState<ReferralHistoryItem[]>(INITIAL_REFERRALS);

  if (!isOpen) return null;

  const referralCode = `SKILL-${currentUser.name.split(' ')[0].toUpperCase()}-2026`;
  const referralUrl = `https://skillswap.app/invite?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    showToast('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    showToast(`Referral code ${referralCode} copied!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSendEmailInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newRef: ReferralHistoryItem = {
        id: `ref-${Date.now()}`,
        name: friendName || friendEmail.split('@')[0],
        email: friendEmail,
        status: 'Invited',
        rewardEarned: 0,
        date: 'Just now',
      };

      setReferrals([newRef, ...referrals]);
      setIsSubmitting(false);
      setFriendEmail('');
      setFriendName('');
      showToast(`Invitation sent to ${friendEmail}!`);
    }, 600);
  };

  const totalEarned = referrals.reduce((acc, r) => acc + r.rewardEarned, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border-b border-slate-800 p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-full transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-2xl">
              <Gift className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full text-xs font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Give 1 Credit, Get 1 Credit
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Invite Friends to SkillSwap
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed">
            Expand your peer learning network! Invite friends to join. When they complete their first skill exchange, you both earn <strong className="text-amber-300">1 Free Time Credit</strong> (+1 Hour).
          </p>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Invites Sent</span>
              <p className="text-xl font-black text-white">{referrals.length}</p>
            </div>
            <div className="space-y-0.5 border-x border-slate-800 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Friends Joined</span>
              <p className="text-xl font-black text-emerald-400">
                {referrals.filter((r) => r.status !== 'Invited').length}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Credits Earned</span>
              <p className="text-xl font-black text-amber-400 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-amber-400" />
                +{totalEarned}
              </p>
            </div>
          </div>

          {/* Referral Link & Code Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-indigo-400" />
              Your Personal Referral Link & Code
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="w-full pl-3 pr-24 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-mono focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:w-48 shrink-0">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Code</span>
                  <span className="font-mono font-bold text-white text-xs">{referralCode}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-400 mr-1">Share via:</span>
              
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${customNote} ${referralUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-bold transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(customNote)}&url=${encodeURIComponent(referralUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-800/60 rounded-xl text-xs font-bold transition-all"
              >
                <Twitter className="w-3.5 h-3.5 text-sky-400" />
                <span>X / Twitter</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 rounded-xl text-xs font-bold transition-all"
              >
                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Send Direct Email Invite Form */}
          <form onSubmit={handleSendEmailInvite} className="space-y-3 bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-purple-400" />
              Send Direct Email Invitation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Friend's Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Maria Rossi"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Friend's Email Address *</label>
                <input
                  type="email"
                  placeholder="friend@example.com"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Personal Message</label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending Invite...' : 'Send Email Invite'}</span>
            </button>
          </form>

          {/* Referral History */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                Referral Activity & Claims
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">{referrals.length} Total</span>
            </div>

            <div className="space-y-2">
              {referrals.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-300 border border-slate-700">
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        item.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white">{item.name}</span>
                      <span className="block text-[10px] text-slate-400">{item.email} • {item.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                      item.status === 'Completed'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : item.status === 'Pending First Session'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {item.status}
                    </span>

                    {item.rewardEarned > 0 ? (
                      <span className="text-xs font-black text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        +1 Credit
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">0 Credits</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
