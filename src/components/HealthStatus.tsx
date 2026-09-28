import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface PingStatus {
  frontend: boolean | null;
  supabase: boolean | null;
  backend: boolean | null;
}

export async function frontendPing(): Promise<boolean> {
  try {
    // Verifies browser online status and responsiveness
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  } catch {
    return false;
  }
}

export async function supabasePing(): Promise<boolean> {
  try {
    const configured =
      typeof isSupabaseConfigured === 'function'
        ? isSupabaseConfigured()
        : Boolean(isSupabaseConfigured);

    if (!configured) {
      // In development / demo if Supabase credentials are placeholders, consider reachable if configured
      return false;
    }

    // Attempt a lightweight query to check connectivity
    const { error } = await supabase.from('users').select('id').limit(1);
    // If error is PGRST301 (JWT invalid/expired) or permission error, Supabase is still alive and responding!
    // Only fail on network/connectivity fetch errors.
    if (error && error.message?.includes('FetchError')) {
      return false;
    }
    return true;
  } catch (err: any) {
    if (err?.message?.toLowerCase().includes('failed to fetch')) {
      return false;
    }
    return false;
  }
}

export async function backendPing(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return Boolean(data?.status === 'healthy' || data?.status === 'ok' || data?.status);
  } catch {
    return false;
  }
}

export function PingDot({ label, ok }: { label: string; ok: boolean | null }) {
  const getStatusColor = () => {
    if (ok === null) return 'bg-amber-400 animate-pulse';
    return ok ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50';
  };

  const getStatusText = () => {
    if (ok === null) return 'Checking...';
    return ok ? 'OK' : 'Error';
  };

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-medium text-slate-300 shadow-sm"
      title={`${label}: ${getStatusText()}`}
    >
      <span className={`w-2 h-2 rounded-full shadow-sm transition-all duration-300 ${getStatusColor()}`} />
      <span className="text-slate-400 font-semibold">{label}:</span>
      <span className={ok === null ? 'text-amber-300' : ok ? 'text-emerald-400' : 'text-rose-400'}>
        {getStatusText()}
      </span>
    </div>
  );
}

export default function HealthStatus({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState<PingStatus>({
    frontend: null,
    supabase: null,
    backend: null,
  });

  useEffect(() => {
    let mounted = true;

    const checkAll = async () => {
      try {
        const [f, s, b] = await Promise.all([
          frontendPing(),
          supabasePing(),
          backendPing(),
        ]);
        if (mounted) {
          setStatus({ frontend: f, supabase: s, backend: b });
        }
      } catch {
        if (mounted) {
          setStatus((prev) => ({
            frontend: prev.frontend,
            supabase: prev.supabase ?? false,
            backend: prev.backend ?? false,
          }));
        }
      }
    };

    checkAll();
    const interval = setInterval(checkAll, 10000); // ping every 10s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`health-bar flex flex-wrap items-center gap-2 ${className}`}>
      <PingDot label="Frontend" ok={status.frontend} />
      <PingDot label="Supabase" ok={status.supabase} />
      <PingDot label="Backend" ok={status.backend} />
    </div>
  );
}
