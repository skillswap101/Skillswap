import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  QrCode, 
  Sparkles, 
  Clock, 
  UserCheck, 
  FileCheck,
  Share2,
  Copy,
  Printer
} from 'lucide-react';
import { User } from '../types';

export interface VerifiedCertificate {
  id: string;
  skillTitle: string;
  recipientName: string;
  recipientAvatar: string;
  mentorName: string;
  mentorAvatar: string;
  hoursCompleted: number;
  issueDate: string;
  verificationHash: string;
  credentialUrl: string;
  category: string;
  score: number;
}

const DEMO_CERTIFICATES: VerifiedCertificate[] = [
  {
    id: 'cert-101',
    skillTitle: 'Modern React & TypeScript Development',
    recipientName: 'Alex Rivera',
    recipientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    mentorName: 'Elena Rostova',
    mentorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    hoursCompleted: 24,
    issueDate: 'August 2, 2026',
    verificationHash: '0x8f2a1b9e7c3d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
    credentialUrl: 'https://skillswap.app/verify/cert-101',
    category: 'Software Engineering',
    score: 98
  },
  {
    id: 'cert-102',
    skillTitle: 'UI/UX Design Systems & Figma Architecture',
    recipientName: 'Alex Rivera',
    recipientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    mentorName: 'David Chen',
    mentorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    hoursCompleted: 15,
    issueDate: 'July 20, 2026',
    verificationHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    credentialUrl: 'https://skillswap.app/verify/cert-102',
    category: 'Design & Creative',
    score: 96
  }
];

interface SkillCertificationsSectionProps {
  currentUser: User;
  showToast: (msg: string) => void;
}

export const SkillCertificationsSection: React.FC<SkillCertificationsSectionProps> = ({
  currentUser,
  showToast,
}) => {
  const [selectedCert, setSelectedCert] = useState<VerifiedCertificate | null>(null);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    showToast('Verification SHA-256 Hash copied to clipboard!');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white rounded-xl shadow-md">
              <FileCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Verified Peer Skill Certificates
            </h2>
            <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-extrabold rounded-full border border-emerald-800">
              {DEMO_CERTIFICATES.length} Verified
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Cryptographically signed peer certificates earned through verified 1-on-1 time credit exchanges.
          </p>
        </div>

        <button
          onClick={() => showToast('Milestone evaluation triggered. 1 certificate pending peer signature!')}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Claim Milestone Certificate</span>
        </button>
      </div>

      {/* Certificates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DEMO_CERTIFICATES.map((cert) => (
          <div
            key={cert.id}
            className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-indigo-500/50 transition-all shadow-md group relative overflow-hidden"
          >
            {/* Top Badge Seal */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Credential
              </span>
              <span className="text-[10px] font-mono text-slate-500">{cert.id}</span>
            </div>

            {/* Title & Category */}
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                {cert.skillTitle}
              </h3>
              <p className="text-[11px] text-slate-400">
                {cert.category} • {cert.hoursCompleted} Hours Completed
              </p>
            </div>

            {/* Mentors / Issuer Peer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                <img
                  src={cert.mentorAvatar}
                  alt={cert.mentorName}
                  className="w-7 h-7 rounded-full object-cover border border-indigo-400/50"
                />
                <div>
                  <p className="text-[10px] text-slate-400">Verified Mentor</p>
                  <p className="font-bold text-white text-[11px]">{cert.mentorName}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-400">Issued On</p>
                <p className="font-bold text-slate-200 text-[11px]">{cert.issueDate}</p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setSelectedCert(cert)}
                className="px-3 py-1.5 bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-700/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>View Full Certificate</span>
              </button>

              <button
                onClick={() => handleCopyHash(cert.verificationHash)}
                className="p-1.5 text-slate-400 hover:text-slate-200"
                title="Copy SHA-256 Hash"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Official Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* Background Seal Watermark */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Official SkillSwap Certificate of Completion
                </span>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Main Certificate Sheet */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-5 relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 text-slate-950 flex items-center justify-center mx-auto shadow-lg font-black">
                <Award className="w-7 h-7 text-slate-950" />
              </div>

              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Certificate of Mastery
              </p>

              <div className="space-y-1">
                <p className="text-xs text-slate-400">This is to certify that</p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">{selectedCert.recipientName}</h2>
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <p className="text-xs text-slate-400">has successfully completed {selectedCert.hoursCompleted} hours of peer-verified training in</p>
                <p className="text-base font-extrabold text-amber-300">{selectedCert.skillTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-left text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Verified Peer Mentor</p>
                  <p className="font-extrabold text-white">{selectedCert.mentorName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Issue Date</p>
                  <p className="font-extrabold text-white">{selectedCert.issueDate}</p>
                </div>
              </div>

              {/* SHA-256 Hash box */}
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400 truncate flex items-center justify-between">
                <span className="truncate">Hash: {selectedCert.verificationHash}</span>
                <button
                  onClick={() => handleCopyHash(selectedCert.verificationHash)}
                  className="ml-2 text-indigo-400 font-bold shrink-0 hover:underline"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>

              <button
                onClick={() => {
                  showToast('Certificate PDF downloaded successfully!');
                  setSelectedCert(null);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Credential</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
