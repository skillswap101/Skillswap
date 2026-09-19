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
import {
  INITIAL_SKILLS,
  INITIAL_PROPOSALS,
  INITIAL_SESSIONS,
  INITIAL_MESSAGES,
  INITIAL_REVIEWS,
} from '../data/mockData';
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
  addSkillToCloud: (skill: Skill) => Promise<void>;
  updateSkillInCloud: (skillId: string, data: Partial<Skill>) => Promise<void>;
  deleteSkillFromCloud: (skillId: string) => Promise<void>;

  addProposalToCloud: (proposal: SwapProposal) => Promise<void>;
  updateProposalStatusInCloud: (proposalId: string, status: SwapProposal['status']) => Promise<void>;

  addSessionToCloud: (session: Session) => Promise<void>;
  updateSessionInCloud: (sessionId: string, data: Partial<Session>) => Promise<void>;

  addMessageToCloud: (message: ChatMessage) => Promise<void>;
  addReviewToCloud: (review: Review) => Promise<void>;
}

function cleanRow<T>(row: any): T {
  if (!row) return row;
  const raw = row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
  return {
    ...raw,
    ...row,
    id: String(row.id || raw.id),
  } as T;
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
    loadFromOfflineCache('skillswap_skills', INITIAL_SKILLS)
  );

  const [proposals, setProposalsState] = useState<SwapProposal[]>(() =>
    loadFromOfflineCache('skillswap_proposals', INITIAL_PROPOSALS)
  );

  const [sessions, setSessionsState] = useState<Session[]>(() =>
    loadFromOfflineCache('skillswap_sessions', INITIAL_SESSIONS)
  );

  const [messages, setMessagesState] = useState<ChatMessage[]>(() =>
    loadFromOfflineCache('skillswap_messages', INITIAL_MESSAGES)
  );

  const [reviews, setReviewsState] = useState<Review[]>(() =>
    loadFromOfflineCache('skillswap_reviews', INITIAL_REVIEWS)
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
      setError("Authentication required.");
    }
  }, [userProfile, firebaseUser, authLoading]);

  // Sync to local offline cache
  useEffect(() => {
    try {
      localStorage.setItem('skillswap_skills', JSON.stringify(skills));
      localStorage.setItem('skillswap_proposals', JSON.stringify(proposals));
      localStorage.setItem('skillswap_sessions', JSON.stringify(sessions));
      localStorage.setItem('skillswap_messages', JSON.stringify(messages));
      localStorage.setItem('skillswap_reviews', JSON.stringify(reviews));
    } catch (e) {
      console.warn('[CloudBridge] Offline cache quota warning:', e);
    }
  }, [skills, proposals, sessions, messages, reviews]);

  // Direct mutation methods
  const addSkillToCloud = useCallback(async (skill: Skill) => {
    const uid = requireAuthenticatedUser();
    try {
      const payload = {
        ...skill,
        userId: uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        raw_data: skill,
      };
      const { error } = await supabase.from('skills').upsert(payload);
      if (error) throw new Error(error.message);
      setSkillsState((prev) => [skill, ...prev.filter((s) => s.id !== skill.id)]);
    } catch (err: any) {
      console.error('[CloudBridge] Error writing skill to Supabase:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const updateSkillInCloud = useCallback(async (skillId: string, data: Partial<Skill>) => {
    requireAuthenticatedUser();
    try {
      const payload = {
        ...data,
        updatedAt: new Date().toISOString(),
        raw_data: data,
      };
      const { error } = await supabase.from('skills').update(payload).eq('id', skillId);
      if (error) throw new Error(error.message);
      setSkillsState((prev) => prev.map((s) => (s.id === skillId ? { ...s, ...data } : s)));
    } catch (err: any) {
      console.error('[CloudBridge] Error updating skill in Supabase:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const deleteSkillFromCloud = useCallback(async (skillId: string) => {
    requireAuthenticatedUser();
    try {
      const { error } = await supabase.from('skills').delete().eq('id', skillId);
      if (error) throw new Error(error.message);
      setSkillsState((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err: any) {
      console.error('[CloudBridge] Error deleting skill from Supabase:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const addProposalToCloud = useCallback(async (proposal: SwapProposal) => {
    const uid = requireAuthenticatedUser();
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
      setProposalsState((prev) => [proposal, ...prev.filter((p) => p.id !== proposal.id)]);
    } catch (err: any) {
      console.error('[CloudBridge] Error saving proposal to Supabase:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const updateProposalStatusInCloud = useCallback(async (
    proposalId: string,
    status: SwapProposal['status']
  ) => {
    requireAuthenticatedUser();
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status, updatedAt: new Date().toISOString() })
        .eq('id', proposalId);
      if (error) throw new Error(error.message);
      setProposalsState((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status } : p))
      );
    } catch (err: any) {
      console.error('[CloudBridge] Error updating proposal status in Supabase:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const addSessionToCloud = useCallback(async (session: Session) => {
    const uid = requireAuthenticatedUser();
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        raw_data: session,
      };
      const { error } = await supabase.from('sessions').upsert(payload);
      if (error) throw new Error(error.message);
      setSessionsState((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
    } catch (err: any) {
      console.error('[CloudBridge] Error saving session to Supabase:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const updateSessionInCloud = useCallback(async (sessionId: string, data: Partial<Session>) => {
    requireAuthenticatedUser();
    try {
      const payload = {
        ...data,
        updatedAt: new Date().toISOString(),
        raw_data: data,
      };
      const { error } = await supabase.from('sessions').update(payload).eq('id', sessionId);
      if (error) throw new Error(error.message);
      setSessionsState((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s))
      );
    } catch (err: any) {
      console.error('[CloudBridge] Error updating session in Supabase:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const addMessageToCloud = useCallback(async (message: ChatMessage) => {
    const uid = requireAuthenticatedUser();
    try {
      const participantIds = Array.from(
        new Set([uid, message.senderId, message.recipientId, ...(message.participantIds || [])].filter(Boolean))
      ) as string[];

      const payload = {
        ...message,
        participantIds,
        createdAt: new Date().toISOString(),
        raw_data: message,
      };
      const { error } = await supabase.from('messages').insert(payload);
      if (error) throw new Error(error.message);
      setMessagesState((prev) => [...prev, message]);
    } catch (err: any) {
      console.error('[CloudBridge] Error sending message to Supabase:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const addReviewToCloud = useCallback(async (review: Review) => {
    requireAuthenticatedUser();
    try {
      const payload = {
        ...review,
        createdAt: new Date().toISOString(),
        raw_data: review,
      };
      const { error } = await supabase.from('reviews').insert(payload);
      if (error) throw new Error(error.message);
      setReviewsState((prev) => [review, ...prev.filter((r) => r.id !== review.id)]);
    } catch (err: any) {
      console.error('[CloudBridge] Error saving review to Supabase:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  // Supabase Real-time Subscriptions and Queries
  useEffect(() => {
    let disposed = false;

    if (!firebaseUser) {
      uidRef.current = null;
      setAuthenticated(false);
      setLoading(false);
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

        // Fetch Proposals
        const { data: proposalRows } = await supabase
          .from('proposals')
          .select('*')
          .order('createdAt', { ascending: false });
        if (!disposed && proposalRows) {
          const userProposals = proposalRows
            .filter((p: any) =>
              p.senderId === uid ||
              p.recipientId === uid ||
              (Array.isArray(p.participantIds) && p.participantIds.includes(uid))
            )
            .map((r) => cleanRow<SwapProposal>(r));
          if (userProposals.length > 0) setProposalsState(userProposals);
        }

        // Fetch Sessions
        const { data: sessionRows } = await supabase
          .from('sessions')
          .select('*')
          .order('createdAt', { ascending: false });
        if (!disposed && sessionRows) {
          const userSessions = sessionRows
            .filter((s: any) =>
              s.mentorId === uid ||
              s.learnerId === uid ||
              (Array.isArray(s.participantIds) && s.participantIds.includes(uid))
            )
            .map((r) => cleanRow<Session>(r));
          if (userSessions.length > 0) setSessionsState(userSessions);
        }

        // Fetch Messages
        const { data: messageRows } = await supabase
          .from('messages')
          .select('*')
          .order('createdAt', { ascending: true });
        if (!disposed && messageRows) {
          const userMessages = messageRows
            .filter((m: any) =>
              m.senderId === uid ||
              m.recipientId === uid ||
              (Array.isArray(m.participantIds) && m.participantIds.includes(uid))
            )
            .map((r) => cleanRow<ChatMessage>(r));
          if (userMessages.length > 0) setMessagesState(userMessages);
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
    addSkillToCloud,
    updateSkillInCloud,
    deleteSkillFromCloud,
    addProposalToCloud,
    updateProposalStatusInCloud,
    addSessionToCloud,
    updateSessionInCloud,
    addMessageToCloud,
    addReviewToCloud,
  };
}
