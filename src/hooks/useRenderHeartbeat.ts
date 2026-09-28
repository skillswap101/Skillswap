import { useEffect, useRef, useState, useCallback } from 'react';

export interface RenderHeartbeatOptions {
  /**
   * Ping interval in milliseconds. Defaults to 13 minutes (780,000ms),
   * which is safely below Render's 15-minute free-tier spin-down threshold.
   */
  intervalMs?: number;
  /**
   * Relative or absolute URL to ping. Defaults to '/api/health', which returns
   * a lightweight 200 OK JSON response without loading full HTML/assets.
   */
  endpoint?: string;
  /**
   * Whether the heartbeat is enabled. Defaults to true.
   */
  enabled?: boolean;
}

export interface RenderHeartbeatState {
  isActive: boolean;
  isPinging: boolean;
  lastPingTime: Date | null;
  lastStatus: 'success' | 'error' | null;
  triggerHeartbeat: () => Promise<boolean>;
}

const DEFAULT_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes
const DEFAULT_ENDPOINT = '/api/health';

/**
 * useRenderHeartbeat
 * 
 * Client-side keep-alive hook for Render-hosted deployments.
 * Pings the backend periodically while the tab is active/visible,
 * and automatically pauses when the browser tab is hidden or blurred
 * to conserve user device battery and bandwidth.
 */
export function useRenderHeartbeat(options: RenderHeartbeatOptions = {}): RenderHeartbeatState {
  const {
    intervalMs = DEFAULT_INTERVAL_MS,
    endpoint = DEFAULT_ENDPOINT,
    enabled = true,
  } = options;

  const [isActive, setIsActive] = useState<boolean>(() => typeof document !== 'undefined' ? !document.hidden : true);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [lastStatus, setLastStatus] = useState<'success' | 'error' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendHeartbeat = useCallback(async (): Promise<boolean> => {
    // Cancel any previous in-flight ping request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      setIsPinging(true);
      console.log('💓 User active: Sending Render keep-alive heartbeat...');

      // Note: We avoid 'no-cors' mode so we can read the response status and headers properly.
      // /api/health is on the same domain and returns a lightweight { status: 'healthy' } response.
      const res = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'SkillSwapHeartbeat',
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        console.log('✅ Render heartbeat successful (Status: %d)', res.status);
        setLastStatus('success');
        setLastPingTime(new Date());
        return true;
      } else {
        console.warn('⚠️ Render heartbeat returned non-200 status:', res.status);
        setLastStatus('error');
        return false;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        console.log('⏱️ Render heartbeat request timed out or cancelled');
      } else {
        console.warn('⚠️ Render heartbeat failed:', err?.message || err);
      }
      setLastStatus('error');
      return false;
    } finally {
      setIsPinging(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const startTimer = () => {
      if (!timerRef.current) {
        setIsActive(true);
        // Fire one heartbeat immediately on activation
        sendHeartbeat();
        timerRef.current = setInterval(sendHeartbeat, intervalMs);
      }
    };

    const stopTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsActive(false);
        console.log('🛑 Tab hidden or inactive: Render heartbeat paused.');
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };

    const handleFocus = () => {
      if (!document.hidden) {
        startTimer();
      }
    };

    const handleBlur = () => {
      // Only pause on blur if the document is actually hidden or losing window focus
      // This prevents accidental pauses when clicking into iframes or browser devtools
      if (document.hidden) {
        stopTimer();
      }
    };

    // Bind listeners
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Initial check on mount
    if (!document.hidden) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, intervalMs, sendHeartbeat]);

  return {
    isActive,
    isPinging,
    lastPingTime,
    lastStatus,
    triggerHeartbeat: sendHeartbeat,
  };
}
