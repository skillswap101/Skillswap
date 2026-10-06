import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { supabase, isSupabaseConfigured, setSupabaseAuthToken } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type {
  User,
  Skill,
  SwapProposal,
  Session,
  ChatMessage,
  Review,
} from '../types';

export interface CloudStateBridgeResult {
  currentUser: User | null;
  skills: Skill[];
  proposals: SwapProposal[];
  sessions: Session[];
  messages: ChatMessage[];
  reviews: Review[];

  loading: boolean;
  authenticated: boolean;
  error: string | null;

  setCurrentUser: (action: User | ((prev: User) => User)) => void;
  setSkills: Dispatch<SetStateAction<Skill[]>>;
  setProposals: Dispatch<SetStateAction<SwapProposal[]>>;
  setSessions: Dispatch<SetStateAction<Session[]>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setReviews: Dispatch<SetStateAction<Review[]>>;

  // Direct database mutation methods
  updateUserProfileInCloud: (data: Partial<User>) => Promise<void>;
  addSkillToCloud: (skill: Skill) => Promise<void>;
  updateSkillInCloud: (skillId: string, data: Partial<Skill>) => Promise<void>;
  deleteSkillFromCloud: (skillId: string) => Promise<void>;

  addProposalToCloud: (proposal: SwapProposal) => Promise<void>;
  updateProposalStatusInCloud: (proposalId: string, status: SwapProposal['status']) => Promise<void>;

  addSessionToCloud: (session: Session) => Promise<void>;
  updateSessionInCloud: (sessionId: string, data: Partial<Session>) => Promise<void>;

  addMessageToCloud: (message: ChatMessage) => Promise<void>;
  markMessageReadInCloud: (messageId: string) => Promise<void>;
  addReviewToCloud: (review: Review) => Promise<void>;
}

function cleanRow<T>(row: any): T {
  if (!row) return row;
  const raw = row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
  const cleaned: any = {
    ...raw,
    ...row,
    id: String(row.id || raw.id),
  };

  // Bidirectional mapping for messages
  if (row.sender_id && !cleaned.senderId) cleaned.senderId = row.sender_id;
  if (row.receiver_id && !cleaned.recipientId) cleaned.recipientId = row.receiver_id;
  if (row.created_at && !cleaned.createdAt) cleaned.createdAt = String(row.created_at);

  // Bidirectional mapping for sessions
  if (row.host_id && !cleaned.mentorId) cleaned.mentorId = row.host_id;
  if (row.attendee_id && !cleaned.learnerId) cleaned.learnerId = row.attendee_id;

  // Bidirectional mapping for reviews
  if (row.reviewer_id && !cleaned.authorId) cleaned.authorId = row.reviewer_id;

  return cleaned as T;
}

