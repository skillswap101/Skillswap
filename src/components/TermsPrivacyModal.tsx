import React, { useState } from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2, X, Eye, BookOpen } from 'lucide-react';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy';
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">SkillSwap 5.0 Governance & Policies</h2>
              <p className="text-[11px] text-slate-400">Terms of Service, Escrow Rules & Privacy Commitments</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'terms'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Terms of Service & Escrow Rules
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'privacy'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Privacy Policy & Data Security
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed custom-scrollbar flex-1">
          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-1">
                <h3 className="font-extrabold text-white flex items-center gap-1.5 text-sm">
                  <Lock className="w-4 h-4 text-amber-400" />
                  1. Time Bank Escrow Policy
                </h3>
                <p>
                  All 1-on-1 skill swaps are protected by automated Escrow. When a session proposal is accepted, 1 Time Credit is locked securely in Escrow until the teaching session completes via WebRTC video call or in-person check-in.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-200">2. Code of Conduct & Peer Standards</h4>
                <p>
                  SkillSwap is a respectful community of lifelong learners and mentors. Users must arrive on time for scheduled 1-on-1 calls, maintain professional courtesy, and refrain from commercial solicitation or harassment.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-200">3. Dispute Protection & Resolution</h4>
                <p>
                  In the event of a no-show or technical disruption, either party may trigger Dispute Protection during or after the call. Time credits are held in safety until resolved or refunded.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-200">4. Intellectual Property & Shared Code</h4>
                <p>
                  Code snippets, whiteboard drawings, and notes shared during live sessions remain the co-property of session participants unless explicitly agreed otherwise.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-1">
                <h3 className="font-extrabold text-white flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  1. Zero Data Selling Commitment
                </h3>
                <p>
                  SkillSwap never sells, rents, or monetizes your personal data, profile history, or session notes to third parties.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-200">2. WebRTC Peer-to-Peer Encryption</h4>
                <p>
                  Live video streams and audio connections are transmitted directly peer-to-peer (P2P) using encrypted STUN/DTLS connections. Video streams are never recorded or stored on central servers.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-200">3. Local Storage & Offline Cache</h4>
                <p>
                  Your profile preferences, offline draft messages, and session bookmarks are stored locally on your device for rapid offline preview access.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-200">4. Your Data Rights</h4>
                <p>
                  You retain full ownership of your account data. You may request account deletion or export your learning history at any time through the Settings Hub.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">Effective Date: August 2026 • SkillSwap Version 5.0</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            I Accept & Understand
          </button>
        </div>

      </div>
    </div>
  );
};
