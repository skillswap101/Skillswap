import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  getDoc,
  deleteDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { db, auth } from '../firebase';
import {
  CURRENT_USER,
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
  currentUser: User;
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

  // Direct Firestore mutation methods
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

function cleanData<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  return {
    id: snapshot.id,
    ...snapshot.data(),
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
  const [currentUser, setCurrentUserState] = useState<User>(() =>
    loadFromOfflineCache('skillswap_user', CURRENT_USER)
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

  // Sync to local offline cache layer
  useEffect(() => {
    try {
      localStorage.setItem('skillswap_user', JSON.stringify(currentUser));
      localStorage.setItem('skillswap_skills', JSON.stringify(skills));
      localStorage.setItem('skillswap_proposals', JSON.stringify(proposals));
      localStorage.setItem('skillswap_sessions', JSON.stringify(sessions));
      localStorage.setItem('skillswap_messages', JSON.stringify(messages));
      localStorage.setItem('skillswap_reviews', JSON.stringify(reviews));
    } catch (e) {
      console.warn('[CloudBridge] Offline cache quota warning:', e);
    }
  }, [currentUser, skills, proposals, sessions, messages, reviews]);

  // Direct Firestore mutation methods
  const addSkillToCloud = useCallback(async (skill: Skill) => {
    try {
      const skillRef = doc(db, 'skills', skill.id);
      await setDoc(
        skillRef,
        {
          ...skill,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSkillsState((prev) => [skill, ...prev.filter((s) => s.id !== skill.id)]);
    } catch (err: any) {
      console.error('[CloudBridge] Error writing skill to Firestore:', err);
      setSkillsState((prev) => [skill, ...prev.filter((s) => s.id !== skill.id)]);
    }
  }, []);

  const updateSkillInCloud = useCallback(async (skillId: string, data: Partial<Skill>) => {
    try {
      const skillRef = doc(db, 'skills', skillId);
      await setDoc(skillRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      setSkillsState((prev) => prev.map((s) => (s.id === skillId ? { ...s, ...data } : s)));
    } catch (err: any) {
      console.error('[CloudBridge] Error updating skill in Firestore:', err);
      setSkillsState((prev) => prev.map((s) => (s.id === skillId ? { ...s, ...data } : s)));
    }
  }, []);

  const deleteSkillFromCloud = useCallback(async (skillId: string) => {
    try {
      await deleteDoc(doc(db, 'skills', skillId));
      setSkillsState((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err: any) {
      console.error('[CloudBridge] Error deleting skill from Firestore:', err);
      setSkillsState((prev) => prev.filter((s) => s.id !== skillId));
    }
  }, []);

  const addProposalToCloud = useCallback(async (proposal: SwapProposal) => {
    try {
      const propRef = doc(db, 'proposals', proposal.id);
      const participantIds = [proposal.senderId, proposal.recipientId].filter(Boolean);
      await setDoc(
        propRef,
        {
          ...proposal,
          participantIds,
          createdAt: proposal.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setProposalsState((prev) => [proposal, ...prev.filter((p) => p.id !== proposal.id)]);
    } catch (err: any) {
      console.error('[CloudBridge] Error writing proposal to Firestore:', err);
      setProposalsState((prev) => [proposal, ...prev.filter((p) => p.id !== proposal.id)]);
    }
  }, []);

  const updateProposalStatusInCloud = useCallback(
    async (proposalId: string, status: SwapProposal['status']) => {
      try {
        const propRef = doc(db, 'proposals', proposalId);
        await setDoc(propRef, { status, updatedAt: new Date().toISOString() }, { merge: true });
        setProposalsState((prev) => prev.map((p) => (p.id === proposalId ? { ...p, status } : p)));
      } catch (err: any) {
        console.error('[CloudBridge] Error updating proposal status in Firestore:', err);
        setProposalsState((prev) => prev.map((p) => (p.id === proposalId ? { ...p, status } : p)));
      }
    },
    []
  );

  const addSessionToCloud = useCallback(async (session: Session) => {
    try {
      const sessRef = doc(db, 'sessions', session.id);
      const participantIds = [session.mentorName, session.learnerName].filter(Boolean);
      await setDoc(
        sessRef,
        {
          ...session,
          participantIds,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSessionsState((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
    } catch (err: any) {
      console.error('[CloudBridge] Error writing session to Firestore:', err);
      setSessionsState((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
    }
  }, []);

  const updateSessionInCloud = useCallback(async (sessionId: string, data: Partial<Session>) => {
    try {
      const sessRef = doc(db, 'sessions', sessionId);
      await setDoc(sessRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      setSessionsState((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s)));
    } catch (err: any) {
      console.error('[CloudBridge] Error updating session in Firestore:', err);
      setSessionsState((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s)));
    }
  }, []);

  const addMessageToCloud = useCallback(async (message: ChatMessage) => {
    try {
      const msgRef = doc(db, 'messages', message.id);
      await setDoc(
        msgRef,
        {
          ...message,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setMessagesState((prev) => [...prev, message]);
    } catch (err: any) {
      console.error('[CloudBridge] Error writing message to Firestore:', err);
      setMessagesState((prev) => [...prev, message]);
    }
  }, []);

  const addReviewToCloud = useCallback(async (review: Review) => {
    try {
      const revRef = doc(db, 'reviews', review.id);
      await setDoc(
        revRef,
        {
          ...review,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setReviewsState((prev) => [review, ...prev.filter((r) => r.id !== review.id)]);
    } catch (err: any) {
      console.error('[CloudBridge] Error writing review to Firestore:', err);
      setReviewsState((prev) => [review, ...prev.filter((r) => r.id !== review.id)]);
    }
  }, []);

  // Intercepting dispatchers that automatically write to Firestore
  const setSkills: Dispatch<SetStateAction<Skill[]>> = useCallback((action) => {
    setSkillsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(next) && next.length > prev.length) {
        const added = next.filter((item) => !prev.some((p) => p.id === item.id));
        added.forEach((item) => {
          setDoc(
            doc(db, 'skills', item.id),
            { ...item, updatedAt: new Date().toISOString() },
            { merge: true }
          ).catch(() => {});
        });
      }
      return next;
    });
  }, []);

  const setProposals: Dispatch<SetStateAction<SwapProposal[]>> = useCallback((action) => {
    setProposalsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(next)) {
        next.forEach((item) => {
          const participantIds = [item.senderId, item.recipientId].filter(Boolean);
          setDoc(
            doc(db, 'proposals', item.id),
            { ...item, participantIds, updatedAt: new Date().toISOString() },
            { merge: true }
          ).catch(() => {});
        });
      }
      return next;
    });
  }, []);

  const setSessions: Dispatch<SetStateAction<Session[]>> = useCallback((action) => {
    setSessionsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(next)) {
        next.forEach((item) => {
          setDoc(
            doc(db, 'sessions', item.id),
            { ...item, updatedAt: new Date().toISOString() },
            { merge: true }
          ).catch(() => {});
        });
      }
      return next;
    });
  }, []);

  const setMessages: Dispatch<SetStateAction<ChatMessage[]>> = useCallback((action) => {
    setMessagesState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(next)) {
        const added = next.filter((item) => !prev.some((p) => p.id === item.id));
        added.forEach((item) => {
          setDoc(
            doc(db, 'messages', item.id),
            { ...item, createdAt: new Date().toISOString() },
            { merge: true }
          ).catch(() => {});
        });
      }
      return next;
    });
  }, []);

  const setReviews: Dispatch<SetStateAction<Review[]>> = useCallback((action) => {
    setReviewsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(next)) {
        const added = next.filter((item) => !prev.some((p) => p.id === item.id));
        added.forEach((item) => {
          setDoc(
            doc(db, 'reviews', item.id),
            { ...item, createdAt: new Date().toISOString() },
            { merge: true }
          ).catch(() => {});
        });
      }
      return next;
    });
  }, []);

  // Main real-time Firestore listeners
  useEffect(() => {
    let disposed = false;
    const unsubscribers: Unsubscribe[] = [];

    const stop = () => {
      unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch {}
      });
      unsubscribers.length = 0;
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      stop();
      if (disposed) return;

      if (!fbUser) {
        uidRef.current = null;
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        uidRef.current = fbUser.uid;
        setAuthenticated(true);
        setLoading(true);

        // 1. Sync User Document
        const userRef = doc(db, 'users', fbUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUserState({ id: fbUser.uid, ...userSnap.data() } as User);
        }

        // 2. Realtime Skills
        const skillsQuery = query(collection(db, 'skills'));
        unsubscribers.push(
          onSnapshot(
            skillsQuery,
            (snapshot) => {
              if (disposed) return;
              if (!snapshot.empty) {
                setSkillsState(snapshot.docs.map((d) => cleanData<Skill>(d)));
              }
            },
            (err) => console.warn('[CloudBridge] skills sync warning:', err)
          )
        );

        // 3. Realtime Proposals
        const proposalsQuery = query(collection(db, 'proposals'));
        unsubscribers.push(
          onSnapshot(
            proposalsQuery,
            (snapshot) => {
              if (disposed) return;
              if (!snapshot.empty) {
                setProposalsState(snapshot.docs.map((d) => cleanData<SwapProposal>(d)));
              }
            },
            (err) => console.warn('[CloudBridge] proposals sync warning:', err)
          )
        );

        // 4. Realtime Sessions
        const sessionsQuery = query(collection(db, 'sessions'));
        unsubscribers.push(
          onSnapshot(
            sessionsQuery,
            (snapshot) => {
              if (disposed) return;
              if (!snapshot.empty) {
                setSessionsState(snapshot.docs.map((d) => cleanData<Session>(d)));
              }
            },
            (err) => console.warn('[CloudBridge] sessions sync warning:', err)
          )
        );

        // 5. Realtime Messages
        const messagesQuery = query(collection(db, 'messages'));
        unsubscribers.push(
          onSnapshot(
            messagesQuery,
            (snapshot) => {
              if (disposed) return;
              if (!snapshot.empty) {
                setMessagesState(snapshot.docs.map((d) => cleanData<ChatMessage>(d)));
              }
            },
            (err) => console.warn('[CloudBridge] messages sync warning:', err)
          )
        );

        // 6. Realtime Reviews
        const reviewsQuery = query(collection(db, 'reviews'));
        unsubscribers.push(
          onSnapshot(
            reviewsQuery,
            (snapshot) => {
              if (disposed) return;
              if (!snapshot.empty) {
                setReviewsState(snapshot.docs.map((d) => cleanData<Review>(d)));
              }
            },
            (err) => console.warn('[CloudBridge] reviews sync warning:', err)
          )
        );

        if (!disposed) setLoading(false);
      } catch (err: any) {
        console.error('[CloudBridge] listener setup error:', err);
        if (!disposed) {
          setError(err.message || 'Cloud synchronization failed.');
          setLoading(false);
        }
      }
    });

    return () => {
      disposed = true;
      stop();
      unsubscribeAuth();
    };
  }, []);

  const setCurrentUser = useCallback((action: User | ((prev: User) => User)) => {
    setCurrentUserState((prev) => {
      const nextUser = typeof action === 'function' ? action(prev) : action;
      const uid = uidRef.current || nextUser.id;
      if (uid) {
        const userRef = doc(db, 'users', uid);
        setDoc(userRef, { ...nextUser, id: uid, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
      return nextUser;
    });
  }, []);

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
    setCurrentUser,
    setSkills,
    setProposals,
    setSessions,
    setMessages,
    setReviews,
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
