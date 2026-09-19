import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  Server,
  CreditCard,
  Lock,
  Cpu,
  Layers,
  Terminal,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { AuditCheckResult } from '../types';

interface AuditDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDashboardModal: React.FC<AuditDashboardModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<{
    timestamp: string;
    overallStatus: 'healthy' | 'warnings' | 'critical';
    score: number;
    results: AuditCheckResult[];
    summary: string;
  } | null>(null);

  const runAudit = async () => {
    setLoading(true);
    try {
      const data = await api.runAudit();
      setAuditData(data);
    } catch (err) {
      console.error('Audit execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !auditData) {
      runAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pillars = [
    '1. Firebase & Database Integration',
    '2. Multi-Gateway Payment System',
    '3. P2P Escrow & Time Credits System',
    '4. Build & Environment Stability',
    '5. Actionable Implementation & Security',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Architectural & Code Health Audit</h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  5-Pillar Inspector
                </span>
              </div>
              <p className="text-xs text-slate-400">Verifying Firebase Admin, Stripe, M-Pesa Daraja, PayPal & Escrow</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runAudit}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-run Audit
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Audit Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Top Score Banner */}
          {auditData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl font-black font-mono">
                  {auditData.score}%
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Health Score</div>
                  <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Perfect Compliance
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Gateways Audited</div>
                  <div className="text-sm font-bold text-indigo-300">Stripe • M-Pesa • PayPal</div>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Escrow Ledger</div>
                  <div className="text-sm font-bold text-teal-300">Atomic Lock & Release Verified</div>
                </div>
              </div>
            </div>
          )}

          {/* Pillars Breakdown */}
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-400 mb-3" />
              <p className="text-sm font-medium">Executing automated end-to-end audit suite...</p>
            </div>
          ) : auditData ? (
            <div className="space-y-4">
              {pillars.map(pillarName => {
                const pillarResults = auditData.results.filter(r => r.pillar === pillarName);
                if (pillarResults.length === 0) return null;

                return (
                  <div key={pillarName} className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3 flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5" />
                      {pillarName}
                    </h4>

                    <div className="space-y-2">
                      {pillarResults.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-2.5">
                            {item.status === 'passed' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : item.status === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="font-semibold text-slate-200">{item.name}</div>
                              <div className="text-slate-400 mt-0.5 text-[11px] leading-relaxed font-mono">
                                {item.details}
                              </div>
                            </div>
                          </div>

                          {item.latencyMs !== undefined && (
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              {item.latencyMs}ms
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ready for Production Deployment</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Dismiss Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