function loadFromOfflineCache<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export function useCloudStateBridge(): CloudStateBridgeResult {
  const { currentUser: firebaseUser, userProfile, loading: authLoading } = useAuth();

  const [currentUser, setCurrentUserState] = useState<User | null>(() =>
    userProfile ? (userProfile as User) : null
  );

  const [skills, setSkillsState] = useState<Skill[]>(() =>
    loadFromOfflineCache('skillswap_skills', [])
  );

  const [proposals, setProposalsState] = useState<SwapProposal[]>(() =>
    loadFromOfflineCache('skillswap_proposals', [])
  );

  const [sessions, setSessionsState] = useState<Session[]>(() =>
    loadFromOfflineCache('skillswap_sessions', [])
  );

  const [messages, setMessagesState] = useState<ChatMessage[]>(() =>
    loadFromOfflineCache('skillswap_messages', [])
  );

  const [reviews, setReviewsState] = useState<Review[]>(() =>
    loadFromOfflineCache('skillswap_reviews', [])
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uidRef = useRef<string | null>(null);

  const requireAuthenticatedUser = useCallback(() => {
    if (!firebaseUser) {
      throw new Error("Authenticated user required.");
    }
    return firebaseUser.uid;
  }, [firebaseUser]);

  // Synchronize identity
  useEffect(() => {
    if (authLoading) {
      setAuthenticated(false);
      setError(null);
      return;
    }

    if (firebaseUser) {
      uidRef.current = firebaseUser.uid;
      setAuthenticated(true);

      if (userProfile) {
        setCurrentUserState({
          ...(userProfile as User),
          id: firebaseUser.uid,
        });
      }
      setError(null);
      return;
    }

    uidRef.current = null;
    setAuthenticated(false);
    if (!authLoading) {
      setCurrentUserState(null);
      setError(null);
    }
  }, [userProfile, firebaseUser, authLoading]);

  // Sync to local offline cache
  useEffect(() => {
    try {
      const sanitizedSkills = skills.map((s) => {
        if (s.previewVideoUrl && (s.previewVideoUrl.startsWith('data:') || s.previewVideoUrl.startsWith('blob:'))) {
          return { ...s, previewVideoUrl: undefined };
        }
        return s;
      });
      localStorage.setItem('skillswap_skills', JSON.stringify(sanitizedSkills));
      localStorage.setItem('skillswap_proposals', JSON.stringify(proposals));
      localStorage.setItem('skillswap_sessions', JSON.stringify(sessions));
      localStorage.setItem('skillswap_messages', JSON.stringify(messages));
      localStorage.setItem('skillswap_reviews', JSON.stringify(reviews));
    } catch (e) {
      console.warn('[CloudBridge] Offline cache quota warning:', e);
    }
  }, [skills, proposals, sessions, messages, reviews]);

  // Direct mutation methods
  const isCloudConfigured = useCallback(() => {
    return typeof isSupabaseConfigured === 'function'
      ? isSupabaseConfigured()
      : Boolean(isSupabaseConfigured);
  }, []);

  const updateUserProfileInCloud = useCallback(async (data: Partial<User>) => {
    const uid = requireAuthenticatedUser();
    setCurrentUserState((prev) => (prev ? { ...prev, ...data } : null));

    if (!isCloudConfigured()) return;

    try {
      const payload = {
        ...data,
        updatedAt: new Date().toISOString(),
        raw_data: data,
      };
      const { error } = await supabase.from('users').update(payload).eq('id', uid);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error updating user profile in Supabase:', err?.message || err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') return;
      throw err;
    }
  }, [requireAuthenticatedUser, isCloudConfigured]);

  const addSkillToCloud = useCallback(async (skill: Skill) => {
    const uid = requireAuthenticatedUser();
    const cleanSkill = { ...skill };
    if (cleanSkill.previewVideoUrl && cleanSkill.previewVideoUrl.startsWith('blob:')) {
      cleanSkill.previewVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    }
    setSkillsState((prev) => [cleanSkill, ...prev.filter((s) => s.id !== cleanSkill.id)]);

    if (!isCloudConfigured()) return;

    try {
      // Ensure user exists in users table (foreign key constraint)
      const userPayload = {
        id: uid,
        name: currentUser?.name || skill.userName || 'SkillSwap Member',
        email: currentUser?.email || `${uid}@skillswap.local`,
        avatar: currentUser?.avatar || skill.userAvatar || null,
        location: currentUser?.location || skill.userLocation || null,
        timeCredits: currentUser?.timeCredits || 10,
        raw_data: currentUser || {},
      };
      await supabase.from('users').upsert(userPayload);

      const payload = {
        ...cleanSkill,
        userId: uid,
        createdAt: cleanSkill.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        raw_data: cleanSkill,
      };
      const { error } = await supabase.from('skills').upsert(payload);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error writing skill to Supabase:', err?.message || err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') return;
      throw err;
    }
  }, [requireAuthenticatedUser, currentUser, isCloudConfigured]);

  const updateSkillInCloud = useCallback(async (skillId: string, data: Partial<Skill>) => {
    requireAuthenticatedUser();
    setSkillsState((prev) => prev.map((s) => (s.id === skillId ? { ...s, ...data } : s)));

    if (!isCloudConfigured()) return;

    try {
      const payload = {
        ...data,
        updatedAt: new Date().toISOString(),
        raw_data: data,
      };
      const { error } = await supabase.from('skills').update(payload).eq('id', skillId);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error updating skill in Supabase:', err?.message || err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') return;
      throw err;
    }
  }, [requireAuthenticatedUser, isCloudConfigured]);

  const deleteSkillFromCloud = useCallback(async (skillId: string) => {
    requireAuthenticatedUser();
    setSkillsState((prev) => prev.filter((s) => s.id !== skillId));

    if (!isCloudConfigured()) return;

    try {
      const { error } = await supabase.from('skills').delete().eq('id', skillId);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error deleting skill from Supabase:', err?.message || err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') return;
      throw err;
    }
  }, [requireAuthenticatedUser, isCloudConfigured]);

  const addProposalToCloud = useCallback(async (proposal: SwapProposal) => {
    const uid = requireAuthenticatedUser();
    setProposalsState((prev) => [proposal, ...prev.filter((p) => p.id !== proposal.id)]);

    if (!isCloudConfigured()) return;

    try {
      const participantIds = Array.from(
        new Set([uid, proposal.recipientId, proposal.senderId].filter(Boolean))
      );
      const payload = {
        ...proposal,
        participantIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        raw_data: proposal,
      };
      const { error } = await supabase.from('proposals').upsert(payload);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error saving proposal to Supabase:', err?.message || err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') return;
      throw err;
    }
  }, [requireAuthenticatedUser, isCloudConfigured]);

  const updateProposalStatusInCloud = useCallback(async (
    proposalId: string,
    status: SwapProposal['status']
  ) => {
    requireAuthenticatedUser();
    setProposalsState((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status } : p))
    );

    if (!isCloudConfigured()) return;

    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status, updatedAt: new Date().toISOString() })
        .eq('id', proposalId);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error updating proposal status in Supabase:', err?.message || err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') return;
      throw err;
    }
  }, [requireAuthenticatedUser, isCloudConfigured]);

  const addSessionToCloud = useCallback(async (session: Session) => {
    const uid = requireAuthenticatedUser();
    setSessionsState((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);

    if (!isCloudConfigured()) return;

    try {
      const participantIds = Array.from(
        new Set([
          uid,
          session.mentorId,
          session.learnerId,
          ...(session.participantIds || []),
        ].filter(Boolean))
      ) as string[];

      const payload = {
        ...session,
        participantIds,
        mentorId: session.mentorId,
        host_id: session.mentorId,
        learnerId: session.learnerId,
        attendee_id: session.learnerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        raw_data: session,
      };
      const { error } = await supabase.from('sessions').upsert(payload);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error saving session to Supabase:', err?.message || err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') return;
      throw err;
    }
  }, [requireAuthenticatedUser, isCloudConfigured]);

  const updateSessionInCloud = useCallback(async (sessionId: string, data: Partial<Session>) => {
    requireAuthenticatedUser();
    setSessionsState((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s))
    );

    if (!isCloudConfigured()) return;

    try {
      const payload = {
        ...data,
        ...(data.mentorId ? { mentorId: data.mentorId, host_id: data.mentorId } : {}),
        ...(data.learnerId ? { learnerId: data.learnerId, attendee_id: data.learnerId } : {}),
        updatedAt: new Date().toISOString(),
        raw_data: data,
      };
      const { error } = await supabase.from('sessions').update(payload).eq('id', sessionId);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error updating session in Supabase:', err?.message || err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') return;
      throw err;
    }
  }, [requireAuthenticatedUser, isCloudConfigured]);

  const addMessageToCloud = useCallback(async (message: ChatMessage) => {
    const uid = requireAuthenticatedUser();
    setMessagesState((prev) => [...prev, { ...message, senderId: uid, read: false }]);

    if (!isCloudConfigured()) return;

    try {
      const participantIds = Array.from(
        new Set([uid, message.senderId, message.recipientId, ...(message.participantIds || [])].filter(Boolean))
      ) as string[];

      const payload = {
        ...message,
        senderId: uid,
        sender_id: uid,
        recipientId: message.recipientId,
        receiver_id: message.recipientId,
        participantIds,
        read: message.read || false,
        createdAt: message.createdAt || new Date().toISOString(),
        raw_data: message,
      };
      const { error } = await supabase.from('messages').insert(payload);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error sending message to Supabase:', err?.message || err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') return;
      throw err;
    }
  }, [requireAuthenticatedUser, isCloudConfigured]);

  const markMessageReadInCloud = useCallback(async (messageId: string) => {
    requireAuthenticatedUser();
    setMessagesState((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
    );

    if (!isCloudConfigured()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error marking message read in Supabase:', err?.message || err);
    }
  }, [requireAuthenticatedUser, isCloudConfigured]);

  const addReviewToCloud = useCallback(async (review: Review) => {
    requireAuthenticatedUser();
    setReviewsState((prev) => [review, ...prev.filter((r) => r.id !== review.id)]);

    if (!isCloudConfigured()) return;

    try {
      const payload = {
        ...review,
        authorId: review.authorId,
        reviewer_id: review.authorId,
        createdAt: new Date().toISOString(),
        raw_data: review,
      };
      const { error } = await supabase.from('reviews').insert(payload);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.warn('[CloudBridge] Error saving review to Supabase:', err?.message || err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') return;
      throw err;
    }
  }, [requireAuthenticatedUser, isCloudConfigured]);

  // Supabase Real-time Subscriptions and Queries
  useEffect(() => {
    let disposed = false;

    const configured =
      typeof isSupabaseConfigured === 'function'
        ? isSupabaseConfigured()
        : Boolean(isSupabaseConfigured);

    if (!configured) {
      setLoading(false);
      return;
    }

    if (!firebaseUser) {
      uidRef.current = null;
      setAuthenticated(false);
      setLoading(false);

      // Fetch public marketplace skills even for guest visitors
      (async () => {
        try {
          const { data } = await supabase
            .from('skills')
            .select('*')
            .order('createdAt', { ascending: false });
          if (!disposed && data && data.length > 0) {
            setSkillsState(data.map((r) => cleanRow<Skill>(r)));
          }
        } catch (err) {
          console.warn('[CloudBridge] Error fetching marketplace skills:', err);
        }
      })();

      return;
    }

    const uid = firebaseUser.uid;
    uidRef.current = uid;
    setAuthenticated(true);
    setLoading(true);

    const fetchData = async () => {
      try {
        const token = await firebaseUser.getIdToken().catch(() => null);
        if (token) setSupabaseAuthToken(token);

        // Fetch User Profile
        const { data: userRow } = await supabase
          .from('users')
          .select('*')
          .eq('id', uid)
          .maybeSingle();
        if (!disposed && userRow) {
          setCurrentUserState(cleanRow<User>(userRow));
        }

        // Fetch Skills
        const { data: skillsRows } = await supabase
          .from('skills')
          .select('*')
          .order('createdAt', { ascending: false });
        if (!disposed && skillsRows && skillsRows.length > 0) {
          setSkillsState(skillsRows.map((r) => cleanRow<Skill>(r)));
        }

        // Fetch Proposals (Scoped to current authenticated user to prevent data leakage)
        const { data: proposalRows } = await supabase
          .from('proposals')
          .select('*')
          .or(`senderId.eq.${uid},recipientId.eq.${uid},participantIds.cs.{"${uid}"}`)
          .order('createdAt', { ascending: false });
        if (!disposed && proposalRows) {
          setProposalsState(proposalRows.map((r) => cleanRow<SwapProposal>(r)));
        }

        // Fetch Sessions (Scoped to current authenticated user)
        const { data: sessionRows } = await supabase
          .from('sessions')
          .select('*')
          .or(`mentorId.eq.${uid},learnerId.eq.${uid},participantIds.cs.{"${uid}"}`)
          .order('createdAt', { ascending: false });
        if (!disposed && sessionRows) {
          setSessionsState(sessionRows.map((r) => cleanRow<Session>(r)));
        }

        // Fetch Messages (Scoped to current authenticated user)
        const { data: messageRows } = await supabase
          .from('messages')
          .select('*')
          .or(`senderId.eq.${uid},recipientId.eq.${uid},participantIds.cs.{"${uid}"}`)
          .order('createdAt', { ascending: true });
        if (!disposed && messageRows) {
          setMessagesState(messageRows.map((r) => cleanRow<ChatMessage>(r)));
        }

        // Fetch Reviews
        const { data: reviewRows } = await supabase
          .from('reviews')
          .select('*')
          .order('createdAt', { ascending: false });
        if (!disposed && reviewRows && reviewRows.length > 0) {
          setReviewsState(reviewRows.map((r) => cleanRow<Review>(r)));
        }
      } catch (err) {
        console.warn('[CloudBridge] Initial Supabase query warning:', err);
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    fetchData();

    // Subscribe to Supabase Realtime Channel
    const channel = supabase
      .channel('skillswap_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'skills' },
        () => {
          supabase
            .from('skills')
            .select('*')
            .order('createdAt', { ascending: false })
            .then(({ data }) => {
              if (!disposed && data) setSkillsState(data.map((r) => cleanRow<Skill>(r)));
            });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proposals' },
        () => {
          supabase
            .from('proposals')
            .select('*')
            .order('createdAt', { ascending: false })
            .then(({ data }) => {
              if (!disposed && data) {
                const filtered = data
                  .filter((p: any) =>
                    p.senderId === uid ||
                    p.recipientId === uid ||
                    (Array.isArray(p.participantIds) && p.participantIds.includes(uid))
                  )
                  .map((r) => cleanRow<SwapProposal>(r));
                setProposalsState(filtered);
              }
            });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => {
          supabase
            .from('sessions')
            .select('*')
            .order('createdAt', { ascending: false })
            .then(({ data }) => {
              if (!disposed && data) {
                const filtered = data
                  .filter((s: any) =>
                    s.mentorId === uid ||
                    s.learnerId === uid ||
                    (Array.isArray(s.participantIds) && s.participantIds.includes(uid))
                  )
                  .map((r) => cleanRow<Session>(r));
                setSessionsState(filtered);
              }
            });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          supabase
            .from('messages')
            .select('*')
            .order('createdAt', { ascending: true })
            .then(({ data }) => {
              if (!disposed && data) {
                const filtered = data
                  .filter((m: any) =>
                    m.senderId === uid ||
                    m.recipientId === uid ||
                    (Array.isArray(m.participantIds) && m.participantIds.includes(uid))
                  )
                  .map((r) => cleanRow<ChatMessage>(r));
                setMessagesState(filtered);
              }
            });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          supabase
            .from('reviews')
            .select('*')
            .order('createdAt', { ascending: false })
            .then(({ data }) => {
              if (!disposed && data) setReviewsState(data.map((r) => cleanRow<Review>(r)));
            });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${uid}` },
        (payload) => {
          if (!disposed && payload.new) {
            setCurrentUserState(cleanRow<User>(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      disposed = true;
      supabase.removeChannel(channel);
    };
  }, [firebaseUser]);

  return {
    currentUser,
    skills,
    proposals,
    sessions,
    messages,
    reviews,
    loading,
    authenticated,
    error,
    setCurrentUser: setCurrentUserState,
    setSkills: setSkillsState,
    setProposals: setProposalsState,
    setSessions: setSessionsState,
    setMessages: setMessagesState,
    setReviews: setReviewsState,
    updateUserProfileInCloud,
    addSkillToCloud,
    updateSkillInCloud,
    deleteSkillFromCloud,
    addProposalToCloud,
    updateProposalStatusInCloud,
    addSessionToCloud,
    updateSessionInCloud,
    addMessageToCloud,
    markMessageReadInCloud,
    addReviewToCloud,
  };
}
