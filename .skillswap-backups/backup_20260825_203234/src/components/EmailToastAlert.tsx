import React, { useEffect } from 'react';
import { Mail, X, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { EmailNotification } from '../types';

interface EmailToastAlertProps {
  notification: EmailNotification | null;
  onClose: () => void;
  onOpenInbox: () => void;
}

export const EmailToastAlert: React.FC<EmailToastAlertProps> = ({
  notification,
  onClose,
  onOpenInbox,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
            <Mail className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> New Email Alert
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-xs font-bold text-slate-100 truncate mt-0.5">
              {notification.subject}
            </h4>

            <p className="text-xs text-slate-400 line-clamp-2 mt-1">
              {notification.previewText}
            </p>

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  onOpenInbox();
                  onClose();
                }}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                Open in Email Simulator
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
