import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div id="error-boundary-screen" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 mt-1">
                An unexpected interface error occurred. Your profile and skills data remain safe in the cloud.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button
                id="error-reload-btn"
                onClick={this.handleReload}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload SkillSwap
              </button>
              <button
                id="error-home-btn"
                onClick={() => {
                  try {
                    localStorage.removeItem('skillswap_skills');
                  } catch {}
                  window.location.href = '/';
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all border border-slate-700"
              >
                <Home className="w-3.5 h-3.5" />
                Reset Cache & Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
