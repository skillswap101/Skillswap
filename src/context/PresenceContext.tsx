import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PresenceState {
  onlineUserIds: Set<string>;
  lastSeenMap: Record<string, string>;
  isUserOnline: (userId?: string | null) => boolean;
  getUserPresenceLabel: (userId?: string | null) => 'Online' | 'Offline' | 'Last seen recently';
}

const PresenceContext = createContext<PresenceState>({
  onlineUserIds: new Set(),
  lastSeenMap: {},
  isUserOnline: () => false,
  getUserPresenceLabel: () => 'Offline',
});

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const configured =
      typeof isSupabaseConfigured === 'function'
        ? isSupabaseConfigured()
        : Boolean(isSupabaseConfigured);

    if (!configured || !currentUser?.uid) {
      setOnlineUserIds(new Set());
      return;
    }

    const uid = currentUser.uid;
    const channel = supabase.channel('skillswap_presence', {
      config: {
        presence: {
          key: uid,
        },
      },
    });

    const handleSync = () => {
      const state = channel.presenceState();
      const currentOnline = new Set<string>();
      const updatedLastSeen: Record<string, string> = { ...lastSeenMap };

      Object.entries(state).forEach(([key, presences]) => {
        if (key && key !== 'guest') {
          currentOnline.add(key);
          const p = (presences as any[])?.[0];
          if (p?.onlineAt) {
            updatedLastSeen[key] = p.onlineAt;
          }
        }
      });

      setOnlineUserIds(currentOnline);
      setLastSeenMap(updatedLastSeen);
    };

    const handleLeave = ({ key }: { key: string }) => {
      if (key) {
        setLastSeenMap((prev) => ({
          ...prev,
          [key]: new Date().toISOString(),
        }));
      }
    };

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'leave' }, handleLeave)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              userId: uid,
              onlineAt: new Date().toISOString(),
            });
          } catch (err) {
            console.warn('[Presence] Track error:', err);
          }
        }
      });

    // Handle visibility and tab focus changes
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          await channel.track({
            userId: uid,
            onlineAt: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
    };
  }, [currentUser?.uid]);

  const isUserOnline = useCallback(
    (userId?: string | null): boolean => {
      if (!userId) return false;
      // The current logged-in user is always online if authenticated
      if (currentUser?.uid === userId) return true;
      return onlineUserIds.has(userId);
    },
    [currentUser?.uid, onlineUserIds]
  );

  const getUserPresenceLabel = useCallback(
    (userId?: string | null): 'Online' | 'Offline' | 'Last seen recently' => {
      if (!userId) return 'Offline';
      if (isUserOnline(userId)) return 'Online';

      const lastSeen = lastSeenMap[userId];
      if (lastSeen) {
        const diffMinutes = (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60);
        if (diffMinutes < 60) return 'Last seen recently';
      }
      return 'Offline';
    },
    [isUserOnline, lastSeenMap]
  );

  const value = useMemo(
    () => ({
      onlineUserIds,
      lastSeenMap,
      isUserOnline,
      getUserPresenceLabel,
    }),
    [onlineUserIds, lastSeenMap, isUserOnline, getUserPresenceLabel]
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
};

export function usePresence() {
  return useContext(PresenceContext);
}
