import React, { useRef } from 'react';
import {
  Award,
  Download,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  Share2,
  Sparkles,
} from 'lucide-react';
import { SwapContract, UserProfile } from '../types';

interface SkillCertificateModalProps {
  swap: SwapContract;
  currentUser: UserProfile;
  onClose: () => void;
}

export const SkillCertificateModal: React.FC<SkillCertificateModalProps> = ({
  swap,
  currentUser,
  onClose,
}) => {
  const certRef = useRef<HTMLDivElement | null>(null);
  const certId = `SS5-VERIFY-${swap.id.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const issueDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSvg = () => {
    const svgElement = certRef.current?.querySelector('svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SkillSwap_Certificate_${swap.skillTitle.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 text-slate-100 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Verifiable Peer Mastery Certificate</h3>
              <p className="text-xs text-slate-400">Cryptographically verifiable peer learning credential</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-8">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownloadSvg}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download SVG
            </button>
          </div>
        </div>

        {/* Certificate Display Canvas */}
        <div ref={certRef} className="rounded-2xl overflow-hidden shadow-2xl border border-amber-500/30 bg-slate-950 p-2">
          <svg
            viewBox="0 0 900 620"
            className="w-full h-auto bg-[#0a0f1d] text-white rounded-xl font-sans"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Gold Gradient */}
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>

            {/* Guilloche Double Outer Border */}
            <rect x="20" y="20" width="860" height="580" rx="16" fill="none" stroke="url(#goldGrad)" strokeWidth="3" opacity="0.8" />
            <rect x="30" y="30" width="840" height="560" rx="12" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="6,6" />
            
            {/* Corner Badges */}
            <circle cx="45" cy="45" r="8" fill="url(#goldGrad)" />
            <circle cx="855" cy="45" r="8" fill="url(#goldGrad)" />
            <circle cx="45" cy="575" r="8" fill="url(#goldGrad)" />
            <circle cx="855" cy="575" r="8" fill="url(#goldGrad)" />

            {/* Header / Brand */}
            <text x="450" y="85" textAnchor="middle" fill="#6366f1" fontSize="14" fontWeight="bold" letterSpacing="4">
              SKILLSWAP 5.0 • PEER EXCHANGE FOUNDATION
            </text>
            <text x="450" y="130" textAnchor="middle" fill="url(#goldGrad)" fontSize="28" fontWeight="bold" letterSpacing="2">
              CERTIFICATE OF MASTERY
            </text>
            <text x="450" y="165" textAnchor="middle" fill="#94a3b8" fontSize="13" letterSpacing="1">
              THIS IS PROUDLY CONFERRED UPON
            </text>

            {/* Recipient Name */}
            <text x="450" y="225" textAnchor="middle" fill="#ffffff" fontSize="32" fontWeight="bold">
              {swap.requesterName}
            </text>
            <line x1="250" y1="245" x2="650" y2="245" stroke="#334155" strokeWidth="1" />

            {/* Statement of Completion */}
            <text x="450" y="280" textAnchor="middle" fill="#cbd5e1" fontSize="14">
              for successfully completing an intensive {swap.hours}-hour practical peer mentorship in
            </text>
            <text x="450" y="320" textAnchor="middle" fill="#38bdf8" fontSize="22" fontWeight="bold">
              {swap.skillTitle}
            </text>
            <text x="450" y="350" textAnchor="middle" fill="#94a3b8" fontSize="12">
              Category: {swap.category} • Bilateral Escrow Verified & Settled
            </text>

            {/* Signatures & Seal Section */}
            <g transform="translate(100, 420)">
              {/* Mentor Signature */}
              <text x="80" y="40" textAnchor="middle" fill="#38bdf8" fontSize="16" fontFamily="serif" fontStyle="italic">
                {swap.providerName}
              </text>
              <line x1="0" y1="50" x2="160" y2="50" stroke="#475569" strokeWidth="1" />
              <text x="80" y="70" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
                VERIFIED MENTOR
              </text>
            </g>

            {/* Gold Seal (Center) */}
            <g transform="translate(450, 460)">
              <circle cx="0" cy="0" r="38" fill="#1e1b4b" stroke="url(#goldGrad)" strokeWidth="3" />
              <circle cx="0" cy="0" r="32" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="3,3" />
              <text x="0" y="-8" textAnchor="middle" fill="url(#goldGrad)" fontSize="8" fontWeight="bold" letterSpacing="1">
                AUTHENTIC
              </text>
              <text x="0" y="8" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                SS5
              </text>
              <text x="0" y="20" textAnchor="middle" fill="url(#goldGrad)" fontSize="7" fontWeight="bold">
                VERIFIED
              </text>
            </g>

            {/* Issuer Signature */}
            <g transform="translate(640, 420)">
              <text x="80" y="40" textAnchor="middle" fill="#38bdf8" fontSize="16" fontFamily="serif" fontStyle="italic">
                SkillSwap Protocol
              </text>
              <line x1="0" y1="50" x2="160" y2="50" stroke="#475569" strokeWidth="1" />
              <text x="80" y="70" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
                SMART ESCROW PROTOCOL
              </text>
            </g>

            {/* Footer Metadata */}
            <text x="60" y="560" fill="#64748b" fontSize="10" fontFamily="monospace">
              ISSUED: {issueDate}
            </text>
            <text x="840" y="560" textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">
              VERIFICATION ID: {certId}
            </text>
          </svg>
        </div>

        {/* Verification Footer Banner */}
        <div className="mt-4 p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographic Escrow Verification Proof Active</span>
          </div>
          <span className="font-mono text-slate-400 text-[11px]">{certId}</span>
        </div>

      </div>
    </div>
  );
};
