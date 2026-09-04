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
  where,
  setDoc,
  getDoc,
  deleteDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import { db, isFirebaseConfigured } from '../firebase';
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
  const { currentUser: firebaseUser, userProfile, loading: authLoading, updateUserProfile } = useAuth();

  // Firebase Auth + Firestore profile are the authoritative identity source.
  // localStorage is intentionally NOT used to initialize currentUser.
  // Identity is supplied by AuthContext/Firestore only.
  // An empty structural object is used only while Firebase Auth/Firestore
  // is resolving. It is never treated as authenticated identity.
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
    if (!isFirebaseConfigured || !firebaseUser) {
      throw new Error("Authenticated Firebase user required.");
    }

    return firebaseUser.uid;
  }, [firebaseUser]);
  // Phase 1 identity synchronization:
  // Firebase Auth/AuthContext is authoritative. Never restore an old
  // skillswap_user or CURRENT_USER as an authenticated identity.
  useEffect(() => {
    // Firebase Auth is authoritative.
    // Do not declare the user unauthenticated while Firebase is still
    // restoring the persisted session.
    if (authLoading) {
      setAuthenticated(false);
      setError(null);
      return;
    }

    if (firebaseUser) {
      uidRef.current = firebaseUser.uid;
      setAuthenticated(true);

      if (userProfile) {
        // Never allow a Firestore/client supplied ID to replace Firebase UID.
        setCurrentUserState({
          ...(userProfile as User),
          id: firebaseUser.uid,
        });
      }

      setError(null);
      return;
    }

    // No Firebase identity exists.
    uidRef.current = null;
    setAuthenticated(false);

    // Do not restore CURRENT_USER or skillswap_user.
    if (!authLoading) {
      setCurrentUserState(null);
      setError("Authentication required.");
    }
  }, [userProfile, firebaseUser, authLoading]);


  // Sync to local offline cache layer
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

  // Direct Firestore mutation methods
  const addSkillToCloud = useCallback(async (skill: Skill) => {
    const uid = requireAuthenticatedUser();

    try {
      const skillRef = doc(db, 'skills', skill.id);
      if (skill.userId && skill.userId !== uid) {
        throw new Error("Cannot create a skill for another user");
      }

      await setDoc(
        skillRef,
        {
          ...skill,
          userId: uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSkillsState((prev) => [skill, ...prev.filter((s) => s.id !== skill.id)]);
    } catch (err: any) {
      console.error('[CloudBridge] Error writing skill to Firestore:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const updateSkillInCloud = useCallback(async (skillId: string, data: Partial<Skill>) => {
    requireAuthenticatedUser();

    try {
      const skillRef = doc(db, 'skills', skillId);
      if ("userId" in data && data.userId !== uidRef.current) {
        throw new Error("Cannot change skill ownership");
      }

      await setDoc(
        skillRef,
        { ...data, ...(data.userId ? { userId: uidRef.current } : {}), updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setSkillsState((prev) => prev.map((s) => (s.id === skillId ? { ...s, ...data } : s)));
    } catch (err: any) {
      console.error('[CloudBridge] Error updating skill in Firestore:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const deleteSkillFromCloud = useCallback(async (skillId: string) => {
    requireAuthenticatedUser();

    try {
      await deleteDoc(doc(db, 'skills', skillId));
      setSkillsState((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err: any) {
      console.error('[CloudBridge] Error deleting skill from Firestore:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const addProposalToCloud = useCallback(async (proposal: SwapProposal) => {
    requireAuthenticatedUser();

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
      throw err;
    }
  }, [requireAuthenticatedUser]);

  // Phase 2 authentication guard:
  // Every cloud mutation requires a Firebase-authenticated caller.
  const updateProposalStatusInCloud = useCallback(
    async (proposalId: string, status: SwapProposal['status']) => {
      requireAuthenticatedUser();

      try {
        const propRef = doc(db, 'proposals', proposalId);
        await setDoc(propRef, { status, updatedAt: new Date().toISOString() }, { merge: true });
        setProposalsState((prev) => prev.map((p) => (p.id === proposalId ? { ...p, status } : p)));
      } catch (err: any) {
        console.error('[CloudBridge] Error updating proposal status in Firestore:', err);
        throw err;
      }
    },
    [requireAuthenticatedUser]
  );

  const addSessionToCloud = useCallback(async (session: Session) => {
    requireAuthenticatedUser();

    try {
      const sessRef = doc(db, 'sessions', session.id);
      const participantIds = [session.mentorId, session.learnerId].filter(Boolean);
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
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const updateSessionInCloud = useCallback(async (sessionId: string, data: Partial<Session>) => {
    requireAuthenticatedUser();

    try {
      const sessRef = doc(db, 'sessions', sessionId);
      await setDoc(sessRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      setSessionsState((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s)));
    } catch (err: any) {
      console.error('[CloudBridge] Error updating session in Firestore:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const addMessageToCloud = useCallback(async (message: ChatMessage) => {
    requireAuthenticatedUser();

    try {
      const msgRef = doc(db, 'messages', message.id);
      const participantIds = [message.senderId, message.recipientId].filter(Boolean);
      await setDoc(
        msgRef,
        {
          ...message,
          participantIds,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setMessagesState((prev) => [...prev, message]);
    } catch (err: any) {
      console.error('[CloudBridge] Error writing message to Firestore:', err);
      throw err;
    }
  }, [requireAuthenticatedUser]);

  const addReviewToCloud = useCallback(async (review: Review) => {
    requireAuthenticatedUser();

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
      throw err;
    }
  }, [requireAuthenticatedUser]);

  // Intercepting dispatchers that automatically write to Firestore
  const setSkills: Dispatch<SetStateAction<Skill[]>> = useCallback((action) => {
    if (!firebaseUser) {
      console.warn('[CloudBridge] Ignoring cloud mutation without Firebase authentication.');
      return;
    }
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
    if (!firebaseUser) {
      console.warn('[CloudBridge] Ignoring cloud mutation without Firebase authentication.');
      return;
    }
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
    if (!firebaseUser) {
      console.warn('[CloudBridge] Ignoring cloud mutation without Firebase authentication.');
      return;
    }
    setSessionsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(next)) {
        next.forEach((item) => {
          const participantIds = [item.mentorId, item.learnerId].filter(Boolean);
          setDoc(
            doc(db, 'sessions', item.id),
            { ...item, participantIds, updatedAt: new Date().toISOString() },
            { merge: true }
          ).catch(() => {});
        });
      }
      return next;
    });
  }, []);

  const setMessages: Dispatch<SetStateAction<ChatMessage[]>> = useCallback((action) => {
    if (!firebaseUser) {
      console.warn('[CloudBridge] Ignoring cloud mutation without Firebase authentication.');
      return;
    }
    setMessagesState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(next)) {
        const added = next.filter((item) => !prev.some((p) => p.id === item.id));
        added.forEach((item) => {
          const participantIds = [item.senderId, item.recipientId].filter(Boolean);
          setDoc(
            doc(db, 'messages', item.id),
            { ...item, participantIds, createdAt: new Date().toISOString() },
            { merge: true }
          ).catch(() => {});
        });
      }
      return next;
    });
  }, []);

  const setReviews: Dispatch<SetStateAction<Review[]>> = useCallback((action) => {
    if (!firebaseUser) {
      console.warn('[CloudBridge] Ignoring cloud mutation without Firebase authentication.');
      return;
    }
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
        try { unsub(); } catch {}
      });
      unsubscribers.length = 0;
    };

    if (!isFirebaseConfigured || !firebaseUser) {
      uidRef.current = null;
      setAuthenticated(false);
      setLoading(false);
      return () => stop();
    }

    const uid = firebaseUser.uid;
    uidRef.current = uid;
    setAuthenticated(true);
    setLoading(true);

    const setup = async () => {
      try {
        // Previously a one-time getDoc() - meaning any server-side change
        // to this user's document (credits released from escrow, credits
        // purchased and fulfilled via a payment webhook) would never show
        // up in the UI until the next full reload. Now a live listener,
        // same as every other collection here.
        const userRef = doc(db, 'users', uid);
        unsubscribers.push(onSnapshot(userRef, (snap) => {
          if (!disposed && snap.exists()) {
            setCurrentUserState({ id: uid, ...snap.data() } as User);
          }
        }, (err) => console.warn('[CloudBridge] user profile sync warning:', err)));

        // `skills` and `reviews` are intentionally public (marketplace
        // browsing, profile reviews) and stay unscoped, matching their
        // Firestore rules (`allow read: if signedIn()`).
        const skillsQuery = query(collection(db, 'skills'));
        unsubscribers.push(onSnapshot(skillsQuery, (snapshot) => {
          if (!disposed && !snapshot.empty) setSkillsState(snapshot.docs.map((d) => cleanData<Skill>(d)));
        }, (err) => console.warn('[CloudBridge] skills sync warning:', err)));

        // proposals/sessions/messages previously queried the ENTIRE
        // collection with no filter, relying only on per-document security
        // rules to reject what a user shouldn't see. Every authenticated
        // user was subscribing to every proposal/session/message in the
        // database. Now scoped server-side to only what this uid actually
        // participates in.
        const proposalsQuery = query(collection(db, 'proposals'), where('participantIds', 'array-contains', uid));
        unsubscribers.push(onSnapshot(proposalsQuery, (snapshot) => {
          if (!disposed) setProposalsState(snapshot.docs.map((d) => cleanData<SwapProposal>(d)));
        }, (err) => console.warn('[CloudBridge] proposals sync warning:', err)));

        const sessionsQuery = query(collection(db, 'sessions'), where('participantIds', 'array-contains', uid));
        unsubscribers.push(onSnapshot(sessionsQuery, (snapshot) => {
          if (!disposed) setSessionsState(snapshot.docs.map((d) => cleanData<Session>(d)));
        }, (err) => console.warn('[CloudBridge] sessions sync warning:', err)));

        const messagesQuery = query(collection(db, 'messages'), where('participantIds', 'array-contains', uid));
        unsubscribers.push(onSnapshot(messagesQuery, (snapshot) => {
          if (!disposed) setMessagesState(snapshot.docs.map((d) => cleanData<ChatMessage>(d)));
        }, (err) => console.warn('[CloudBridge] messages sync warning:', err)));

        const reviewsQuery = query(collection(db, 'reviews'));
        unsubscribers.push(onSnapshot(reviewsQuery, (snapshot) => {
          if (!disposed && !snapshot.empty) setReviewsState(snapshot.docs.map((d) => cleanData<Review>(d)));
        }, (err) => console.warn('[CloudBridge] reviews sync warning:', err)));

        if (!disposed) setLoading(false);
      } catch (err: any) {
        console.error('[CloudBridge] listener setup failed:', err);
        if (!disposed) {
          setError(err?.message || 'Cloud synchronization failed');
          setLoading(false);
        }
      }
    };

    setup();
    return () => {
      disposed = true;
      stop();
    };
  }, [firebaseUser, authLoading]);

  const setCurrentUser = useCallback(
    (action: User | ((prev: User) => User)) => {
      setCurrentUserState((prev) => {
        const uid = firebaseUser?.uid;

        // Firebase Authentication is the authoritative identity.
        // Never create or mutate an authenticated local identity
        // without a real Firebase user.
        if (!uid) {
          console.warn(
            '[CloudBridge] Ignoring currentUser mutation without Firebase authentication.'
          );
          return prev;
        }

        const nextUser =
          typeof action === 'function'
            ? action(prev as User)
            : action;

        // The Firebase UID cannot be changed by UI state.
        // A caller attempting to inject another ID is rejected.
        if (nextUser.id && nextUser.id !== uid) {
          console.warn(
            '[CloudBridge] Ignoring attempted identity change from Firebase UID.'
          );
          return prev;
        }

        const safeUser: User = {
          ...nextUser,
          id: uid,
        };

        // Persist profile changes through the authoritative
        // AuthContext/Firestore profile layer.
        void updateUserProfile(safeUser).catch((err) => {
          console.error(
            '[CloudBridge] Profile update failed:',
            err
          );
        });

        return safeUser;
      });
    },
    [firebaseUser, updateUserProfile]
  );


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
